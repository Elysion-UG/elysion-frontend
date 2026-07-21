/**
 * Robustes Zurückspeichern des Auth-States zwischen Tests.
 *
 * **Warum nicht einfach `page.context().storageState({ path })`?**
 *
 * Der HttpOnly Refresh-Cookie ist single-use und wird vom Backend bei jeder
 * `/api/v1/auth/refresh`-Antwort rotiert. Speichert ein afterEach den State zu
 * früh (bevor das Set-Cookie der letzten in-flight Refresh-Response verarbeitet
 * ist), landet ein bereits server-seitig verbrauchter Cookie in der Datei. Der
 * nächste Test lädt diesen toten Cookie, die Session-Wiederherstellung schlägt
 * fehl und die Middleware leitet auf die Login-Seite um.
 *
 * Strategie:
 *   1. networkidle abwarten (alle XHRs durch)
 *   2. Kleine Verzögerung, damit der Set-Cookie-Header verarbeitet wird
 *   3. refreshToken pollen, bis er stabil ist (keine Rotation mehr in der Pipe)
 *   4. State speichern
 */
import type { Page } from "@playwright/test"

export async function persistAuthState(page: Page, file: string): Promise<void> {
  // 1. Auf den letzten pending Request warten.
  try {
    await page.waitForLoadState("networkidle", { timeout: 5_000 })
  } catch {
    // networkidle kann timeouten — kein Showstopper
  }

  // 2. Kleine Pause: Playwrights CDP-Cookie-Read ist nicht synchron mit dem
  //    Empfang der Response.
  await page.waitForTimeout(300)

  // 3. Cookies bis Stabilität pollen: zwei aufeinanderfolgende Abrufe müssen
  //    denselben refreshToken liefern — sonst ist noch eine Rotation unterwegs
  //    (z. B. proaktiver Refresh bei <120 s Restlaufzeit).
  let previous = await getRefreshTokenValue(page)
  for (let attempt = 0; attempt < 5; attempt++) {
    await page.waitForTimeout(200)
    const current = await getRefreshTokenValue(page)
    if (current === previous) break
    previous = current
  }

  await page.context().storageState({ path: file })
}

async function getRefreshTokenValue(page: Page): Promise<string | undefined> {
  const cookies = await page.context().cookies()
  return cookies.find((c) => c.name === "refreshToken")?.value
}
