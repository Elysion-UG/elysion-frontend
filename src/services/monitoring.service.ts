/**
 * MonitoringService — Admin-Reads für persistierte Frontend-Fehlerereignisse.
 *
 * Endpoints (ADMIN role):
 *   GET /api/v1/admin/monitoring/errors        — paginierte Fehlerliste mit Filtern
 *   GET /api/v1/admin/monitoring/errors/stats  — aggregierte Stats über ein Zeitfenster
 *
 * Die Ingestion (Frontend → Backend) läuft separat über den Flush-Mechanismus
 * in `src/lib/error-store.ts` (POST /api/v1/monitoring/errors, public).
 * Spezifikation: `docs/monitoring-api.md`.
 */
import { apiRequest, buildQuery } from "@/src/lib/api-client"
import type { PagedResponse, PersistedErrorEvent, ErrorStoreStats } from "@/src/types"

export interface MonitoringErrorListParams {
  page?: number
  size?: number
  severity?: string
  category?: string
  from?: string
  to?: string
  sessionId?: string
}

export const MonitoringService = {
  async getErrors(
    params: MonitoringErrorListParams = {}
  ): Promise<PagedResponse<PersistedErrorEvent>> {
    return apiRequest(
      `/api/v1/admin/monitoring/errors${buildQuery({
        page: params.page,
        size: params.size,
        severity: params.severity,
        category: params.category,
        from: params.from,
        to: params.to,
        sessionId: params.sessionId,
      })}`
    )
  },

  async getErrorStats(hours = 24): Promise<ErrorStoreStats> {
    return apiRequest(`/api/v1/admin/monitoring/errors/stats${buildQuery({ hours })}`)
  },
}
