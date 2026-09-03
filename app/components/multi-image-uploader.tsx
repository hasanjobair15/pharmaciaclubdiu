"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import imageCompression from "browser-image-compression";
import {
  validateImageFile,
  isValidImageUrl,
  imageExtensionFor,
  MAX_IMAGE_MB,
} from "@/lib/images";

type ItemStatus = "uploading" | "done" | "error";

type Item = {
  key: string;
  url: string | null;
  previewUrl: string | null;
  fileName: string;
  status: ItemStatus;
  error: string | null;
};

type Props = {
  /** Committed image URLs (single string or array strings) */
  value: string[];
  onChange: (urls: string[]) => void;
  /** Storage folder inside the committee-photos bucket, e.g. "gallery" */
  folder: string;
  /** Form id used to keyboard-focus the drop area */
  inputId?: string;
};

let itemCounter = 0;
const nextKey = () => `img-${Date.now()}-${itemCounter++}`;

export default function MultiImageUploader({ value, onChange, folder, inputId }: Props) {
  const supabase = createClient();

  const [items, setItems] = useState<Item[]>([]);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState("");
  const [pasting, setPasting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [banner, setBanner] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const urlInputRef = useRef<HTMLInputElement | null>(null);

  /* Rebuild the list only when the parent changes it from the outside
     (reset after save, loading an existing post into edit mode).
     Uploads in this component emit through onChange, which we ignore here
     by tracking the last value we emitted ourselves. */
  const lastEmittedRef = useRef<string>("");
  useEffect(() => {
    const valueStr = JSON.stringify(value);
    if (valueStr === lastEmittedRef.current) return;
    lastEmittedRef.current = valueStr;
    setItems(
      value.map((url) => ({
        key: nextKey(),
        url,
        previewUrl: null,
        fileName: "Image",
        status: "done" as const,
        error: null,
      }))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value)]);

  const commitUrls = useCallback(
    (current: Item[]) => {
      const urls = current
        .map((i) => i.url)
        .filter((u): u is string => Boolean(u));
      lastEmittedRef.current = JSON.stringify(urls);
      onChange(urls);
    },
    [onChange]
  );

  async function addFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    if (files.length === 0) return;

    for (const file of files) {
      const invalid = validateImageFile(file);
      const key = nextKey();
      if (invalid) {
        setItems((prev) => [
          ...prev,
          {
            key,
            url: null,
            previewUrl: URL.createObjectURL(file),
            fileName: file.name || "Pasted image",
            status: "error",
            error: invalid,
          },
        ]);
        setBanner(invalid);
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      setItems((prev) => [
        ...prev,
        {
          key,
          url: null,
          previewUrl,
          fileName: file.name || "Pasted image",
          status: "uploading",
          error: null,
        },
      ]);

      try {
        const url = await uploadOne(file);
        setItems((prev) => {
          const next = prev.map((i) =>
            i.key === key ? { ...i, url, status: "done" as const, error: null } : i
          );
          commitUrls(next);
          return next;
        });
      } catch (err) {
        setItems((prev) =>
          prev.map((i) =>
            i.key === key
              ? {
                  ...i,
                  status: "error" as const,
                  error: err instanceof Error ? err.message : "Upload failed. Please try again.",
                }
              : i
          )
        );
        setBanner(
          `"${file.name || "Pasted image"}" could not be uploaded — ${
            err instanceof Error ? err.message : "please try again."
          }`
        );
      }
    }
  }

  async function uploadOne(file: File): Promise<string> {
    let outFile = file;
    try {
      // Convert heavy JPG/PNG to a lighter WebP (never GIF/AVIF — keep them as-is)
      if (file.type === "image/jpeg" || file.type === "image/png" || file.type === "image/webp") {
        outFile = await imageCompression(file, {
          maxSizeMB: 1.5,
          maxWidthOrHeight: 1600,
          useWebWorker: true,
          fileType: file.type === "image/webp" ? "image/webp" : "image/webp",
          initialQuality: 0.82,
        });
      }
    } catch {
      outFile = file;
    }

    const ext = imageExtensionFor(outFile);
    const fileName = `${folder}/${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 8)}.${ext}`;

    const { error } = await supabase.storage
      .from("committee-photos")
      .upload(fileName, outFile, {
        contentType: outFile.type || "image/jpeg",
        upsert: false,
        cacheControl: "3600",
      });

    if (error) {
      const msg =
        error.message?.includes("row-level security") || error.message?.includes("permission")
          ? "the server blocked this upload (permission). Please contact the site admin."
          : error.message || "the storage service rejected the file.";
      throw new Error(msg);
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("committee-photos").getPublicUrl(fileName);

    return publicUrl;
  }

  async function handlePasteImage() {
    setPasting(true);
    setBanner("");
    try {
      if (!navigator.clipboard || typeof navigator.clipboard.read !== "function") {
        setBanner(
          "Clipboard image reading is not supported in this browser. Use Ctrl+V inside the drop area, or upload from your computer."
        );
        setPasting(false);
        return;
      }
      const clipItems = await navigator.clipboard.read();
      const files: File[] = [];
      for (const item of clipItems) {
        for (const type of item.types) {
          if (type.startsWith("image/")) {
            const blob = await item.getType(type);
            files.push(new File([blob], `pasted-${Date.now()}.png`, { type }));
          }
        }
      }
      if (files.length === 0) {
        setBanner("No image found in your clipboard. Copy an image first, then try again.");
      } else {
        await addFiles(files);
      }
    } catch {
      setBanner(
        "Could not read your clipboard. Allow clipboard access, or use Ctrl+V inside the drop area below."
      );
    } finally {
      setPasting(false);
    }
  }

  function handleUrlAdd() {
    const invalid = isValidImageUrl(urlInput);
    if (invalid) {
      setUrlError(invalid);
      return;
    }
    const url = urlInput.trim();
    setUrlError("");

    // Verify the URL actually loads as an image before committing it.
    const probe = new Image();
    const timer = window.setTimeout(() => {
      setUrlError("That URL is taking too long to load. Check the link and try again.");
    }, 10000);
    probe.onload = () => {
      window.clearTimeout(timer);
      setItems((prev) => {
        const next = [
          ...prev,
          { key: nextKey(), url, previewUrl: null, fileName: "URL image", status: "done" as const, error: null },
        ];
        commitUrls(next);
        return next;
      });
      setUrlInput("");
    };
    probe.onerror = () => {
      window.clearTimeout(timer);
      setUrlError(
        "That URL could not be loaded as an image. Only direct image links (ending in .jpg, .png, .webp, etc.) work."
      );
    };
    probe.src = url;
  }

  function removeItem(key: string) {
    setItems((prev) => {
      const next = prev.filter((i) => i.key !== key);
      commitUrls(next);
      return next;
    });
  }

  /* Global paste: Ctrl+V anywhere on the page with an image on the clipboard */
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (e.clipboardData?.files && e.clipboardData.files.length > 0) {
        const files = Array.from(e.clipboardData.files).filter((f) =>
          f.type.startsWith("image/")
        );
        if (files.length > 0) {
          e.preventDefault();
          addFiles(files);
        }
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const uploadingCount = items.filter((i) => i.status === "uploading").length;
  const errorCount = items.filter((i) => i.status === "error").length;

  return (
    <div className="space-y-4">
      {/* METHOD BUTTONS */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#0b1736] transition hover:border-[#087f8c] hover:text-[#087f8c] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-[#2dd4bf] dark:hover:text-[#2dd4bf]"
        >
          📁 Upload from Computer
        </button>

        <button
          type="button"
          onClick={handlePasteImage}
          disabled={pasting}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#0b1736] transition hover:border-[#087f8c] hover:text-[#087f8c] disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-[#2dd4bf] dark:hover:text-[#2dd4bf]"
        >
          📋 {pasting ? "Reading clipboard..." : "Paste Image"}
        </button>

        <button
          type="button"
          onClick={() => urlInputRef.current?.focus()}
          className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-[#0b1736] transition hover:border-[#087f8c] hover:text-[#087f8c] dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:border-[#2dd4bf] dark:hover:text-[#2dd4bf]"
        >
          🔗 Use Image URL
        </button>
      </div>

      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* URL INPUT ROW */}
      <div>
        <div className="flex gap-2">
          <input
            ref={urlInputRef}
            type="url"
            value={urlInput}
            onChange={(e) => {
              setUrlInput(e.target.value);
              setUrlError("");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleUrlAdd();
              }
            }}
            placeholder="https://example.com/image.jpg"
            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-[#087f8c] focus:ring-2 focus:ring-[#087f8c]/20 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
          <button
            type="button"
            onClick={handleUrlAdd}
            className="shrink-0 rounded-xl bg-[#0b1736] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#087f8c] dark:bg-[#2dd4bf] dark:text-[#062a2d] dark:hover:bg-[#5eead4]"
          >
            Add URL
          </button>
        </div>
        {urlError && (
          <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{urlError}</p>
        )}
      </div>

      {/* DROP ZONE */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Drop image files here or paste with Ctrl+V"
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-8 text-center transition ${
          dragOver
            ? "border-[#087f8c] bg-[#087f8c]/5 dark:border-[#2dd4bf] dark:bg-[#2dd4bf]/5"
            : "border-slate-300 bg-slate-50 hover:border-[#087f8c]/60 dark:border-slate-600 dark:bg-slate-900/40 dark:hover:border-[#2dd4bf]/60"
        }`}
      >
        <p className="text-2xl">🖼️</p>
        <p className="mt-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
          Drop images here, click to browse, or press{" "}
          <kbd className="rounded border border-slate-300 bg-white px-1.5 py-0.5 text-xs font-bold dark:border-slate-600 dark:bg-slate-800">
            Ctrl+V
          </kbd>{" "}
          to paste
        </p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          JPG, PNG, WebP, GIF or AVIF · up to {MAX_IMAGE_MB} MB each · any number of images
        </p>
      </div>

      {/* STATUS LINE */}
      {uploadingCount > 0 && (
        <div className="rounded-xl border border-[#087f8c]/30 bg-[#087f8c]/5 px-4 py-2.5 dark:border-[#2dd4bf]/30 dark:bg-[#2dd4bf]/5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#087f8c] dark:bg-[#2dd4bf]" />
            <p className="text-sm font-semibold text-[#087f8c] dark:text-[#2dd4bf]">
              Uploading {uploadingCount} image{uploadingCount > 1 ? "s" : ""}…
            </p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
            <div className="h-full w-1/2 animate-[pc-upload-slide_1.2s_ease-in-out_infinite] rounded-full bg-[#087f8c] dark:bg-[#2dd4bf]" />
          </div>
        </div>
      )}

      {banner && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {banner}
        </p>
      )}

      {/* PREVIEWS */}
      {items.length > 0 && (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {items.map((item) => (
            <li
              key={item.key}
              className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800"
            >
              <div className="relative aspect-[4/3] w-full bg-slate-100 dark:bg-slate-900">
                {(item.previewUrl || item.url) && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.previewUrl || item.url!}
                    alt={item.fileName}
                    className="h-full w-full object-cover"
                  />
                )}
                {item.status === "uploading" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                    <span className="h-7 w-7 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  </div>
                )}
                {item.status === "error" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 px-2 text-center">
                    <span className="text-[11px] font-bold text-white">Upload failed</span>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 p-2">
                <p className="min-w-0 flex-1 truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {item.fileName}
                </p>
                <button
                  type="button"
                  onClick={() => removeItem(item.key)}
                  disabled={item.status === "uploading"}
                  aria-label={`Remove ${item.fileName}`}
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-50 text-xs font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-40 dark:bg-red-950/40 dark:text-red-300"
                >
                  ×
                </button>
              </div>

              {item.error && (
                <p className="px-2 pb-2 text-[11px] font-medium leading-4 text-red-600 dark:text-red-400">
                  {item.error}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      {items.length > 0 && errorCount === 0 && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {items.length} image{items.length > 1 ? "s" : ""} ready for this post.
        </p>
      )}
    </div>
  );
}
