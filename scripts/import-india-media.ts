import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import type {
  ConfidenceLevel,
  IndiaMediaManifest,
  IndiaMediaRecord,
  MediaOrientation,
  PlaceCandidate,
} from "../types/travel";

type SourceEntry = {
  absolutePath: string;
  relativePath: string;
  folder: string;
  name: string;
  extension: string;
  kind: "image" | "video";
  size: number;
  modifiedAt: number;
};

type PreparedEntry = SourceEntry & {
  dayKey: string;
  captureDate: string | null;
  captureTime: string | null;
  exifDate: string | null;
  width: number | null;
  height: number | null;
  aspectRatio: number | null;
  orientation: MediaOrientation | null;
  durationSeconds: number | null;
  candidates: PlaceCandidate[];
  confidence: ConfidenceLevel;
  city: string;
  phase: string;
  score: number;
};

const projectRoot = process.cwd();
const DEFAULT_SOURCE = path.join(projectRoot, "..", "india-pilot-source");
const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const VIDEO_EXTENSIONS = new Set([".mp4"]);
const MAX_IMAGES_PER_DAY = 6;
const IMAGE_WIDTH = 2400;
const THUMBNAIL_WIDTH = 720;

const sourceRoot = path.resolve(process.argv[2] ?? process.env.INDIA_SOURCE_DIR ?? DEFAULT_SOURCE);
const outputRoot = path.join(projectRoot, "public", "demo", "india", "real", "imported");
const manifestPath = path.join(projectRoot, "data", "india-media-manifest.json");

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function slugify(value: string) {
  return normalize(value)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);
}

function parseCaptureParts(name: string) {
  const match = name.match(/(20\d{6})[_-]?(\d{6})/);
  if (!match) return { date: null, time: null, dayKey: "unknown" };
  const [, rawDate, rawTime] = match;
  const date = `${rawDate.slice(0, 4)}-${rawDate.slice(4, 6)}-${rawDate.slice(6, 8)}`;
  const time = `${rawTime.slice(0, 2)}:${rawTime.slice(2, 4)}:${rawTime.slice(4, 6)}`;
  return { date, time, dayKey: date };
}

function parseExifDate(exif: Buffer | undefined) {
  if (!exif) return null;
  const match = exif.toString("latin1").match(/20\d\d:\d\d:\d\d \d\d:\d\d:\d\d/);
  if (!match) return null;
  return match[0].replace(/^([^ ]+) (.+)$/, "$1 $2");
}

