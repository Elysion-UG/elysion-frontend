/**
 * country.ts — ISO 3166-1 alpha-2 conversion utilities.
 *
 * Users enter/see full country names (German labels).
 * The backend only accepts 2-char ISO codes.
 *
 * toCountryCode("Deutschland") → "DE"
 * toCountryName("DE")          → "Deutschland"
 */

const NAME_TO_CODE: Record<string, string> = {
  // German names
  Deutschland: "DE",
  Österreich: "AT",
  Schweiz: "CH",
  Frankreich: "FR",
  Italien: "IT",
  Spanien: "ES",
  Niederlande: "NL",
  Belgien: "BE",
  Luxemburg: "LU",
  Polen: "PL",
  Tschechien: "CZ",
  Slowakei: "SK",
  Ungarn: "HU",
  Rumänien: "RO",
  Bulgarien: "BG",
  Kroatien: "HR",
  Slowenien: "SI",
  Dänemark: "DK",
  Schweden: "SE",
  Norwegen: "NO",
  Finnland: "FI",
  Portugal: "PT",
  Griechenland: "GR",
  Irland: "IE",
  "Vereinigtes Königreich": "GB",
  Großbritannien: "GB",
  // English names (fallback for copy-paste)
  Germany: "DE",
  Austria: "AT",
  Switzerland: "CH",
  France: "FR",
  Italy: "IT",
  Spain: "ES",
  Netherlands: "NL",
  Belgium: "BE",
  Luxembourg: "LU",
  Poland: "PL",
  "Czech Republic": "CZ",
  Czechia: "CZ",
  Slovakia: "SK",
  Hungary: "HU",
  Romania: "RO",
  Bulgaria: "BG",
  Croatia: "HR",
  Slovenia: "SI",
  Denmark: "DK",
  Sweden: "SE",
  Norway: "NO",
  Finland: "FI",
  Greece: "GR",
  Ireland: "IE",
  "United Kingdom": "GB",
}

const CODE_TO_NAME: Record<string, string> = {
  DE: "Deutschland",
  AT: "Österreich",
  CH: "Schweiz",
  FR: "Frankreich",
  IT: "Italien",
  ES: "Spanien",
  NL: "Niederlande",
  BE: "Belgien",
  LU: "Luxemburg",
  PL: "Polen",
  CZ: "Tschechien",
  SK: "Slowakei",
  HU: "Ungarn",
  RO: "Rumänien",
  BG: "Bulgarien",
  HR: "Kroatien",
  SI: "Slowenien",
  DK: "Dänemark",
  SE: "Schweden",
  NO: "Norwegen",
  FI: "Finnland",
  PT: "Portugal",
  GR: "Griechenland",
  IE: "Irland",
  GB: "Vereinigtes Königreich",
  US: "Vereinigte Staaten",
  CA: "Kanada",
  AU: "Australien",
  JP: "Japan",
  CN: "China",
}

/** Convert a country name (German or English) to a 2-char ISO code.
 *  If the input is already a 2-char code, it is returned as-is (uppercased).
 *  Unrecognised names are returned unchanged so the backend can decide. */
export function toCountryCode(name: string): string {
  if (!name) return name
  const trimmed = name.trim()
  if (trimmed.length === 2) return trimmed.toUpperCase()
  return NAME_TO_CODE[trimmed] ?? trimmed
}

/** Convert a 2-char ISO code to the German country name.
 *  If the code is not in the map, it is returned unchanged. */
export function toCountryName(code: string): string {
  if (!code) return code
  const upper = code.trim().toUpperCase()
  return CODE_TO_NAME[upper] ?? code
}
