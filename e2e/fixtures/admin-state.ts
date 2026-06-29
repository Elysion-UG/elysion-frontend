/**
 * Admin-Test-Helper: speichert den Cookie-State zuverlässig in admin.json.
 *
 * **Warum nicht einfach `page.context().storageState({ path })`?**
 *
 * Der HttpOnly Refresh-Cookie ist single-use und wird vom Backend bei jeder
 * `/api/v1/auth/refresh`-Antwort rotiert. Wenn afterEach den State zu schnell
 * speichert (bevor das Set-Cookie aus der letzten in-flight Refresh-Response
 * verarbeitet wurde), speichern wir einen Cookie der bereits server-seitig
 * als verbraucht markiert ist. Der nächste Test lädt diesen toten Cookie,
 * Phase 2 in AuthContext failt, AdminGuard zeigt "Zugriff verweigert".
 *
 * Strategie:
 *   1. networkidle abwarten (alle XHRs durch)
 *   2. Kleine Verzögerung damit Set-Cookie-Header vom Browser verarbeitet wird
 *   3. Cookies abfragen bis stabil (kein neuer Refresh-Roundtrip in der Pipe)
 *   4. State speichern
 */
import type { Page } from "@playwright/test"
import { fileURLToPath } from "url"
import path from "path"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const ADMIN_AUTH_FILE = path.join(__dirname, "..", ".auth", "admin.json")

export async function persistAdminState(page: Page): Promise<void> {
  // 1. Warte auf den letzten pending request
  try {
    await page.waitForLoadState("networkidle", { timeout: 5_000 })
  } catch {
    // networkidle kann timeouten — kein Showstopper
  }

  // 2. Kleine Pause, damit Set-Cookie-Header vom Browser persistiert wird.
  //    Playwright's CDP-Cookie-Read ist nicht synchron mit Response-Receive.
  await page.waitForTimeout(300)

  // 3. Cookies bis Stabilität pollen: zwei aufeinanderfolgende Abrufe müssen
  //    denselben refreshToken liefern — sonst ist noch eine Rotation in der
  //    Pipeline (z.B. proactive refresh wegen <120s remaining).
  let previous = await getRefreshTokenValue(page)
  for (let attempt = 0; attempt < 5; attempt++) {
    await page.waitForTimeout(200)
    const current = await getRefreshTokenValue(page)
    if (current === previous) break
    previous = current
  }

  await page.context().storageState({ path: ADMIN_AUTH_FILE })
}

async function getRefreshTokenValue(page: Page): Promise<string | undefined> {
  const cookies = await page.context().cookies()
  return cookies.find((c) => c.name === "refreshToken")?.value
}
