export type HeroMode = "collage" | "slideshow" | "video";
export type CoverVariant = "a" | "b" | "c" | "d";
export type MediaType = "image" | "video";
export type ConfidenceLevel = "high" | "medium" | "low";
export type MediaOrientation = "landscape" | "portrait" | "square";
export type PlaceCategory = "religious" | "memorial" | "monument" | "palace" | "hotel" | "activity" | "transfer";

export type PlaceCandidate = {
  name: string;
  confidence: ConfidenceLevel;
  reason: string;
};

export type Place = {
  name: string;
  region: string;
  status?: "confirmed" | "provisional";
  confidence?: ConfidenceLevel;
  candidates?: PlaceCandidate[];
  coordinates?: { latitude: number; longitude: number };
  id?: string;
  slug?: string;
  category?: PlaceCategory;
  media?: MediaItem;
};

export type TripPlace = {
  id: string;
  slug: string;
  name: string;
  alternateName?: string;
  city: string;
  zone: string;
  date: string;
  shortSummary: string;
  description: string;
  coordinates?: { latitude: number; longitude: number };
  locationSource?: string;
  mapQuery?: string;
  verification: ConfidenceLevel;
  mediaIds: string[];
  coverMediaIds: string[];
  dayKey: string;
  category: PlaceCategory;
  wikipediaUrl?: string;
};

export type TripFact = { label: string; value: string };

export type FramePosition = { x: number; y: number };

export type MediaItem = {
  id: string;
  storageKey?: string;
  sourceHash?: string;
  src: string;
  alt: string;
  type: MediaType;
  thumbnailSrc?: string | null;
  width?: number | null;
  height?: number | null;
  aspectRatio?: number | null;
  orientation?: MediaOrientation | null;
  captureDate?: string | null;
  captureTime?: string | null;
  fit?: "cover" | "contain";
  focus?: FramePosition;
  poster?: string;
  caption?: string;
  city?: string;
  dayKey?: string;
  phase?: string;
};

export type IndiaMediaRecord = MediaItem & {
  originalFileName: string;
  dayKey: string;
  tripDayNumber: number;
  city: string;
  phase: string;
  placeCandidates: PlaceCandidate[];
  chosenPlace?: string;
  confidence: ConfidenceLevel;
  folderSource: string;
  notes: string;
  eligibleForCover: boolean;
  imported: boolean;
  omissionReason?: string;
  durationSeconds?: number;
  editorialPlaceIds?: string[];
  editorialAssignment?: { confidence: ConfidenceLevel; reason: string };
};

export type IndiaMediaManifest = {
  sourceRoot: string;
  generatedAt: string;
  totals: { sourceFiles: number; importedFiles: number; omittedFiles: number };
  detectedFolders: Array<{ folder: string; files: number; formats: Record<string, number> }>;
  files: IndiaMediaRecord[];
};

export type TripCover = {
  mode: HeroMode;
  variant?: CoverVariant;
  media: MediaItem[];
  video?: MediaItem;
  fallback: MediaItem;
};

export type TripChapter = { title: string; subtitle?: string; blocks: ContentBlock[] };

export type TripSection = {
  id: string;
  title: string;
  description: string;
  displayOrder: number;
  afterDayNumber?: number;
  initiallyClosed: boolean;
  blocks: Array<Extract<ContentBlock, { type: "gallery" }>>;
};

export type ContentBlock =
  | { type: "chapterTitle"; title: string; subtitle?: string }
  | { type: "fullImage"; media: MediaItem }
  | { type: "imageGrid"; items: MediaItem[] }
  | { type: "text"; body: string }
  | { type: "quote"; quote: string; attribution: string }
  | { type: "shortVideo"; media: MediaItem }
  | { type: "gallery"; title: string; items: MediaItem[] }
  | { type: "tripFacts"; facts: TripFact[] }
  | { type: "routeSummary"; places: Place[] }
  | { type: "closing"; title: string; body: string; media: MediaItem };

export type TripDay = {
  id: string;
  dayNumber: number;
  date: string;
  title: string;
  city: string;
  phase: string;
  confidence: ConfidenceLevel;
  placeCandidates: PlaceCandidate[];
  location: Place;
  factualDescription: string;
  placesVisited: Place[];
  heroImage: MediaItem;
  mosaic: MediaItem[];
  video?: MediaItem;
  gallery: MediaItem[];
  chapters?: TripChapter[];
};

export type Trip = {
  slug: string;
  title: string;
  dates: string;
  intro: string;
  hero: MediaItem;
  cover: TripCover;
  coverVariants?: Record<CoverVariant, TripCover>;
  facts: TripFact[];
  route: Place[];
  days: TripDay[];
  sections?: TripSection[];
  gallery: MediaItem[];
  closing: Extract<ContentBlock, { type: "closing" }>;
};
