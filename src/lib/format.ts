// A short, human-readable stand-in for the real UUID primary key — every
// submission gets one (unlike prize_id/winner_id, which only exist for
// prize-draw entrants), purely for the admin/owner to reference a specific
// row without pasting a full UUID around.
export function formatSubmissionId(id: string) {
  return `SUB-${id.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}
