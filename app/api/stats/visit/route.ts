import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* Visitor counters are persisted as a small JSON object in the EXISTING
   committee-photos storage bucket (no new database table, no DDL).
   The service-role key is used here ONLY — never shipped to the browser. */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const BUCKET = "committee-photos";
const FILE_PATH = "site-stats/visitors.json";

type Stats = {
  total: number;
  byDay: Record<string, number>;
  active: Record<string, number>; // sessionId → lastSeen (epoch seconds)
};

function dayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function emptyStats(): Stats {
  return { total: 0, byDay: {}, active: {} };
}

async function readStats(): Promise<Stats> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET)
      .download(FILE_PATH);

    if (error || !data) return emptyStats();

    const text = await data.text();
    const parsed = JSON.parse(text);

    return {
      total: Number(parsed.total) || 0,
      byDay: parsed.byDay && typeof parsed.byDay === "object" ? parsed.byDay : {},
      active: parsed.active && typeof parsed.active === "object" ? parsed.active : {},
    };
  } catch {
    return emptyStats();
  }
}

async function writeStats(stats: Stats) {
  const payload = JSON.stringify(stats);

  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(FILE_PATH, payload, {
      contentType: "application/json",
      upsert: true,
      cacheControl: "0",
    });

  return !error;
}

/** Prune active sessions older than 5 minutes; drop day keys older than 400 days. */
function prune(stats: Stats): Stats {
  const now = Math.floor(Date.now() / 1000);
  const cutoff = now - 5 * 60;

  const active: Record<string, number> = {};
  for (const [sid, ts] of Object.entries(stats.active)) {
    if (ts > cutoff) active[sid] = ts;
  }

  const oldest = dayKey(new Date(Date.now() - 400 * 24 * 3600 * 1000));
  const byDay: Record<string, number> = {};
  for (const [day, count] of Object.entries(stats.byDay)) {
    if (day >= oldest) byDay[day] = count;
  }

  return { ...stats, active, byDay };
}

/* GET — current snapshot (live now, today, total) */
export async function GET() {
  try {
    const stats = await readStats();
    const todayKey = dayKey();
    const today = stats.byDay[todayKey] || 0;
    const now = Math.floor(Date.now() / 1000);
    const liveNow = Object.values(stats.active).filter((ts) => now - ts < 5 * 60).length;

    return NextResponse.json({
      liveNow,
      today,
      total: stats.total,
    });
  } catch {
    return NextResponse.json(
      { error: "Unable to read visitor stats." },
      { status: 500 }
    );
  }
}

/* POST — record a visit (count once per browser session) + heartbeat */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));

    const sid =
      typeof body.sid === "string" && body.sid.length > 0
        ? body.sid.slice(0, 64)
        : "anon";

    const now = Math.floor(Date.now() / 1000);

    /* Retry a few times: concurrent visits can collide on read-modify-write */
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const stats = prune(await readStats());

      const firstVisit = !stats.active[sid];

      if (firstVisit && body.count) {
        stats.total += 1;
        const key = dayKey();
        stats.byDay[key] = (stats.byDay[key] || 0) + 1;
      }

      stats.active[sid] = now;

      const ok = await writeStats(stats);
      if (ok) {
        return NextResponse.json({ ok: true });
      }

      await new Promise((resolve) => setTimeout(resolve, 120 + attempt * 120));
    }

    return NextResponse.json(
      { error: "Could not record the visit." },
      { status: 500 }
    );
  } catch {
    return NextResponse.json(
      { error: "Could not record the visit." },
      { status: 500 }
    );
  }
}
