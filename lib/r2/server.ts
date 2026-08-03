import { HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type UploadRole = "full" | "thumbnail" | "poster";
export type UploadMediaType = "image" | "video";

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const VIDEO_TYPES = new Set(["video/mp4"]);
const MAX_IMAGE_BYTES = 25 * 1024 * 1024;
const MAX_VIDEO_BYTES = 250 * 1024 * 1024;
const MAX_DERIVATIVE_BYTES = 10 * 1024 * 1024;

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable de entorno ${name}.`);
  return value;
}

function endpoint() {
  const value = requiredEnv("R2_ENDPOINT").replace(/\/+$/, "");
  const url = new URL(value);
  if (url.protocol !== "https:" || url.pathname !== "/" || url.search || url.hash || url.username || url.password) throw new Error("R2_ENDPOINT no tiene un formato valido.");
  return value;
}

export function getR2Config() {
  return {
    accountId: requiredEnv("R2_ACCOUNT_ID"),
    bucket: requiredEnv("R2_BUCKET_NAME"),
    endpoint: endpoint(),
    region: "auto",
  };
}

export function createR2Client() {
  const config = getR2Config();
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"), secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY") },
  });
}

export function allowedUpload(contentType: string, role: UploadRole, size: number) {
  const isImage = IMAGE_TYPES.has(contentType);
  const isVideo = VIDEO_TYPES.has(contentType);
  if (role === "poster" || role === "thumbnail") {
    return isImage && size > 0 && size <= MAX_DERIVATIVE_BYTES;
  }
  return ((isImage && size <= MAX_IMAGE_BYTES) || (isVideo && size <= MAX_VIDEO_BYTES)) && size > 0;
}

export function mediaTypeFor(contentType: string): UploadMediaType | undefined {
  if (IMAGE_TYPES.has(contentType)) return "image";
  if (VIDEO_TYPES.has(contentType)) return "video";
  return undefined;
}

export function fileNameMatchesType(fileName: string, contentType: string) {
  const extension = fileName.toLowerCase().split(".").pop() ?? "";
  if (contentType === "video/mp4") return extension === "mp4";
  return ["jpg", "jpeg", "png", "webp"].includes(extension);
}

export function safeFileStem(value: string) {
  const base = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/-{2,}/g, "-").replace(/^[-.]+|[-.]+$/g, "").slice(0, 80);
  return base || "archivo";
}

export function mediaKey(tripSlug: string, role: UploadRole, fileName: string) {
  const cleanSlug = tripSlug.toLowerCase().trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(cleanSlug)) throw new Error("El slug del viaje no es seguro.");
  const cleanName = safeFileStem(fileName);
  const id = crypto.randomUUID();
  const folder = role === "thumbnail" ? "images/thumbs" : role === "poster" ? "posters" : fileName.toLowerCase().endsWith(".mp4") ? "videos" : "images/full";
  return { key: `trips/${cleanSlug}/${folder}/${id}-${cleanName}`, id };
}

export async function createUploadUrl(key: string, contentType: string, expiresIn = 300) {
  const config = getR2Config();
  const client = createR2Client();
  return getSignedUrl(client, new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    ContentType: contentType,
    CacheControl: "public, max-age=31536000, immutable",
  }), { expiresIn });
}

export async function headR2Object(key: string) {
  const config = getR2Config();
  return createR2Client().send(new HeadObjectCommand({ Bucket: config.bucket, Key: key }));
}
