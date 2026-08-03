"use client";

import { useMemo, useState } from "react";

type JobStatus = "ready" | "uploading" | "done" | "error" | "unsupported";
type Job = { id: string; file: File; status: JobStatus; progress: number; message?: string };

const allowed = new Set(["image/jpeg", "image/png", "image/webp", "video/mp4"]);

function fileFromCanvas(canvas: HTMLCanvasElement, quality: number) {
  return new Promise<File>((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(new File([blob], "derived.webp", { type: "image/webp" })) : reject(new Error("No se pudo crear el derivado.")), "image/webp", quality));
}

async function imageDerivatives(file: File) {
  const bitmap = await createImageBitmap(file);
  const sourceWidth = bitmap.width;
  const sourceHeight = bitmap.height;
  const ratio = sourceWidth / sourceHeight;
  const make = async (maxWidth: number, quality: number) => { const width = Math.min(maxWidth, bitmap.width); const canvas = document.createElement("canvas"); canvas.width = width; canvas.height = Math.max(1, Math.round(width / ratio)); const context = canvas.getContext("2d"); if (!context) throw new Error("El navegador no permite preparar la imagen."); context.drawImage(bitmap, 0, 0, canvas.width, canvas.height); return fileFromCanvas(canvas, quality); };
  const full = await make(2400, 0.88);
  const thumb = await make(640, 0.82);
  bitmap.close();
  return { full, thumb, width: sourceWidth, height: sourceHeight };
}

async function hashFile(file: File) {
  const digest = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(digest)].map((value) => value.toString(16).padStart(2, "0")).join("");
}

function uploadWithProgress(url: string, file: File, onProgress: (value: number) => void) {
  return new Promise<void>((resolve, reject) => { const request = new XMLHttpRequest(); request.open("PUT", url); request.setRequestHeader("Content-Type", file.type); request.setRequestHeader("Cache-Control", "public, max-age=31536000, immutable"); request.upload.onprogress = (event) => { if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100)); }; request.onload = () => request.status >= 200 && request.status < 300 ? resolve() : reject(new Error(`R2 respondio ${request.status}.`)); request.onerror = () => reject(new Error("La subida no pudo completarse.")); request.send(file); });
}