function folderContext(folder: string, name: string) {
  const source = normalize(`${folder} ${name}`);
  const folderName = normalize(folder);
  const captureDate = parseCaptureParts(name).date;
  const baseCity = folderName.includes("delhi y viaje hacia jaipur") ? "Delhi" : folderName.includes("jaipur y viaje hacia agra") ? "Jaipur" : folderName.includes("agra y viaje hacia delhi") ? "Agra" : folderName.includes("jaipur") ? "Jaipur" : folderName.includes("agra") ? "Agra" : "Delhi";
  let phase = baseCity;
  if (folderName.includes("hacia jaipur")) phase = captureDate && captureDate >= "2018-09-05" ? "Delhi → Jaipur" : "Delhi";
  if (folderName.includes("hacia agra")) phase = captureDate && captureDate >= "2018-09-07" ? "Jaipur → Agra" : "Jaipur";
  if (folderName.includes("hacia delhi")) phase = captureDate && captureDate >= "2018-09-10" ? "Agra → Delhi" : "Agra";
  const city = source.includes("aeropuerto delhi") || source.includes("aerpuerto delhi") || source.includes("aerpuertodelhi") ? "Delhi" : baseCity;

  const hints: Array<{ tokens: string[]; name: string; confidence: ConfidenceLevel; reason: string }> = [
    { tokens: ["tajmahal"], name: "Taj Mahal", confidence: "high", reason: "El nombre del archivo contiene tajmahal." },
    { tokens: ["fuerte rojo agra", "elfuerterojoagra"], name: "Agra Fort", confidence: "high", reason: "El nombre del archivo menciona el fuerte rojo de Agra." },
    { tokens: ["palacio en el agua"], name: "Jal Mahal", confidence: "medium", reason: "El nombre del video describe un palacio en el agua; el nombre exacto queda por confirmar." },
    { tokens: ["palacio de los maharaha", "palaciomaharaja"], name: "Palacio de los maharajas (exacto por confirmar)", confidence: "medium", reason: "La pista textual apunta a un palacio, pero no identifica el nombre oficial." },
    { tokens: ["recorrido elefantes jaipur", "recorridoelefantesjaipur"], name: "Recorrido con elefantes (lugar exacto por confirmar)", confidence: "high", reason: "El nombre del archivo identifica la actividad y la carpeta apunta a Jaipur." },
    { tokens: ["tuktuk por jaipur", "tuktukporjaipur"], name: "Recorrido en tuk-tuk por Jaipur", confidence: "high", reason: "El nombre del archivo identifica la actividad y la ciudad." },
    { tokens: ["templo musulman", "templomusualman"], name: "Templo musulman (nombre por confirmar)", confidence: "medium", reason: "El nombre del archivo describe un templo, sin indicar su nombre propio." },
    { tokens: ["monumento a gandhi", "monumentoaghandi"], name: "Monumento asociado a Gandhi (nombre por confirmar)", confidence: "medium", reason: "El nombre del archivo contiene una referencia a Gandhi." },
    { tokens: ["trafico de delhi", "traficodedelhi"], name: "Tráfico y vida urbana de Delhi", confidence: "high", reason: "El nombre del archivo identifica el contexto urbano." },
    { tokens: ["aerpuerto delhi", "aeropuerto delhi"], name: "Aeropuerto de Delhi", confidence: "high", reason: "El nombre del archivo identifica el aeropuerto de Delhi." },
    { tokens: ["piscina hotel agra", "piscinahotelagra"], name: "Hotel o piscina en Agra (nombre por confirmar)", confidence: "medium", reason: "El nombre del archivo identifica un contexto de hotel, no el establecimiento." },
  ];

  const candidates = hints
    .filter((hint) => hint.tokens.some((token) => source.includes(normalize(token))))
    .map(({ name: candidateName, confidence, reason }) => ({ name: candidateName, confidence, reason }));
  if (candidates.length === 0) {
    candidates.push({ name: city, confidence: "medium", reason: `La carpeta de origen apunta a ${city}; el lugar exacto queda por confirmar.` });
  }
  const confidence = candidates.some((candidate) => candidate.confidence === "high") ? "high" : candidates[0].confidence;
  return { city, phase, candidates, confidence, source };
}

async function walk(root: string, current = root): Promise<{ files: SourceEntry[]; folders: string[] }> {
  const entries = await fs.readdir(current, { withFileTypes: true });
  const files: SourceEntry[] = [];
  const folders: string[] = [];
  for (const entry of entries) {
    const absolutePath = path.join(current, entry.name);
    if (entry.isDirectory()) {
      const relativeFolder = path.relative(root, absolutePath) || ".";
      folders.push(relativeFolder);
      const nested = await walk(root, absolutePath);
      files.push(...nested.files);
      folders.push(...nested.folders);
      continue;
    }
    const extension = path.extname(entry.name).toLowerCase();
    const kind = IMAGE_EXTENSIONS.has(extension) ? "image" : VIDEO_EXTENSIONS.has(extension) ? "video" : null;
    if (!kind) continue;
    const stat = await fs.stat(absolutePath);
    files.push({
      absolutePath,
      relativePath: path.relative(root, absolutePath),
      folder: path.relative(root, path.dirname(absolutePath)) || ".",
      name: entry.name,
      extension,
      kind,
      size: stat.size,
      modifiedAt: stat.mtimeMs,
    });
  }
  return { files, folders };
}

