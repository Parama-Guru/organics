export type ActiveSponsorship = {
  placementId: string;
  priority: number;
};

/** Sponsored rows lead; equal-priority and organic rows retain source order. */
export function sponsoredFirst<T extends { id: string }>(
  rows: T[],
  placements: Map<string, ActiveSponsorship>,
): Array<T & { sponsored: boolean; sponsorshipId: string | null }> {
  return rows
    .map((row, position) => ({
      row,
      sponsorship: placements.get(row.id) ?? null,
      position,
    }))
    .sort(
      (a, b) =>
        (b.sponsorship?.priority ?? -1) - (a.sponsorship?.priority ?? -1) ||
        a.position - b.position,
    )
    .map((entry) => ({
      ...entry.row,
      sponsored: entry.sponsorship !== null,
      sponsorshipId: entry.sponsorship?.placementId ?? null,
    }));
}