async function prepareUpload(tripSlug: string, file: File, role: "full" | "thumbnail" | "poster") {
  const response = await fetch("/api/admin/r2/upload-url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tripSlug, fileName: file.name, contentType: file.type, size: file.size, role }) });
  const body = await response.json() as { uploadUrl?: string; key?: string; error?: string };
  if (!response.ok || !body.uploadUrl || !body.key) throw new Error(body.error || "No se pudo preparar la URL firmada.");
  return body as { uploadUrl: string; key: string };
}

async function videoDuration(file: File) {
  return new Promise<number | null>((resolve) => { const video = document.createElement("video"); const objectUrl = URL.createObjectURL(file); video.preload = "metadata"; video.onloadedmetadata = () => { URL.revokeObjectURL(objectUrl); resolve(Number.isFinite(video.duration) ? video.duration : null); }; video.onerror = () => { URL.revokeObjectURL(objectUrl); resolve(null); }; video.src = objectUrl; });
}

export function AdminMediaUploader({ tripSlug }: { tripSlug: string }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [posterFile, setPosterFile] = useState<File>();
  const unsupported = useMemo(() => jobs.filter((job) => job.status === "unsupported"), [jobs]);

  function addFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = [...(event.target.files ?? [])];
    setJobs((current) => [...current, ...files.map((file) => ({ id: `${file.name}-${file.lastModified}-${Math.random()}`, file, status: allowed.has(file.type) ? "ready" as const : "unsupported" as const, progress: 0, message: allowed.has(file.type) ? undefined : "Formato no compatible: prepara HEIC o MOV localmente." }))]);
    event.target.value = "";
  }

  async function runJob(job: Job) {
    setJobs((current) => current.map((item) => item.id === job.id ? { ...item, status: "uploading", progress: 0, message: undefined } : item));
    try {
      const originalHash = await hashFile(job.file);
      const image = job.file.type.startsWith("image/") ? await imageDerivatives(job.file) : undefined;
      const fullFile = image?.full ?? job.file;
      const dimensions = image ? { width: image.width, height: image.height } : { width: null, height: null };
      const fullUpload = await prepareUpload(tripSlug, fullFile, "full");
      await uploadWithProgress(fullUpload.uploadUrl, fullFile, (progress) => setJobs((current) => current.map((item) => item.id === job.id ? { ...item, progress: Math.round(progress * 0.6) } : item)));
      let thumbnailKey: string | undefined;
      if (image) { const thumbUpload = await prepareUpload(tripSlug, image.thumb, "thumbnail"); await uploadWithProgress(thumbUpload.uploadUrl, image.thumb, (progress) => setJobs((current) => current.map((item) => item.id === job.id ? { ...item, progress: 60 + Math.round(progress * 0.2) } : item))); thumbnailKey = thumbUpload.key; }
      let posterKey: string | undefined;
      if (job.file.type === "video/mp4" && posterFile) { const posterUpload = await prepareUpload(tripSlug, posterFile, "poster"); await uploadWithProgress(posterUpload.uploadUrl, posterFile, (progress) => setJobs((current) => current.map((item) => item.id === job.id ? { ...item, progress: 80 + Math.round(progress * 0.15) } : item))); posterKey = posterUpload.key; }
      const durationSeconds = job.file.type === "video/mp4" ? await videoDuration(job.file) : null;
      const complete = await fetch("/api/admin/r2/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tripSlug, storageKey: fullUpload.key, thumbnailKey, posterKey, originalFileName: job.file.name, storageFileName: fullFile.name, sourcePathHash: originalHash, contentType: fullFile.type, size: fullFile.size, mediaType: job.file.type === "video/mp4" ? "video" : "image", width: dimensions.width, height: dimensions.height, aspectRatio: dimensions.width && dimensions.height ? dimensions.width / dimensions.height : null, orientation: dimensions.width && dimensions.height ? dimensions.width > dimensions.height ? "landscape" : dimensions.width < dimensions.height ? "portrait" : "square" : null, durationSeconds, alt: job.file.name.replace(/\.[^.]+$/, ""), metadata: { upload_source: "admin-browser", poster_file_name: posterFile?.name ?? null } }) });
      const body = await complete.json() as { error?: string };
      if (!complete.ok) throw new Error(body.error || "No se pudo registrar el medio.");
      setJobs((current) => current.map((item) => item.id === job.id ? { ...item, status: "done", progress: 100, message: "Subido y registrado como pendiente." } : item));
    } catch (error) { setJobs((current) => current.map((item) => item.id === job.id ? { ...item, status: "error", message: error instanceof Error ? error.message : "Error de subida." } : item)); }
  }

  return <section className="admin-upload-card"><div className="admin-upload-heading"><div><strong>Subida directa a R2</strong><p>Las fotos se convierten en web y miniatura en este navegador. HEIC, MOV y otros formatos no compatibles deben prepararse localmente.</p></div><div className="admin-card-actions"><label className="admin-primary-link">Seleccionar archivos<input type="file" accept="image/jpeg,image/png,image/webp,video/mp4,.heic,.mov" multiple hidden onChange={addFiles} /></label><label className="admin-secondary-link">Poster opcional<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={(event) => setPosterFile(event.target.files?.[0])} /></label></div></div>{posterFile && <p className="admin-message">Poster preparado: {posterFile.name}</p>}{unsupported.length > 0 && <p className="admin-message admin-message--error">Hay {unsupported.length} archivo(s) que no se han subido por formato incompatible.</p>}<div className="admin-upload-list">{jobs.map((job) => <div className="admin-upload-row" key={job.id}><div><strong>{job.file.name}</strong><span>{job.file.type || "tipo desconocido"} · {(job.file.size / 1024 / 1024).toFixed(1)} MB</span>{job.message && <small>{job.message}</small>}</div><progress max="100" value={job.progress} /><div>{job.status === "ready" && <button type="button" onClick={() => runJob(job)}>Subir</button>}{job.status === "error" && <button type="button" onClick={() => runJob(job)}>Reintentar</button>}{job.status === "done" && <span>Listo</span>}{job.status === "unsupported" && <span>No compatible</span>}</div></div>)}</div>{jobs.some((job) => job.status === "done") && <button type="button" className="admin-secondary-link" onClick={() => window.location.reload()}>Actualizar medios</button>}</section>;
}