function readUInt32(buffer: Buffer, offset: number) {
  return offset + 4 <= buffer.length ? buffer.readUInt32BE(offset) : 0;
}

function parseMp4Metadata(buffer: Buffer) {
  const tkhdIndex = buffer.indexOf(Buffer.from("tkhd"));
  let width: number | null = null;
  let height: number | null = null;
  if (tkhdIndex >= 4) {
    const boxStart = tkhdIndex - 4;
    const version = buffer[boxStart + 8];
    const widthOffset = version === 1 ? boxStart + 96 : boxStart + 84;
    const heightOffset = version === 1 ? boxStart + 100 : boxStart + 88;
    const rawWidth = readUInt32(buffer, widthOffset);
    const rawHeight = readUInt32(buffer, heightOffset);
    if (rawWidth && rawHeight) {
      width = Math.round(rawWidth / 65536);
      height = Math.round(rawHeight / 65536);
    }
  }
  const mvhdIndex = buffer.indexOf(Buffer.from("mvhd"));
  let durationSeconds: number | null = null;
  if (mvhdIndex >= 4) {
    const boxStart = mvhdIndex - 4;
    const version = buffer[boxStart + 8];
    const timescaleOffset = version === 1 ? boxStart + 28 : boxStart + 20;
    const durationOffset = version === 1 ? boxStart + 32 : boxStart + 24;
    const timescale = readUInt32(buffer, timescaleOffset);
    const duration = readUInt32(buffer, durationOffset);
    if (timescale && duration) durationSeconds = Math.round((duration / timescale) * 10) / 10;
  }
  return { width, height, durationSeconds };
}

function orientationFor(width: number | null, height: number | null): MediaOrientation | null {
  if (!width || !height) return null;
  if (width === height) return "square";
  return width > height ? "landscape" : "portrait";
}

function displayDimensions(width: number, height: number, exifOrientation?: number) {
  return exifOrientation && [5, 6, 7, 8].includes(exifOrientation) ? { width: height, height: width } : { width, height };
}

function videoGroupKey(name: string) {
  return name.replace(/\.[^.]+$/, "").replace(/[2-9]$/, "");
}

function stableHash(value: string) {
  let hash = 0;
  for (const character of value) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return hash.toString(36);
}

