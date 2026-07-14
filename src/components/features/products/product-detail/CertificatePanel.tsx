import { Shield } from "lucide-react"
import type { PublicCertificate } from "@/src/types"

interface CertificatePanelProps {
  certificates: PublicCertificate[]
}

export function CertificatePanel({ certificates }: CertificatePanelProps) {
  return (
    <div className="space-y-5">
      <h3 className="text-base font-semibold text-foreground">Zertifizierungen</h3>
      {certificates.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {certificates.map((cert) => (
            <div key={cert.id} className="rounded-xl border border-green-600 bg-green-50 p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-50">
                  <Shield className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {cert.title ?? cert.certificateType}
                  </h4>
                  {cert.issuerName && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Aussteller: {cert.issuerName}
                    </p>
                  )}
                  {cert.validUntil && (
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Gültig bis: {new Date(cert.validUntil).toLocaleDateString("de-DE")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Keine Zertifizierungen hinterlegt.</p>
      )}
    </div>
  )
}
