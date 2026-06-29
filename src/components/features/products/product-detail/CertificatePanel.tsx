import { Shield } from "lucide-react"
import type { PublicCertificate } from "@/src/types"

interface CertificatePanelProps {
  certificates: PublicCertificate[]
}

export function CertificatePanel({ certificates }: CertificatePanelProps) {
  return (
    <div className="space-y-5">
      <h3 className="text-base font-semibold text-stone-800">Zertifizierungen</h3>
      {certificates.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {certificates.map((cert) => (
            <div key={cert.id} className="rounded-xl border border-sage-100 bg-sage-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-sage-100">
                  <Shield className="h-4 w-4 text-sage-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-stone-800">
                    {cert.title ?? cert.certificateType}
                  </h4>
                  {cert.issuerName && (
                    <p className="mt-0.5 text-xs text-stone-500">Aussteller: {cert.issuerName}</p>
                  )}
                  {cert.validUntil && (
                    <p className="mt-0.5 text-xs text-stone-400">
                      Gültig bis: {new Date(cert.validUntil).toLocaleDateString("de-DE")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-stone-400">Keine Zertifizierungen hinterlegt.</p>
      )}
    </div>
  )
}