const editorialAssignments: Array<{ fragment: string; placeIds: string[]; confidence: ConfidenceLevel; reason: string }> = [
  { fragment: "2018-09-03-img-20180903-083453", placeIds: ["jama-masjid"], confidence: "high", reason: "Secuencia visual de la mezquita en Old Delhi." },
  { fragment: "2018-09-03-img-20180903-084248", placeIds: ["jama-masjid"], confidence: "high", reason: "Secuencia visual de la mezquita en Old Delhi." },
  { fragment: "2018-09-03-img-20180903-124657", placeIds: ["gurdwara-bangla-sahib"], confidence: "high", reason: "Nombre de archivo y fachada del templo sij." },
  { fragment: "2018-09-03-img-20180903-132158", placeIds: ["raj-ghat"], confidence: "high", reason: "Memorial de mármol negro con ofrendas florales." },
  { fragment: "2018-09-03-img-20180903-161603", placeIds: ["gurdwara-bangla-sahib"], confidence: "high", reason: "Fachada blanca con cúpulas doradas del templo sij." },
  { fragment: "2018-09-04-img-20180904-074253", placeIds: ["qutb-minar"], confidence: "high", reason: "Torre y arcos del complejo de Qutb Minar." },
  { fragment: "2018-09-04-img-20180904-090821", placeIds: ["lotus-temple"], confidence: "medium", reason: "Parada editorial del 4 de septiembre; el archivo no incluye nombre de lugar." },
  { fragment: "2018-09-04-img-20180904-103556", placeIds: ["qutb-minar"], confidence: "high", reason: "Torre de Qutb Minar visible en el recinto arqueológico." },
  { fragment: "2018-09-05-img-20180905-124934", placeIds: ["shahpura-haveli"], confidence: "high", reason: "Nombre de archivo y vehículo rotulado Shahpura Haveli." },
  { fragment: "2018-09-05-img-20180905-125922", placeIds: ["shahpura-haveli"], confidence: "medium", reason: "Secuencia de llegada a Shahpura Haveli." },
  { fragment: "2018-09-05-img-20180905-130747", placeIds: ["shahpura-haveli"], confidence: "high", reason: "Nombre de archivo del palacio de Shahpura." },
  { fragment: "2018-09-05-img-20180905-131133", placeIds: ["shahpura-haveli"], confidence: "medium", reason: "Interior de la secuencia de Shahpura Haveli." },
  { fragment: "2018-09-05-img-20180905-143905", placeIds: ["shahpura-haveli"], confidence: "medium", reason: "Retrato junto al vehículo de Shahpura Haveli." },
  { fragment: "2018-09-05-vid-20180905-124934", placeIds: ["shahpura-haveli"], confidence: "high", reason: "Nombre de archivo del recorrido en 4x4 hacia el palacio." },
  { fragment: "2018-09-06-img-20180906-081132", placeIds: ["amber-fort"], confidence: "high", reason: "Recorrido en elefante dentro del complejo de Amber." },
  { fragment: "2018-09-06-img-20180906-081135", placeIds: ["amber-fort"], confidence: "high", reason: "Recorrido en elefante dentro del complejo de Amber." },
  { fragment: "2018-09-06-img-20180906-123856", placeIds: ["amber-fort"], confidence: "medium", reason: "Recorrido en tuk-tuk de Jaipur, asociado al día de Amber." },
  { fragment: "2018-09-06-vid-20180906-123856", placeIds: ["amber-fort"], confidence: "medium", reason: "Vídeo del recorrido en tuk-tuk de Jaipur." },
  { fragment: "2018-09-06-vid-20180906-090358", placeIds: ["jal-mahal"], confidence: "high", reason: "Nombre de archivo Palacio del Agua." },
  { fragment: "2018-09-06-img-20180906-181156", placeIds: ["amber-fort"], confidence: "high", reason: "Recorrido en elefante de Jaipur." },
  { fragment: "2018-09-06-img-20180906-181311", placeIds: ["amber-fort"], confidence: "high", reason: "Recorrido en elefante de Jaipur." },
  { fragment: "2018-09-06-img-20180906-181315", placeIds: ["amber-fort"], confidence: "high", reason: "Recorrido en elefante de Jaipur." },
  { fragment: "2018-09-07-img-20180907-112810", placeIds: ["chand-baori"], confidence: "high", reason: "Pozo escalonado visible en la imagen." },
  { fragment: "2018-09-07-img-20180907-113116", placeIds: ["chand-baori"], confidence: "high", reason: "Nombre de archivo y secuencia visual del pozo escalonado." },
  { fragment: "2018-09-07-img-20180907-165500", placeIds: ["laxmi-vilas-palace"], confidence: "high", reason: "Nombre de archivo del palacio de Laxmi Vilas." },
  { fragment: "2018-09-08-img-20180908-083626", placeIds: ["taj-mahal"], confidence: "high", reason: "Nombre de archivo y vista del Taj Mahal." },
  { fragment: "2018-09-08-img-20180908-083656", placeIds: ["taj-mahal"], confidence: "high", reason: "Nombre de archivo Taj Mahal." },
  { fragment: "2018-09-08-img-20180908-093240", placeIds: ["taj-mahal"], confidence: "high", reason: "Secuencia visual de la visita al Taj Mahal." },
  { fragment: "2018-09-08-img-20180908-101257", placeIds: ["taj-mahal"], confidence: "high", reason: "Nombre de archivo Taj Mahal." },
  { fragment: "2018-09-08-img-20180908-110430", placeIds: ["agra-fort"], confidence: "high", reason: "Nombre de archivo Fuerte Rojo de Agra." },
  { fragment: "2018-09-08-img-20180908-112423", placeIds: ["agra-fort"], confidence: "high", reason: "Nombre de archivo Fuerte Rojo de Agra." },
  { fragment: "2018-09-09-img-20180909-092844", placeIds: ["agra-private-hotel"], confidence: "medium", reason: "Nombre de archivo piscina del hotel de Agra." },
  { fragment: "2018-09-09-img-20180909-101300", placeIds: ["agra-private-hotel"], confidence: "medium", reason: "Nombre de archivo piscina del hotel de Agra." },
];

