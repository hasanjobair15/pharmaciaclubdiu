import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "Account type API is working",
  });
}
