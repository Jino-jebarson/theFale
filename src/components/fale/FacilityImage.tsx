import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type FacilityImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  fallback?: ReactNode;
  onClick?: () => void;
  onError?: () => void;
  title?: string;
};

function normalizeImageDataUrl(value: string): string {
  const source = value.trim().replace(/^['"]|['"]$/g, "");
  const prefix = source.match(/^(data:image\/[^;,]+;base64)(?:,|:)?/i)?.[1];
  let mimeType = prefix?.slice(5, prefix.indexOf(";"));
  let payload = prefix
    ? source.slice(prefix.length).replace(/^[,:]/, "")
    : source;
  payload = payload.replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/");

  // Some API responses contain only the base64 payload, without a data URI.
  if (!mimeType) {
    if (payload.startsWith("/9j/")) mimeType = "image/jpeg";
    else if (payload.startsWith("iVBORw0KGgo")) mimeType = "image/png";
    else if (payload.startsWith("R0lGOD")) mimeType = "image/gif";
    else if (payload.startsWith("UklGR")) mimeType = "image/webp";
    else throw new Error("Unsupported image data");
  }
  if (!payload) throw new Error("Empty image data");
  return `data:${mimeType};base64,${payload}`;
}

function isInlineImage(value: string): boolean {
  const source = value.trim();
  return /^data:image\//i.test(source) || /^(?:\/9j\/|iVBORw0KGgo|R0lGOD|UklGR)/.test(source);
}

async function makeDisplayImage(source: string): Promise<string> {
  const normalized = normalizeImageDataUrl(source);
  const comma = normalized.indexOf(",");
  const mimeType = normalized.slice(5, normalized.indexOf(";"));
  const binary = atob(normalized.slice(comma + 1));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);

  const bitmap = await createImageBitmap(new Blob([bytes], { type: mimeType }));
  const scale = Math.min(1, 1440 / bitmap.width, 1440 / bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Could not process the image");
  }
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.78);
}

export function FacilityImage({ src, alt, className, fallback, onClick, onError, title }: FacilityImageProps) {
  const [displaySrc, setDisplaySrc] = useState("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setDisplaySrc("");
    setFailed(false);
    if (!src) {
      setFailed(true);
      onError?.();
      return () => { active = false; };
    }
    if (!isInlineImage(src)) {
      setDisplaySrc(src);
      return () => { active = false; };
    }
    void makeDisplayImage(src).then((value) => {
      if (active) setDisplaySrc(value);
    }).catch(() => {
      if (active) {
        setFailed(true);
        onError?.();
      }
    });
    return () => { active = false; };
  }, [src, onError]);

  if (failed) {
    if (fallback) return <>{fallback}</>;
    return <div role="img" aria-label={`${alt} unavailable`} className={cn("grid place-items-center rounded-xl border border-border bg-muted/30 p-2 text-center text-xs text-muted-foreground", className)}>Image unavailable</div>;
  }
  if (!displaySrc) return <div aria-label={`Loading ${alt}`} className={cn("animate-pulse rounded-xl border border-border bg-muted/30", className)} />;
  return <img src={displaySrc} alt={alt} title={title} className={className} onClick={onClick} onError={() => { setFailed(true); onError?.(); }} />;
}