function assignmentFor(id: string) {
  return editorialAssignments.find((assignment) => id.includes(assignment.fragment));
}

function recordId(record: PreparedEntry) {
  return slugify(`${record.dayKey}-${record.name}`);
}

function safeRecord(record: PreparedEntry, imported: boolean, src: string, thumbnailSrc: string | null, id: string, omissionReason?: string): IndiaMediaRecord {
  const chosenPlace = record.candidates.find((candidate) => candidate.confidence === "high")?.name;
  const editorialAssignment = assignmentFor(id);
  const sourceNote = record.captureDate ? "Fecha priorizada desde el nombre del archivo." : "Fecha no encontrada en el nombre; revisar manualmente.";
  const notes = [sourceNote, record.exifDate ? "EXIF contiene una fecha de captura compatible." : "No se detecto fecha EXIF utilizable.", record.kind === "video" ? "Video copiado sin transcodificacion; sus dimensiones se leen del contenedor MP4 cuando estan disponibles." : "Imagen optimizada a WebP y miniatura WebP.", omissionReason].filter(Boolean).join(" ");
  const alt = chosenPlace
    ? `Secuencia compatible con ${chosenPlace} en ${record.city}; pendiente de validacion final.`
    : `Fotografia real de ${record.city} o del trayecto; lugar exacto por confirmar.`;
  return {
    id,
    originalFileName: record.name,
    src,
    thumbnailSrc,
    width: record.width,
    height: record.height,
    aspectRatio: record.aspectRatio,
    orientation: record.orientation,
    captureDate: record.captureDate ?? undefined,
    captureTime: record.captureTime ?? undefined,
    dayKey: record.dayKey,
    tripDayNumber: record.dayKey === "unknown" ? 0 : dayNumberByDate.get(record.dayKey) ?? 0,
    city: record.city,
    phase: record.phase,
    placeCandidates: record.candidates,
    chosenPlace,
    confidence: record.confidence,
    folderSource: record.folder,
    notes,
    eligibleForCover: imported && coverIds.has(record.relativePath),
    alt,
    type: record.kind,
    fit: record.kind === "image" ? "contain" : undefined,
    imported,
    omissionReason,
    durationSeconds: record.durationSeconds ?? undefined,
    editorialPlaceIds: editorialAssignment?.placeIds,
    editorialAssignment: editorialAssignment ? { confidence: editorialAssignment.confidence, reason: editorialAssignment.reason } : undefined,
  };
}

let dayNumberByDate = new Map<string, number>();
let coverIds = new Set<string>();

