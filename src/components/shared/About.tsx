import { Leaf, Heart, Recycle, Users, Globe } from "lucide-react"
import Link from "next/link"

const VALUES = [
  {
    icon: Leaf,
    title: "Nachhaltigkeit zuerst",
    description:
      "Jedes Produkt auf Elysion erfüllt strenge ökologische und ethische Standards — mit echten Zertifikaten, die wir prüfen.",
  },
  {
    icon: Heart,
    title: "Ethische Lieferkette",
    description:
      "Wir arbeiten nur mit Unternehmen zusammen, die faire Löhne und sichere Arbeitsbedingungen gewährleisten.",
  },
  {
    icon: Recycle,
    title: "Kreislaufwirtschaft",
    description:
      "Wir fördern Produkte, die auf Langlebigkeit, Reparierbarkeit und Recyclingfähigkeit ausgelegt sind.",
  },
  {
    icon: Users,
    title: "Transparenz",
    description:
      "Kein Greenwashing: Jeder Nachhaltigkeits-Claim auf Elysion ist mit einem nachprüfbaren Zertifikat hinterlegt.",
  },
]

export default function About() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-16 text-center">
          <h1 className="mb-6 text-4xl font-bold text-stone-800 md:text-5xl">
            Nachhaltigkeit. Zertifiziert. Transparent.
          </h1>
          <p className="mx-auto max-w-3xl text-xl leading-relaxed text-sage-600">
            Elysion ist ein Marktplatz für zertifiziert nachhaltige Produkte. Wir verbinden bewusste
            Verbraucher mit Unternehmen, die Verantwortung übernehmen — für Mensch, Umwelt und
            Gesellschaft.
          </p>
        </div>

        <div className="mb-16 rounded-lg border border-stone-200 bg-white p-8 shadow-sm">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-6 text-3xl font-bold text-stone-800">Unsere Mission</h2>
            <p className="mb-6 text-lg leading-relaxed text-stone-700">
              Nachhaltiges Einkaufen soll einfach, zugänglich und vertrauenswürdig sein. Auf Elysion
              finden Sie ausschließlich Produkte mit geprüften Nachhaltigkeitszertifikaten — keine
              unbelegten Claims, keine Eigenbeurteilungen. Jeder Kauf ist ein Statement für eine
              bessere Wirtschaftsweise.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Globe className="h-6 w-6 text-sage-600" />
              <span className="font-medium text-sage-600">
                Jeder Kauf zählt — für eine gerechtere und grünere Welt
              </span>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="mb-12 text-center text-3xl font-bold text-stone-800">Unsere Werte</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((value, index) => {
              const Icon = value.icon
              return (
                <div
                  key={index}
                  className="rounded-lg border border-stone-200 bg-white p-6 text-center shadow-sm"
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-sage-50">
                    <Icon className="h-8 w-8 text-sage-600" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-stone-800">{value.title}</h3>
                  <p className="text-stone-600">{value.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mb-16 grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="mb-6 text-3xl font-bold text-stone-800">Unsere Geschichte</h2>
            <div className="space-y-4 text-stone-700">
              <p>
                Elysion entstand aus einer einfachen Beobachtung: Wer nachhaltig einkaufen will,
                verliert sich im Dschungel ungeprüfter Claims und vager Versprechen. Wir haben
                Elysion gegründet, um das zu ändern.
              </p>
              <p>
                Unser Ansatz: Kein Produkt erscheint auf Elysion ohne ein geprüftes, anerkanntes
                Zertifikat. Welche Standards wir akzeptieren und wie wir diese prüfen, legen wir
                offen — damit Sie wissen, worauf Sie sich verlassen können.
              </p>
              <p>
                Elysion ist ein Marktplatz: Vertragspartner bei jedem Kauf ist der jeweilige
                Verkäufer. Unsere Aufgabe ist es, sicherzustellen, dass nur seriöse, zertifizierte
                Händler auf der Plattform verkaufen dürfen.
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-sage-50 p-8 text-center">
            <Leaf className="mx-auto mb-4 h-16 w-16 text-sage-600" />
            <h3 className="mb-2 text-xl font-semibold text-stone-800">Zertifizierungsstandards</h3>
            <p className="text-stone-600">
              Wir erkennen ausschließlich anerkannte, unabhängig überprüfte Zertifizierungen an.
              Welche Standards das sind, erfahren Sie in unseren{" "}
              <Link href="/contact" className="text-sage-600 underline hover:text-sage-800">
                Nachhaltigkeitsrichtlinien
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="rounded-lg border border-stone-200 bg-white p-8 text-center shadow-sm">
          <h2 className="mb-4 text-3xl font-bold text-stone-800">Jetzt entdecken</h2>
          <p className="mx-auto mb-6 max-w-2xl text-stone-600">
            Stöbern Sie in unserer kuratierten Auswahl zertifiziert nachhaltiger Produkte und kaufen
            Sie mit gutem Gewissen.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              href="/"
              className="rounded-lg bg-bark-700 px-8 py-3 font-medium text-white transition-colors hover:bg-bark-800"
            >
              Zum Shop
            </Link>
            <Link
              href="/contact"
              className="rounded-lg border border-sage-600 px-8 py-3 font-medium text-sage-600 transition-colors hover:bg-sage-50"
            >
              Als Verkäufer bewerben
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
