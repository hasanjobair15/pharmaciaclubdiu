"use client";

import { useState } from "react";

type SharePlatform = "facebook" | "messenger" | "instagram" | "whatsapp" | "copy" | "native";

const PLATFORMS: {
  id: SharePlatform;
  label: string;
  icon: string;
  color: string;
}[] = [
  { id: "facebook", label: "Facebook", icon: "f", color: "#1877F2" },
  { id: "messenger", label: "Messenger", icon: "m", color: "#0084FF" },
  { id: "instagram", label: "Instagram", icon: "▣", color: "#E1306C" },
  { id: "whatsapp", label: "WhatsApp", icon: "w", color: "#25D366" },
  { id: "copy", label: "Copy Link", icon: "⧉", color: "#64748B" },
  { id: "native", label: "More…", icon: "↗", color: "#0f172a" },
];

export default function NewsShare({
  title,
  imageUrl,
}: {
  title: string;
  imageUrl: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = typeof window !== "undefined" ? window.location.href : "";
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedImage = imageUrl ? encodeURIComponent(imageUrl) : "";

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      /* clipboard unavailable — fall back to a prompt */
      window.prompt("Copy the news link:", url);
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
    setOpen(false);
  }

  async function nativeShare() {
    const shareData: ShareData = {
      title,
      text: title,
      url,
    };

    if (imageUrl && "canShare" in navigator) {
      try {
        const blob = await fetch(imageUrl).then((r) => r.blob());

        if (blob.type.startsWith("image/")) {
          const file = new File([blob], "cover.jpg", {
            type: blob.type || "image/jpeg",
          });

          if (navigator.canShare({ files: [file] } as ShareData)) {
            shareData.files = [file];
          }
        }
      } catch {
        /* image fetch failed — share text/link only */
      }
    }

    try {
      await navigator.share(shareData);
    } catch {
      /* user cancelled — ignore */
    }

    setOpen(false);
  }

  function openPlatform(platform: SharePlatform) {
    switch (platform) {
      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
          "_blank",
          "noopener,noreferrer,width=600,height=500"
        );
        break;

      case "messenger":
        /* Messenger has no URL-only share dialog on desktop web; use the
           mobile deep link, falling back to Facebook's send dialog. */
        window.open(
          `https://www.facebook.com/dialog/send?link=${encodedUrl}&redirect_uri=${encodedUrl}`,
          "_blank",
          "noopener,noreferrer,width=600,height=600"
        );
        break;

      case "instagram":
        /* Instagram has no web share URL — open the site with the link
           copied so the user can paste it into a story/caption. */
        navigator.clipboard?.writeText(`${title} ${url}`).catch(() => {});
        window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
        break;

      case "whatsapp":
        window.open(
          `https://wa.me/?text=${encodedTitle}%20${encodedUrl}${
            encodedImage ? `%20${encodedImage}` : ""
          }`,
          "_blank",
          "noopener,noreferrer,width=600,height=600"
        );
        break;

      case "copy":
        copyLink();
        return;

      case "native":
        nativeShare();
        return;
    }

    setOpen(false);
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label="Share this news"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-[#087f8c] hover:text-[#087f8c] dark:border-slate-700 dark:bg-[#111827] dark:text-slate-200 dark:hover:border-[#2dd4bf] dark:hover:text-[#2dd4bf]"
      >
        <span aria-hidden>↗</span>
        {copied ? "Link Copied!" : "Share"}
      </button>

      {open && (
        <>
          {/* click-away layer */}
          <button
            type="button"
            aria-label="Close share menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />

          <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-[#111827]">
            <p className="border-b border-slate-100 px-4 py-3 text-xs font-bold uppercase tracking-wide text-slate-400 dark:border-slate-800">
              Share this news
            </p>

            <div className="grid grid-cols-3 gap-1 p-2">
              {PLATFORMS.map((platform) => {
                const isNative = platform.id === "native";

                if (
                  isNative &&
                  typeof navigator !== "undefined" &&
                  !navigator.share
                ) {
                  return null;
                }

                return (
                  <button
                    key={platform.id}
                    type="button"
                    onClick={() => openPlatform(platform.id)}
                    className="flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <span
                      aria-hidden
                      className="flex h-10 w-10 items-center justify-center rounded-full text-base font-black text-white"
                      style={{ backgroundColor: platform.color }}
                    >
                      {platform.icon}
                    </span>

                    {platform.label}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
