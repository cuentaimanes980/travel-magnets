import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { loadEnvConfig } from "@next/env";
import {
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
  type HeadObjectCommandOutput,
} from "@aws-sdk/client-s3";
import { indiaTrip } from "../data/india";
import type { IndiaMediaManifest } from "../types/travel";

type Mode = "dry-run" | "upload" | "verify";
type ObjectRole = "image" | "thumbnail" | "video" | "poster";
type PlannedObject = {
  key: string;
  localPath: string;
  role: ObjectRole;
  contentType: string;
  size: number;
  sha256: string;
};
type RemoteObject = { key: string; size: number; sha256?: string };

const projectRoot = process.cwd();
loadEnvConfig(projectRoot);
const manifestPath = path.join(projectRoot, "data", "india-media-manifest.json");
const publicRoot = path.join(projectRoot, "public");
const prefix = "trips/india-2018/";
const cacheControl = "public,max-age=31536000,immutable";

function env(name: string) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Falta la variable ${name}.`);
  if (/\s|["']/.test(value)) throw new Error(`La variable ${name} contiene espacios o comillas.`);
  return value;
}

function validateConfig() {
  const accountId = env("R2_ACCOUNT_ID");
  const accessKeyId = env("R2_ACCESS_KEY_ID");
  const secretAccessKey = env("R2_SECRET_ACCESS_KEY");
  const bucket = env("R2_BUCKET_NAME");
  const endpoint = env("R2_ENDPOINT");
  const publicBaseUrl = env("NEXT_PUBLIC_MEDIA_BASE_URL");

  if (!/^[a-f0-9]{32}$/i.test(accountId)) throw new Error("R2_ACCOUNT_ID no tiene formato de Account ID de Cloudflare.");
  if (!/^[A-Za-z0-9]{16,}$/.test(accessKeyId)) throw new Error("R2_ACCESS_KEY_ID no tiene un formato válido.");
  if (!/^[A-Za-z0-9+/=_-]{20,}$/.test(secretAccessKey)) throw new Error("R2_SECRET_ACCESS_KEY no tiene un formato válido.");
  if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket)) throw new Error("R2_BUCKET_NAME no tiene formato S3 válido.");

  const endpointUrl = new URL(endpoint);
  if (endpointUrl.protocol !== "https:" || endpointUrl.pathname !== "/" || endpointUrl.search || endpointUrl.hash || endpointUrl.host.toLowerCase() !== `${accountId.toLowerCase()}.r2.cloudflarestorage.com`) {
    throw new Error("R2_ENDPOINT no coincide con el Account ID o incluye una ruta.");
  }

  const publicUrl = new URL(publicBaseUrl);
  if (publicUrl.protocol !== "https:" || publicUrl.pathname !== "/" || publicUrl.search || publicUrl.hash || publicUrl.username || publicUrl.password || publicUrl.host.toLowerCase() === endpointUrl.host.toLowerCase()) {
    throw new Error("NEXT_PUBLIC_MEDIA_BASE_URL no es una URL pública de medios válida.");
  }

  return {
    bucket,
    publicBaseUrl: publicBaseUrl.replace(/\/+$/, ""),
    client: new S3Client({
      region: "auto",
      endpoint,
      forcePathStyle: true,
      credentials: { accessKeyId, secretAccessKey },
    }),
  };
}

function localPathFromPublicUrl(value: string) {
  if (!value.startsWith("/demo/india/real/imported/")) throw new Error(`Ruta local no permitida en el manifiesto: ${value}`);
  const relative = value.replace(/^\//, "");
  const absolutePath = path.resolve(publicRoot, relative.replace(/^public\//, ""));
  if (!absolutePath.startsWith(path.resolve(publicRoot) + path.sep)) throw new Error("Ruta local fuera de public.");
  return absolutePath;
}

function keyFor(role: ObjectRole, filename: string) {
  if (!/^[A-Za-z0-9._-]+$/.test(filename)) throw new Error(`Nombre de medio no seguro: ${filename}`);
  const folder = role === "image" ? "images/full" : role === "thumbnail" ? "images/thumbs" : `${role}s`;
  return `${prefix}${folder}/${filename}`;
}

function contentType(filename: string) {
  const extension = path.extname(filename).toLowerCase();
  if (extension === ".webp") return "image/webp";
  if (extension === ".mp4") return "video/mp4";
  throw new Error(`Tipo de medio no soportado: ${filename}`);
}

async function sha256(filePath: string) {
  return new Promise<string>((resolve, reject) => {
    const hash = createHash("sha256");
    const stream = createReadStream(filePath);
    stream.on("data", (chunk) => hash.update(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(hash.digest("hex")));
  });
}

async function buildPlan() {
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8")) as IndiaMediaManifest;
  const imported = manifest.files.filter((record) => record.imported && record.src);
  const plan: PlannedObject[] = [];
  const missing: string[] = [];
  const keySources = new Map<string, string>();
  const hashCache = new Map<string, { size: number; sha256: string }>();

  async function add(value: string | undefined, role: ObjectRole) {
    if (!value) return;
    const localPath = localPathFromPublicUrl(value);
    const key = keyFor(role, path.basename(value));
    const previousSource = keySources.get(key);
    if (previousSource && previousSource !== localPath) throw new Error(`Conflicto de clave remota: ${key}`);
    keySources.set(key, localPath);
    try {
      const stat = await fs.stat(localPath);
      let digest = hashCache.get(localPath);
      if (!digest) {
        digest = { size: stat.size, sha256: await sha256(localPath) };
        hashCache.set(localPath, digest);
      }
      plan.push({ key, localPath, role, contentType: contentType(path.basename(value)), size: digest.size, sha256: digest.sha256 });
    } catch {
      missing.push(value);
    }
  }

  for (const record of imported) {
    await add(record.src, record.type === "video" ? "video" : "image");
    if (record.type === "image") await add(record.thumbnailSrc ?? undefined, "thumbnail");
  }

  const posters = new Set(indiaTrip.gallery.filter((item) => item.type === "video").map((item) => item.poster).filter((value): value is string => Boolean(value)));
  for (const poster of posters) await add(poster, "poster");

  return { manifest, plan, missing };
}

async function listObjects(client: S3Client, bucket: string, objectPrefix?: string) {
  const objects: RemoteObject[] = [];
  let continuationToken: string | undefined;
  do {
    const response = await client.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: objectPrefix, ContinuationToken: continuationToken }));
    for (const object of response.Contents ?? []) {
      if (object.Key) objects.push({ key: object.Key, size: object.Size ?? 0 });
    }
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);
  return objects;
}

function isNotFound(error: unknown) {
  const candidate = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return candidate.name === "NotFound" || candidate.name === "NoSuchKey" || candidate.$metadata?.httpStatusCode === 404;
}

async function headObject(client: S3Client, bucket: string, key: string): Promise<HeadObjectCommandOutput | undefined> {
  try {
    return await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  } catch (error) {
    if (isNotFound(error)) return undefined;
    throw error;
  }
}

async function publicProbe(publicBaseUrl: string) {
  const probeUrl = `${publicBaseUrl}/__travel_magnets_r2_probe__`;
  try {
    const response = await fetch(probeUrl, { method: "HEAD", redirect: "manual" });
    return `${response.status} ${response.statusText}`;
  } catch (error) {
    return `ERROR ${(error as Error).name}`;
  }
}

async function verifyRemoteObjects(config: ReturnType<typeof validateConfig>, plan: PlannedObject[]) {
  const sizeErrors: string[] = [];
  const contentTypeErrors: string[] = [];
  const cacheControlErrors: string[] = [];
  const hashErrors: string[] = [];
  const publicErrors: string[] = [];
  const public404: string[] = [];

  await Promise.all(plan.map(async (item) => {
    const remote = await headObject(config.client, config.bucket, item.key);
    if (!remote) {
      sizeErrors.push(item.key);
      return;
    }
    if (remote.ContentLength !== item.size) sizeErrors.push(item.key);
    if (remote.ContentType !== item.contentType) contentTypeErrors.push(item.key);
    if (remote.CacheControl !== cacheControl) cacheControlErrors.push(item.key);
    if (remote.Metadata?.sha256?.toLowerCase() !== item.sha256) hashErrors.push(item.key);

    try {
      const response = await fetch(`${config.publicBaseUrl}/${item.key}`, { method: "HEAD", redirect: "manual" });
      if (response.status === 404) public404.push(item.key);
      if (response.status !== 200) publicErrors.push(`${item.key}:${response.status}`);
    } catch (error) {
      publicErrors.push(`${item.key}:${(error as Error).name}`);
    }
  }));

  const rangeErrors: string[] = [];
  await Promise.all(plan.filter((item) => item.role === "video").map(async (item) => {
    try {
      const response = await fetch(`${config.publicBaseUrl}/${item.key}`, {
        headers: { Range: "bytes=0-0" },
        redirect: "manual",
      });
      const contentRange = response.headers.get("content-range")?.toLowerCase() ?? "";
      if (response.status !== 206 || !contentRange.startsWith("bytes 0-0/")) rangeErrors.push(`${item.key}:${response.status}`);
      await response.body?.cancel();
    } catch (error) {
      rangeErrors.push(`${item.key}:${(error as Error).name}`);
    }
  }));

  console.log(`REMOTE_SIZE_ERRORS=${sizeErrors.length}`);
  console.log(`REMOTE_CONTENT_TYPE_ERRORS=${contentTypeErrors.length}`);
  console.log(`REMOTE_CACHE_CONTROL_ERRORS=${cacheControlErrors.length}`);
  console.log(`REMOTE_HASH_ERRORS=${hashErrors.length}`);
  console.log(`PUBLIC_200=${plan.length - publicErrors.length}`);
  console.log(`PUBLIC_404=${public404.length}`);
  console.log(`PUBLIC_ERRORS=${publicErrors.length}`);
  console.log(`RANGE_OK=${plan.filter((item) => item.role === "video").length - rangeErrors.length}`);
  console.log(`RANGE_ERRORS=${rangeErrors.length}`);
  if (sizeErrors.length) console.log(`REMOTE_SIZE_ERROR_KEYS=${sizeErrors.join(",")}`);
  if (contentTypeErrors.length) console.log(`REMOTE_CONTENT_TYPE_ERROR_KEYS=${contentTypeErrors.join(",")}`);
  if (cacheControlErrors.length) console.log(`REMOTE_CACHE_CONTROL_ERROR_KEYS=${cacheControlErrors.join(",")}`);
  if (hashErrors.length) console.log(`REMOTE_HASH_ERROR_KEYS=${hashErrors.join(",")}`);
  if (publicErrors.length) console.log(`PUBLIC_ERROR_KEYS=${publicErrors.join(",")}`);
  if (rangeErrors.length) console.log(`RANGE_ERROR_KEYS=${rangeErrors.join(",")}`);
  return { sizeErrors, contentTypeErrors, cacheControlErrors, hashErrors, publicErrors, public404, rangeErrors };
}

async function printSummary(mode: Mode, config: ReturnType<typeof validateConfig>, manifest: IndiaMediaManifest, plan: PlannedObject[], missing: string[]) {
  const allObjects = await listObjects(config.client, config.bucket);
  const indiaObjects = await listObjects(config.client, config.bucket, prefix);
  const plannedKeys = new Set(plan.map((item) => item.key));
  const byKey = new Map(indiaObjects.map((item) => [item.key, item]));
  const missingRemote = plan.filter((item) => !byKey.has(item.key));
  const existingRemote = plan.filter((item) => byKey.has(item.key));
  const conflicts: string[] = [];
  const identical: string[] = [];
  for (const item of existingRemote) {
    const remote = await headObject(config.client, config.bucket, item.key);
    const remoteHash = remote?.Metadata?.sha256?.toLowerCase();
    if (remoteHash && remoteHash === item.sha256) identical.push(item.key);
    else conflicts.push(item.key);
  }
  const duplicateGroups = new Map<string, string[]>();
  for (const item of plan) duplicateGroups.set(item.sha256, [...(duplicateGroups.get(item.sha256) ?? []), item.key]);
  const duplicates = [...duplicateGroups.values()].filter((keys) => keys.length > 1);
  const roleCount = (role: ObjectRole) => plan.filter((item) => item.role === role).length;
  const roleBytes = (role: ObjectRole) => plan.filter((item) => item.role === role).reduce((sum, item) => sum + item.size, 0);
  const totalBytes = plan.reduce((sum, item) => sum + item.size, 0);
  const allBytes = allObjects.reduce((sum, item) => sum + item.size, 0);
  const probe = await publicProbe(config.publicBaseUrl);

  console.log(`MEDIA_MODE=${mode}`);
  console.log(`BUCKET_OBJECTS=${allObjects.length}`);
  console.log(`BUCKET_BYTES=${allBytes}`);
  console.log(`R2_INDIA_OBJECTS=${indiaObjects.length}`);
  console.log(`MANIFEST_SOURCE_FILES=${manifest.totals.sourceFiles}`);
  console.log(`MANIFEST_IMPORTED_FILES=${manifest.totals.importedFiles}`);
  console.log(`MANIFEST_OMITTED_FILES=${manifest.totals.omittedFiles}`);
  console.log(`PLANNED_OBJECTS=${plan.length}`);
  console.log(`PLANNED_IMAGES=${roleCount("image")}`);
  console.log(`PLANNED_VIDEOS=${roleCount("video")}`);
  console.log(`PLANNED_POSTERS=${roleCount("poster")}`);
  console.log(`PLANNED_THUMBNAILS=${roleCount("thumbnail")}`);
  console.log(`PLANNED_BYTES=${totalBytes}`);
  console.log(`PLANNED_IMAGE_BYTES=${roleBytes("image")}`);
  console.log(`PLANNED_VIDEO_BYTES=${roleBytes("video")}`);
  console.log(`PLANNED_POSTER_BYTES=${roleBytes("poster")}`);
  console.log(`PLANNED_THUMBNAIL_BYTES=${roleBytes("thumbnail")}`);
  console.log(`PLANNED_KEYS=${plan.map((item) => item.key).join(",")}`);
  console.log(`MISSING_LOCAL_FILES=${missing.length}`);
  console.log(`DUPLICATE_CONTENT_GROUPS=${duplicates.length}`);
  console.log(`REMOTE_IDENTICAL_OBJECTS=${identical.length}`);
  console.log(`REMOTE_MISSING_OBJECTS=${missingRemote.length}`);
  console.log(`REMOTE_CONFLICTS=${conflicts.length}`);
  console.log(`REMOTE_EXTRA_INDIA_OBJECTS=${indiaObjects.filter((item) => !plannedKeys.has(item.key)).length}`);
  console.log(`PUBLIC_PROBE=${probe}`);
  console.log("SUPABASE_CHANGES=0");
  if (missing.length) console.log(`MISSING_LOCAL_NAMES=${missing.map((value) => path.basename(value)).join(",")}`);
  if (conflicts.length) console.log(`CONFLICT_KEYS=${conflicts.join(",")}`);
  return { missingRemote, conflicts };
}

async function upload(config: ReturnType<typeof validateConfig>, plan: PlannedObject[]) {
  for (const item of plan) {
    const remote = await headObject(config.client, config.bucket, item.key);
    if (remote?.Metadata?.sha256?.toLowerCase() === item.sha256) {
      console.log(`SKIP_IDENTICAL=${item.key}`);
      continue;
    }
    if (remote) throw new Error(`Conflicto remoto: ${item.key}`);
    await config.client.send(new PutObjectCommand({
      Bucket: config.bucket,
      Key: item.key,
      Body: createReadStream(item.localPath),
      ContentLength: item.size,
      ContentType: item.contentType,
      CacheControl: cacheControl,
      Metadata: { sha256: item.sha256, source: "travel-magnets" },
    }));
    console.log(`UPLOADED=${item.key}`);
  }
}

async function verify(config: ReturnType<typeof validateConfig>, manifest: IndiaMediaManifest, plan: PlannedObject[]) {
  const { missingRemote, conflicts } = await printSummary("verify", config, manifest, plan, []);
  const audit = await verifyRemoteObjects(config, plan);
  if (audit.sizeErrors.length || audit.contentTypeErrors.length || audit.cacheControlErrors.length || audit.hashErrors.length || audit.publicErrors.length || audit.rangeErrors.length) {
    throw new Error("R2 metadata or public access verification failed.");
  }
  if (missingRemote.length || conflicts.length) throw new Error("La verificación de medios R2 no coincide con el plan.");
}

async function main() {
  const mode = (process.argv[2] ?? "dry-run") as Mode;
  if (!(["dry-run", "upload", "verify"] as Mode[]).includes(mode)) throw new Error("Usa dry-run, upload o verify.");
  const config = validateConfig();
  const { manifest, plan, missing } = await buildPlan();
  if (mode === "dry-run") {
    await printSummary(mode, config, manifest, plan, missing);
    if (missing.length) throw new Error(`Faltan ${missing.length} archivos locales; no se continúa.`);
    return;
  }
  if (missing.length) throw new Error(`Faltan ${missing.length} archivos locales; no se continúa.`);
  if (mode === "upload") {
    const audit = await printSummary(mode, config, manifest, plan, missing);
    if (audit.conflicts.length) throw new Error("Hay conflictos remotos; no se sube ningún archivo.");
    await upload(config, plan);
    return;
  }
  await verify(config, manifest, plan);
}

main().catch((error) => {
  console.error(`MEDIA_ERROR=${error instanceof Error ? error.message : "error desconocido"}`);
  process.exitCode = 1;
});
