import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import manifestJson from "../data/india-media-manifest.json";
import type { IndiaMediaManifest, IndiaMediaRecord } from "../types/travel";

const projectRoot = process.cwd();
const manifest = manifestJson as IndiaMediaManifest;
const outputRoot = path.join(projectRoot, "docs", "omitted-media");
const sourceRoot = manifest.sourceRoot;

function slug(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 72);
}

function placeName(record: IndiaMediaRecord) {
  return record.placeCandidates[0]?.name.replace(/ \([^)]*\)/g, "") ?? record.city;
}

function classification(record: IndiaMediaRecord) {
  if (record.type === "video") return "vídeo no seleccionado";
  const name = record.originalFileName.toLowerCase();
  if (name.includes("laxmi vilas") || name.includes("alfombras")) return "candidato a recuperar";
  if (/08(41|42|43|44|45|46|57)|09(15|27|29)|10(00|05|14)/.test(record.captureTime?.replace(/:/g, "") ?? "")) return "ráfaga";
  if (name.includes("tajmahal") || name.includes("amber fort") || name.includes("shahpura")) return "duplicado";
  if ((record.width ?? 0) < 900 || (record.height ?? 0) < 900) return "baja calidad";
  return "duplicado";
}

function exclusionReason(record: IndiaMediaRecord, kind: string) {
  if (kind === "candidato a recuperar") return "Se conserva fuera del piloto para valorar una ampliación de la ficha del lugar sin alterar la selección vigente.";
  if (kind === "vídeo no seleccionado") return "Vídeo adicional de la misma secuencia; la jornada ya conserva el clip que mejor representa el traslado o la calle.";
  if (kind === "ráfaga") return "Toma muy próxima a otra seleccionada en la misma secuencia temporal.";
  if (kind === "baja calidad") return "Resolución o calidad inferior frente a otros medios de la misma jornada.";
  return record.omissionReason ?? "Selección editorial limitada para mantener una galería manejable.";
}

function similarSelected(record: IndiaMediaRecord) {
  const sameDay = manifest.files.filter((item) => item.imported && item.captureDate === record.captureDate);
  const token = record.originalFileName.toLowerCase().split("_").slice(-1)[0]?.replace(/\.[^.]+$/, "") ?? "";
  return sameDay.find((item) => item.originalFileName.toLowerCase().includes(token))?.originalFileName ?? sameDay[0]?.originalFileName ?? "Selección de la jornada";
}

async function makeThumb(record: IndiaMediaRecord, index: number) {
  const filename = `${String(index + 1).padStart(2, "0")}-${slug(record.originalFileName)}.webp`;
  if (record.type === "image") {
    const source = path.join(sourceRoot, record.folderSource, record.originalFileName);
    try {
      await sharp(source).rotate().resize({ width: 420, height: 280, fit: "cover" }).webp({ quality: 72 }).toFile(path.join(outputRoot, filename));
      return filename;
    } catch {
      return null;
    }
  }
  return null;
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" })[character] ?? character);
}

async function main() {
  await fs.rm(outputRoot, { recursive: true, force: true });
  await fs.mkdir(outputRoot, { recursive: true });
  const omitted = manifest.files.filter((record) => !record.imported);
  const cards: string[] = [];
  for (const [index, record] of omitted.entries()) {
    const kind = classification(record);
    const thumbnail = await makeThumb(record, index);
    const visual = thumbnail ? `<img src="omitted-media/${thumbnail}" alt="">` : `<div class="video-thumb">${record.type === "video" ? "VÍDEO" : "SIN MINIATURA"}</div>`;
    cards.push(`<article class="item" data-kind="${escapeHtml(kind)}"><div class="thumb">${visual}</div><div class="copy"><h2>${escapeHtml(record.originalFileName)}</h2><dl><dt>Fecha</dt><dd>${escapeHtml(record.captureDate ?? "Sin fecha")}</dd><dt>Hora</dt><dd>${escapeHtml(record.captureTime ?? "Sin hora")}</dd><dt>Carpeta</dt><dd>${escapeHtml(record.folderSource)}</dd><dt>Lugar candidato</dt><dd>${escapeHtml(placeName(record))}</dd><dt>Clasificación</dt><dd class="tag">${escapeHtml(kind)}</dd><dt>Motivo</dt><dd>${escapeHtml(exclusionReason(record, kind))}</dd><dt>Similar seleccionado</dt><dd>${escapeHtml(similarSelected(record))}</dd></dl></div></article>`);
  }
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Revisión de medios omitidos · India</title><style>body{margin:0;background:#f4f0e9;color:#171615;font:15px/1.45 Arial, sans-serif}main{max-width:1100px;margin:auto;padding:32px 18px}h1{font:400 38px/1 Georgia,serif;margin:0 0 10px}header{border-bottom:1px solid #bbb3a9;padding-bottom:24px;margin-bottom:24px}header p{max-width:700px;color:#5f5852}.legend{display:flex;gap:8px;flex-wrap:wrap;margin-top:18px}.legend button{padding:9px 12px;border:1px solid #a59c92;background:transparent;cursor:pointer}.item{display:grid;grid-template-columns:260px 1fr;gap:22px;padding:18px 0;border-top:1px solid #c9c1b7}.thumb{aspect-ratio:3/2;background:#24211e;display:grid;place-items:center;overflow:hidden}.thumb img{width:100%;height:100%;object-fit:cover}.video-thumb{color:#f4f0e9;font-size:12px;letter-spacing:.12em}.copy h2{font-size:17px;margin:0 0 10px;overflow-wrap:anywhere}.copy dl{display:grid;grid-template-columns:145px 1fr;margin:0}.copy dt,.copy dd{padding:4px 0;border-bottom:1px solid #ddd5cc}.copy dt{color:#6a625b}.copy dd{margin:0;overflow-wrap:anywhere}.tag{font-weight:700}.hidden{display:none}@media(max-width:650px){main{padding:22px 14px}.item{grid-template-columns:1fr;gap:12px}.thumb{max-width:420px}.copy dl{grid-template-columns:118px 1fr}}</style></head><body><main><header><h1>India · medios omitidos</h1><p>Revisión local de los ${omitted.length} archivos que no entran en la selección publicada del piloto. Las miniaturas son copias de trabajo generadas para esta documentación; los originales permanecen en su carpeta de origen. Ningún candidato se reincorpora automáticamente.</p><div class="legend"><button data-filter="all">Todos</button><button data-filter="candidato a recuperar">Candidatos recuperables</button><button data-filter="duplicado">Duplicados</button><button data-filter="ráfaga">Ráfagas</button><button data-filter="baja calidad">Baja calidad</button><button data-filter="vídeo no seleccionado">Vídeos</button></div></header><section id="items">${cards.join("")}</section></main><script>document.querySelectorAll('[data-filter]').forEach(function(button){button.addEventListener('click',function(){var filter=button.dataset.filter;document.querySelectorAll('.item').forEach(function(item){item.classList.toggle('hidden',filter!=='all'&&item.dataset.kind!==filter)})})})</script></body></html>`;
  await fs.writeFile(path.join(projectRoot, "docs", "india-omitted-media-review.html"), html, "utf8");
  console.log(`Generated ${omitted.length} omitted-media cards.`);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
