/**
 * Admin-Test-Helper: speichert den Auth-State zuverlässig in admin.json zurück.
 * Dünner Wrapper um {@link persistAuthState} — die Begründung (single-use
 * Refresh-Token, Rotation) steht dort.
 */
import type { Page } from "@playwright/test"
import { fileURLToPath } from "url"
import path from "path"

import { persistAuthState } from "./auth-state"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const ADMIN_AUTH_FILE = path.join(__dirname, "..", ".auth", "admin.json")

export async function persistAdminState(page: Page): Promise<void> {
  await persistAuthState(page, ADMIN_AUTH_FILE)
}
