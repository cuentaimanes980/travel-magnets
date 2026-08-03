import type { MediaItem } from "@/types/travel";

type VisualSelectionOptions = {
  excludeIds?: Iterable<string>;
  limit?: number;
  preferVariety?: boolean;
};

function identityKeys(item: MediaItem) {
  return [item.id, item.storageKey, item.sourceHash, item.src].filter((value): value is string => Boolean(value));
}

export function dedupeMedia(items: MediaItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const keys = identityKeys(item);
    if (keys.some((key) => seen.has(key))) return false;
    keys.forEach((key) => seen.add(key));
    return true;
  });
}

function visualScore(item: MediaItem, selected: MediaItem[], index: number) {
  const previous = selected.at(-1);
  const recentCities = new Set(selected.slice(-2).map((candidate) => candidate.city).filter(Boolean));
  const recentPhases = new Set(selected.slice(-2).map((candidate) => candidate.phase).filter(Boolean));
  let score = index / 10000;
  if (previous?.orientation && item.orientation && previous.orientation !== item.orientation) score -= 3;
  if (item.type !== previous?.type) score -= 1.5;
  if (item.city && !recentCities.has(item.city)) score -= 1;
  if (item.phase && !recentPhases.has(item.phase)) score -= 0.5;
  return score;
}

export function selectVisualMedia(items: MediaItem[], options: VisualSelectionOptions = {}) {
  const excluded = new Set(options.excludeIds ?? []);
  const candidates = dedupeMedia(items).filter((item) => !excluded.has(item.id));
  const limit = options.limit === undefined ? candidates.length : Math.max(0, options.limit);
  if (!options.preferVariety || candidates.length <= 1) return candidates.slice(0, limit);

  const remaining = [...candidates];
  const selected: MediaItem[] = [];
  while (remaining.length > 0 && selected.length < limit) {
    let bestIndex = 0;
    let bestScore = Number.POSITIVE_INFINITY;
    remaining.forEach((item, index) => {
      const score = visualScore(item, selected, index);
      if (score < bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });
    selected.push(remaining.splice(bestIndex, 1)[0]);
  }
  return selected;
}
