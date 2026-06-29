// ── Material Types ───────────────────────────────────────────────
// Controlled material master data (e.g. Bio-Baumwolle, Leinen).
// Backend: GET /api/v1/materials

export interface Material {
  id: string
  slug: string
  name: string
}
