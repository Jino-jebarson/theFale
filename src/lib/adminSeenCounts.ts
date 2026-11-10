const SEEN_STORAGE_KEY = "fale_admin_seen_counts_v1";

export type AdminRouteCounts = Record<string, number>;

export function readAdminSeenCounts(): AdminRouteCounts {
  try {
    const raw = localStorage.getItem(SEEN_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeAdminSeenCounts(seen: AdminRouteCounts): void {
  try {
    localStorage.setItem(SEEN_STORAGE_KEY, JSON.stringify(seen));
  } catch {
    // Ignore storage quota errors
  }
}

export function isAdminRouteActive(currentPath: string, targetRoute: string): boolean {
  return currentPath === targetRoute || currentPath.startsWith(`${targetRoute}/`);
}

/**
 * Updates persisted seen counts once queue metrics have loaded:
 * - Marks the currently active admin route's count as seen.
 * - Clamps down seen counts if items were cleared/resolved so future arrivals badge again.
 */
export function syncAdminSeenCounts(
  currentPath: string,
  counts: AdminRouteCounts,
  readyRoutes: Record<string, boolean>
): AdminRouteCounts {
  const prev = readAdminSeenCounts();
  const next: AdminRouteCounts = { ...prev };
  let changed = false;

  for (const [route, rawCount] of Object.entries(counts)) {
    if (!readyRoutes[route]) continue;
    const count = Math.max(0, Number(rawCount) || 0);
    const prevSeen = Math.max(0, Number(prev[route] ?? 0));
    let nextSeen = prevSeen;

    if (count < prevSeen) {
      nextSeen = count;
    }
    if (isAdminRouteActive(currentPath, route)) {
      nextSeen = count;
    }

    if (nextSeen !== prevSeen || prev[route] === undefined) {
      next[route] = nextSeen;
      changed = true;
    }
  }

  if (changed) {
    writeAdminSeenCounts(next);
  }
  return next;
}

export function getUnseenCount(
  currentPath: string,
  route: string,
  currentCount: number,
  seenMap: AdminRouteCounts
): number {
  if (isAdminRouteActive(currentPath, route)) return 0;
  const seen = Math.max(0, Number(seenMap[route] ?? 0));
  return Math.max(0, Math.max(0, currentCount) - seen);
}