async function prepareEntry(entry: SourceEntry): Promise<PreparedEntry> {
  const parts = parseCaptureParts(entry.name);
  const context = folderContext(entry.folder, entry.name);
  let width: number | null = null;
  let height: number | null = null;
  let exifDate: string | null = null;
  let durationSeconds: number | null = null;
  if (entry.kind === "image") {
    const metadata = await sharp(entry.absolutePath).metadata();
    const display = displayDimensions(metadata.width ?? 0, metadata.height ?? 0, metadata.orientation);
    width = display.width || null;
    height = display.height || null;
    exifDate = parseExifDate(metadata.exif);
  } else {
    const metadata = parseMp4Metadata(await fs.readFile(entry.absolutePath));
    width = metadata.width;
    height = metadata.height;
    durationSeconds = metadata.durationSeconds;
  }
  const semanticScore = context.candidates.some((candidate) => candidate.name !== context.city) ? 100 : 0;
  const qualityScore = width && height ? (width * height) / 1_000_000 : 0;
  return {
    ...entry,
    ...parts,
    captureDate: parts.date ?? (exifDate ? exifDate.slice(0, 10).replace(/:/g, "-") : null),
    captureTime: parts.time ?? (exifDate ? exifDate.slice(11) : null),
    exifDate,
    width,
    height,
    aspectRatio: width && height ? Number((width / height).toFixed(4)) : null,
    orientation: orientationFor(width, height),
    durationSeconds,
    candidates: context.candidates,
    confidence: context.confidence,
    city: context.city,
    phase: context.phase,
    score: semanticScore + qualityScore + entry.size / 1_000_000,
  };
}

async function optimizeImage(entry: PreparedEntry, outputName: string) {
  const outputPath = path.join(outputRoot, outputName);
  const thumbnailPath = path.join(outputRoot, outputName.replace(/\.webp$/, "-thumb.webp"));
  await sharp(entry.absolutePath).rotate().resize({ width: IMAGE_WIDTH, height: IMAGE_WIDTH, fit: "inside", withoutEnlargement: true }).webp({ quality: 84, effort: 4 }).toFile(outputPath);
  await sharp(entry.absolutePath).rotate().resize({ width: THUMBNAIL_WIDTH, height: THUMBNAIL_WIDTH, fit: "inside", withoutEnlargement: true }).webp({ quality: 76, effort: 4 }).toFile(thumbnailPath);
  return { src: `/demo/india/real/imported/${outputName}`, thumbnailSrc: `/demo/india/real/imported/${path.basename(thumbnailPath)}` };
}

