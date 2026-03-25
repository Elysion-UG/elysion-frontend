import { apiRequest, apiUpload } from "@/src/lib/api-client"
import type { FileCategory, FileLinkTarget, FileUploadResponse, FileMetadata } from "@/src/types"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

export const FileService = {
  /**
   * Upload a file via multipart/form-data.
   * POST /api/v1/files/upload
   */
  async upload(
    file: File,
    category: FileCategory,
    relatedEntityType?: FileLinkTarget,
    relatedEntityId?: string
  ): Promise<FileUploadResponse> {
    const form = new FormData()
    form.append("file", file)
    form.append("category", category)
    if (relatedEntityType) form.append("relatedEntityType", relatedEntityType)
    if (relatedEntityId) form.append("relatedEntityId", relatedEntityId)
    return apiUpload<FileUploadResponse>("/api/v1/files/upload", form)
  },

  /**
   * Get file metadata (auth required).
   * GET /api/v1/files/{fileId}
   */
  async getMetadata(fileId: string): Promise<FileMetadata> {
    return apiRequest<FileMetadata>(`/api/v1/files/${fileId}`)
  },

  /**
   * Returns the public content URL for use as <img src> or download link.
   * GET /api/v1/files/{fileId}/content — no auth required.
   */
  getContentUrl(fileId: string): string {
    return `${API_BASE}/api/v1/files/${fileId}/content`
  },

  /**
   * Soft-delete a file (owner only).
   * DELETE /api/v1/files/{fileId}
   */
  async delete(fileId: string): Promise<void> {
    await apiRequest(`/api/v1/files/${fileId}`, { method: "DELETE" })
  },

  /**
   * Link a file to an entity.
   * POST /api/v1/files/{fileId}/link
   */
  async link(fileId: string, target: FileLinkTarget, targetId: string): Promise<void> {
    await apiRequest(`/api/v1/files/${fileId}/link`, {
      method: "POST",
      body: JSON.stringify({ target, targetId }),
    })
  },

  /**
   * Unlink a file from an entity.
   * POST /api/v1/files/{fileId}/unlink
   */
  async unlink(fileId: string, target: FileLinkTarget, targetId: string): Promise<void> {
    await apiRequest(`/api/v1/files/${fileId}/unlink`, {
      method: "POST",
      body: JSON.stringify({ target, targetId }),
    })
  },

  /**
   * Upload a file and immediately link it to an entity (two-step convenience).
   */
  async uploadAndLink(
    file: File,
    category: FileCategory,
    target: FileLinkTarget,
    targetId: string
  ): Promise<FileUploadResponse> {
    const uploaded = await FileService.upload(file, category)
    await FileService.link(uploaded.fileId, target, targetId)
    return uploaded
  },
}
