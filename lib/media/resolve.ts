const LOCAL_MEDIA_ROOT = "/demo/india/real/imported/";
type MediaKeyRole = "full" | "thumbnail" | "poster";
const R2_MEDIA_PREFIX = "trips/india-2018/";

function cleanBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function validPublicBaseUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.username === "" && url.password === "" && url.search === "" && url.hash === "" && url.pathname === "/";
  } catch {
    return false;
  }
}

function normalizedKey(value: string) {
  const candidate = value.trim();
  if (!candidate || candidate.includes("\\") || candidate.includes("\0") || candidate.includes("?") || candidate.includes("#")) return undefined;
  if (/^(?:https?:)?\/\//i.test(candidate)) return undefined;
  const parts = candidate.replace(/^\/+/, "").split("/");
  if (parts.some((part) => !part || part === "." || part === "..")) return undefined;
  return parts.join("/");
}

function r2KeyForLocal(key: string, role: MediaKeyRole) {
  const filename = key.split("/").pop();
  if (!filename || !/^[A-Za-z0-9._-]+$/.test(filename)) return undefined;
  const folder = role === "thumbnail" ? "images/thumbs" : role === "poster" ? "posters" : filename.toLowerCase().endsWith(".mp4") ? "videos" : "images/full";
  return `${R2_MEDIA_PREFIX}${folder}/${filename}`;
}

export function resolveMediaUrl(storageKey: unknown, role: MediaKeyRole = "full") {
  if (typeof storageKey !== "string" || storageKey.trim().length === 0) return undefined;
  const value = storageKey.trim();
  const key = normalizedKey(value);
  const localPrefix = LOCAL_MEDIA_ROOT.replace(/^\/+/, "");
  const isLocalKey = Boolean(key?.startsWith(localPrefix));
  if (!key) return undefined;

  const baseUrl = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.trim();
  if (process.env.TRAVEL_MEDIA_SOURCE === "r2" && baseUrl && validPublicBaseUrl(baseUrl)) {
    const remoteKey = isLocalKey ? r2KeyForLocal(key, role) : key;
    return remoteKey && (isLocalKey || remoteKey.startsWith("trips/")) ? `${cleanBaseUrl(baseUrl)}/${remoteKey}` : undefined;
  }
  if (isLocalKey) return `/${key}`;
  return undefined;
}
