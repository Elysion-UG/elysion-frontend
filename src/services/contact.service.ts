/**
 * ContactService — öffentliches Kontaktformular (Backend #120).
 *
 * `POST /api/v1/contact` speichert die Anfrage in der Datenbank und leitet sie
 * anschließend per Mail an das Support-Postfach weiter. Die Datenbank ist die
 * primäre Ablage, die Mail nur die Benachrichtigung darauf — deshalb antwortet
 * der Endpoint `202 Accepted` (Annahme quittiert, nicht Erledigung) und meldet
 * über `forwarded`, ob die Benachrichtigung schon rausging.
 *
 * Ohne Auth: wer Kontakt aufnimmt, hat oft kein Konto — oder genau damit ein
 * Problem. Rate-Limit 5 Requests/Stunde/IP → 429 (`buildRateLimitError` im
 * api-client erzeugt daraus bereits eine lokalisierte Meldung).
 */
import { z } from "zod"
import { apiRequest } from "@/src/lib/api-client"
import { parseApiResponse } from "@/src/lib/api-schemas"

export interface ContactRequestDTO {
  name: string
  email: string
  subject: string
  message: string
}

// Die Antwort spiegelt bewusst keine eingesandten Inhalte zurück.
const contactAcknowledgementSchema = z.object({
  /** Referenznummer der gespeicherten Anfrage, im Support-Kontakt zitierbar. */
  id: z.string(),
  receivedAt: z.string(),
  /** false = gespeichert, aber die Support-Benachrichtigung ging (noch) nicht raus. */
  forwarded: z.boolean(),
})

export type ContactAcknowledgement = z.infer<typeof contactAcknowledgementSchema>

export const ContactService = {
  async send(dto: ContactRequestDTO): Promise<ContactAcknowledgement> {
    const raw = await apiRequest<unknown>("/api/v1/contact", {
      method: "POST",
      body: JSON.stringify(dto),
    })
    return parseApiResponse(contactAcknowledgementSchema, raw, "contact.send")
  },
}