async function main() {
  const sourceStat = await fs.stat(sourceRoot);
  if (!sourceStat.isDirectory()) throw new Error(`La ruta de medios no es una carpeta: ${sourceRoot}`);
  const inventory = await walk(sourceRoot);
  const entries = await Promise.all(inventory.files.sort((a, b) => a.relativePath.localeCompare(b.relativePath)).map(prepareEntry));
  const dateKeys = [...new Set(entries.map((entry) => entry.dayKey).filter((key) => key !== "unknown"))].sort();
  dayNumberByDate = new Map(dateKeys.map((date, index) => [date, index]));

  const images = entries.filter((entry) => entry.kind === "image");
  const selectedImages = new Set<string>();
  for (const date of dateKeys) {
    const dayImages = images.filter((entry) => entry.dayKey === date).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
    const selectedForDay: PreparedEntry[] = [];
    const coveredPlaces = new Set<string>();
    for (const entry of dayImages) {
      if (selectedForDay.length >= MAX_IMAGES_PER_DAY) break;
      const assignment = assignmentFor(recordId(entry));
      const placeId = assignment?.placeIds[0];
      if (placeId && !coveredPlaces.has(placeId)) {
        selectedForDay.push(entry);
        coveredPlaces.add(placeId);
      }
    }
    for (const entry of dayImages) {
      if (selectedForDay.length >= MAX_IMAGES_PER_DAY) break;
      if (assignmentFor(recordId(entry)) && !selectedForDay.includes(entry)) selectedForDay.push(entry);
    }
    for (const desiredOrientation of ["landscape", "portrait"] as MediaOrientation[]) {
      if (selectedForDay.length >= MAX_IMAGES_PER_DAY) break;
      const candidate = dayImages.find((entry) => entry.orientation === desiredOrientation && !selectedForDay.includes(entry));
      if (candidate) selectedForDay.push(candidate);
    }
    for (const entry of dayImages) {
      if (selectedForDay.length >= MAX_IMAGES_PER_DAY) break;
      if (!selectedForDay.includes(entry)) selectedForDay.push(entry);
    }
    selectedForDay.forEach((entry) => selectedImages.add(entry.relativePath));
  }

  const selectedVideos = new Set<string>();
  const videoGroups = new Map<string, PreparedEntry[]>();
  entries.filter((entry) => entry.kind === "video").forEach((entry) => {
    const group = videoGroups.get(videoGroupKey(entry.name)) ?? [];
    group.push(entry);
    videoGroups.set(videoGroupKey(entry.name), group);
  });
  for (const group of videoGroups.values()) selectedVideos.add(group.sort((a, b) => a.name.localeCompare(b.name))[0].relativePath);

  const coverCandidates = images.filter((entry) => selectedImages.has(entry.relativePath)).sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
  const coverSelection: PreparedEntry[] = [];
  for (const desiredOrientation of ["landscape", "portrait"] as MediaOrientation[]) {
    const candidate = coverCandidates.find((entry) => entry.orientation === desiredOrientation && !coverSelection.includes(entry));
    if (candidate) coverSelection.push(candidate);
  }
  for (const date of dateKeys) {
    const candidate = coverCandidates.find((entry) => entry.dayKey === date && !coverSelection.includes(entry));
    if (candidate) coverSelection.push(candidate);
    if (coverSelection.length >= 6) break;
  }
  coverIds = new Set(coverSelection.map((entry) => entry.relativePath));

  await fs.mkdir(path.dirname(manifestPath), { recursive: true });
  await fs.rm(outputRoot, { recursive: true, force: true });
  await fs.mkdir(outputRoot, { recursive: true });

  const manifestFiles: IndiaMediaRecord[] = [];
  for (const entry of entries) {
    const imported = entry.kind === "image" ? selectedImages.has(entry.relativePath) : selectedVideos.has(entry.relativePath);
    const omissionReason = imported ? undefined : entry.kind === "video" ? "Variante numerada del mismo clip; se conserva una sola version para el piloto." : "No seleccionada para el piloto inicial para limitar densidad; queda disponible en el origen para futura curacion.";
    const outputBase = `india-${entry.dayKey}-${slugify(path.basename(entry.name, entry.extension)).slice(0, 64)}-${stableHash(entry.relativePath)}`;
    const outputName = `${outputBase}.${entry.kind === "image" ? "webp" : "mp4"}`;
    const id = recordId(entry);
    let sources = { src: "", thumbnailSrc: null as string | null };
    if (imported && entry.kind === "image") sources = await optimizeImage(entry, outputName);
    if (imported && entry.kind === "video") {
      await fs.copyFile(entry.absolutePath, path.join(outputRoot, outputName));
      sources = { src: `/demo/india/real/imported/${outputName}`, thumbnailSrc: null };
    }
    manifestFiles.push(safeRecord(entry, imported, sources.src, sources.thumbnailSrc, id, omissionReason));
  }

  const folderCounts = new Map<string, { files: number; formats: Record<string, number> }>();
  for (const folder of inventory.folders) folderCounts.set(folder, { files: 0, formats: {} });
  for (const entry of entries) {
    const current = folderCounts.get(entry.folder) ?? { files: 0, formats: {} };
    current.files += 1;
    current.formats[entry.extension] = (current.formats[entry.extension] ?? 0) + 1;
    folderCounts.set(entry.folder, current);
  }
  const generatedAt = new Date(Math.max(...entries.map((entry) => entry.modifiedAt))).toISOString();
  const manifest: IndiaMediaManifest = {
    sourceRoot,
    generatedAt,
    totals: {
      sourceFiles: entries.length,
      importedFiles: manifestFiles.filter((file) => file.imported).length,
      omittedFiles: manifestFiles.filter((file) => !file.imported).length,
    },
    detectedFolders: [...folderCounts.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([folder, value]) => ({ folder, ...value })),
    files: manifestFiles,
  };
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ sourceRoot, outputRoot, manifestPath, totals: manifest.totals, dates: dateKeys, cover: [...coverIds] }, null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
