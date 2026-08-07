"use client"

import { useId, useState } from "react"
import {
  Sparkles,
  ChevronDown,
  ChevronRight,
  Star,
  UserCircle,
  Shirt,
  Palette,
  Ruler,
  Factory,
} from "lucide-react"
import { formatEuro } from "@/src/lib/currency"
import type { Material, ProductFacetValue, SellerFacet } from "@/src/types"
import {
  sustainabilityFilters,
  importanceScale,
  colorSwatch,
  facetLabel,
  sizeLabel,
} from "./shop-constants"

/** The facet counts are global — they never narrow with the other active filters. */
const GLOBAL_FACET_HINT = "Anzahl im gesamten Sortiment — unabhängig von den übrigen Filtern."

/**
 * DOM-id fragment for a facet value. Facet values are free text ("one size"),
 * so whitespace and punctuation are collapsed — an id with a space is invalid
 * HTML and would break the label ↔ checkbox association.
 */
function facetInputId(instanceId: string, axis: string, value: string): string {
  return `${instanceId}-${axis}-${value.replace(/[^\p{L}\p{N}]+/gu, "_")}`
}

interface FilterSidebarProps {
  isAuthenticated: boolean
  hasValueProfile: boolean
  sustainabilityImportance: Record<string, string>
  onImportanceChange: (attribute: string, importance: string) => void
  priceRange: { min: number; max: number }
  onPriceRangeChange: (range: { min: number; max: number }) => void
  materials: Material[]
  selectedMaterials: string[]
  onToggleMaterial: (slug: string) => void
  /** Colour facet (#49) — values are passed back to the API verbatim. */
  colorFacets: ProductFacetValue[]
  selectedColors: string[]
  onToggleColor: (value: string) => void
  /** Size facet (#49) — serialised as `variantSize`, not `size`. */
  sizeFacets: ProductFacetValue[]
  selectedSizes: string[]
  onToggleSize: (value: string) => void
  /** Manufacturer facet (#50). */
  sellerFacets: SellerFacet[]
  selectedSellerIds: string[]
  onToggleSeller: (id: string) => void
  onPageReset: () => void
}

export default function FilterSidebar({
  isAuthenticated,
  hasValueProfile,
  sustainabilityImportance,
  onImportanceChange,
  priceRange,
  onPriceRangeChange,
  materials,
  selectedMaterials,
  onToggleMaterial,
  colorFacets,
  selectedColors,
  onToggleColor,
  sizeFacets,
  selectedSizes,
  onToggleSize,
  sellerFacets,
  selectedSellerIds,
  onToggleSeller,
  onPageReset,
}: FilterSidebarProps) {
  // The sidebar is rendered twice (desktop column + mobile sheet), so the
  // checkbox ids of the swatch/chip sections must be unique per instance.
  const instanceId = useId()
  const [expandedSections, setExpandedSections] = useState({
    sustainability: true,
    categories: false,
  })
  const [expandedFilters, setExpandedFilters] = useState<Record<string, boolean>>({})
  const [expandedFilterSections, setExpandedFilterSections] = useState({
    price: true,
    materials: true,
    colors: true,
    sizes: true,
    sellers: true,
  })

  const toggleSection = (key: "sustainability" | "categories") => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleFilterExpansion = (key: string) => {
    setExpandedFilters((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const getImportanceLabel = (value: string) => {
    return importanceScale.find((scale) => scale.value === value)?.label ?? ""
  }

  const handlePriceMinChange = (value: number) => {
    onPriceRangeChange({ ...priceRange, min: value })
    onPageReset()
  }

  const handlePriceMaxChange = (value: number) => {
    onPriceRangeChange({ ...priceRange, max: value })
    onPageReset()
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white shadow-sm">
      <div className="border-b border-border bg-secondary/60 px-4 py-3.5">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Filter
        </h2>
      </div>

      {/* Nachhaltigkeitspräferenzen */}
      <div className="border-b border-border">
        <button
          onClick={() => toggleSection("sustainability")}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-secondary"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-green-600" />
            <span className="text-sm font-medium text-foreground">Nachhaltigkeitspräferenzen</span>
            <span className="rounded-full bg-secondary px-1.5 py-0.5 text-xs font-medium text-foreground">
              Bald verfügbar
            </span>
          </div>
          {expandedSections.sustainability ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {expandedSections.sustainability && (
          <div className="pointer-events-none space-y-4 px-4 pb-4 opacity-50">
            {isAuthenticated && hasValueProfile ? (
              <div className="flex items-center gap-1.5 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs text-green-600">
                <UserCircle className="h-3.5 w-3.5" />
                <span>Aus deinem Werteprofil</span>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                Wie wichtig ist dir jeder Nachhaltigkeitsaspekt?
              </p>
            )}
            {Object.entries(sustainabilityFilters).map(([key, filter]) => {
              const Icon = filter.icon
              return (
                <div key={key} className="space-y-2">
                  <button
                    onClick={() => toggleFilterExpansion(key)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="h-3.5 w-3.5 text-green-600" />
                      <span className="text-sm text-foreground">{filter.label}</span>
                    </div>
                    {expandedFilters[key] ? (
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    )}
                  </button>

                  {expandedFilters[key] && (
                    <div className="ml-5 rounded-lg bg-green-50/60 p-2.5 text-xs text-muted-foreground">
                      <ul className="list-inside list-disc space-y-1">
                        {filter.subpoints.map((subpoint, idx) => (
                          <li key={idx}>{subpoint}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="ml-5 flex items-center gap-3">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={sustainabilityImportance[key]}
                      onChange={(e) => onImportanceChange(key, e.target.value)}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-green-500"
                    />
                    <span className="w-20 shrink-0 text-right text-xs text-muted-foreground">
                      {getImportanceLabel(sustainabilityImportance[key])}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Preisspanne */}
      <div>
        <button
          onClick={() => setExpandedFilterSections((prev) => ({ ...prev, price: !prev.price }))}
          className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-secondary"
        >
          <div className="flex items-center gap-2">
            <Star className="h-3.5 w-3.5 text-green-600" />
            <span className="text-sm font-medium text-foreground">Preisspanne</span>
          </div>
          {expandedFilterSections.price ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
        {expandedFilterSections.price && (
          <div className="space-y-4 px-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="mb-1 block text-xs text-muted-foreground">Min (€)</label>
                <input
                  type="number"
                  value={priceRange.min}
                  onChange={(e) => handlePriceMinChange(Number(e.target.value))}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                />
              </div>
              <span className="mt-5 text-muted-foreground">–</span>
              <div className="flex-1">
                <label className="mb-1 block text-xs text-muted-foreground">Max (€)</label>
                <input
                  type="number"
                  value={priceRange.max}
                  onChange={(e) => handlePriceMaxChange(Number(e.target.value))}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm text-foreground focus:border-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="300"
                />
              </div>
            </div>
            <input
              type="range"
              min="0"
              max="300"
              value={priceRange.max}
              onChange={(e) => handlePriceMaxChange(Number(e.target.value))}
              className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-muted accent-green-500"
            />
            <p className="text-right text-xs text-muted-foreground">
              bis {formatEuro(priceRange.max)}
            </p>
          </div>
        )}
      </div>

      {/* Material */}
      {materials.length > 0 && (
        <div className="border-t border-border">
          <button
            onClick={() =>
              setExpandedFilterSections((prev) => ({ ...prev, materials: !prev.materials }))
            }
            className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-secondary"
          >
            <div className="flex items-center gap-2">
              <Shirt className="h-3.5 w-3.5 text-green-600" />
              <span className="text-sm font-medium text-foreground">Material</span>
              {selectedMaterials.length > 0 && (
                <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-600">
                  {selectedMaterials.length}
                </span>
              )}
            </div>
            {expandedFilterSections.materials ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {expandedFilterSections.materials && (
            <ul className="space-y-1 px-4 pb-4">
              {materials.map((material) => (
                <li key={material.id}>
                  <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-foreground">
                    <input
                      type="checkbox"
                      checked={selectedMaterials.includes(material.slug)}
                      onChange={() => onToggleMaterial(material.slug)}
                      className="h-4 w-4 rounded border-border text-green-600 focus:ring-green-500"
                    />
                    <span>{material.name}</span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Farbe (#49) — Swatches, Wert kommt wortwörtlich aus der Facette */}
      {colorFacets.length > 0 && (
        <div className="border-t border-border">
          <FacetSectionHeader
            icon={Palette}
            label="Farbe"
            selectedCount={selectedColors.length}
            expanded={expandedFilterSections.colors}
            onToggle={() =>
              setExpandedFilterSections((prev) => ({ ...prev, colors: !prev.colors }))
            }
          />
          {expandedFilterSections.colors && (
            <div className="px-4 pb-4">
              <ul className="flex flex-wrap gap-2">
                {colorFacets.map((facet) => {
                  const inputId = facetInputId(instanceId, "color", facet.value)
                  const checked = selectedColors.includes(facet.value)
                  return (
                    <li key={facet.value}>
                      <input
                        id={inputId}
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleColor(facet.value)}
                        // Explicit name: the swatch dot carries no text, and the
                        // count must be announced without cluttering the chip.
                        aria-label={`${facetLabel(facet.value)}, ${facet.productCount} Produkte`}
                        className="peer sr-only"
                      />
                      <label
                        htmlFor={inputId}
                        className={`flex cursor-pointer items-center gap-2 rounded-full border px-2.5 py-1.5 text-sm transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-green-500 ${
                          checked
                            ? "border-green-600 bg-green-50 text-foreground"
                            : "border-border text-foreground hover:bg-secondary"
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className="h-4 w-4 shrink-0 rounded-full border border-border"
                          style={{ backgroundColor: colorSwatch(facet.value) }}
                        />
                        <span>{facetLabel(facet.value)}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">{GLOBAL_FACET_HINT}</p>
            </div>
          )}
        </div>
      )}

      {/* Größe (#49) — Chips; API-Parameter heißt variantSize, nicht size */}
      {sizeFacets.length > 0 && (
        <div className="border-t border-border">
          <FacetSectionHeader
            icon={Ruler}
            label="Größe"
            selectedCount={selectedSizes.length}
            expanded={expandedFilterSections.sizes}
            onToggle={() => setExpandedFilterSections((prev) => ({ ...prev, sizes: !prev.sizes }))}
          />
          {expandedFilterSections.sizes && (
            <div className="px-4 pb-4">
              <ul className="flex flex-wrap gap-2">
                {sizeFacets.map((facet) => {
                  const inputId = facetInputId(instanceId, "size", facet.value)
                  const checked = selectedSizes.includes(facet.value)
                  return (
                    <li key={facet.value}>
                      <input
                        id={inputId}
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggleSize(facet.value)}
                        aria-label={`${sizeLabel(facet.value)}, ${facet.productCount} Produkte`}
                        className="peer sr-only"
                      />
                      <label
                        htmlFor={inputId}
                        className={`flex min-w-[2.75rem] cursor-pointer items-center justify-center rounded-lg border px-2.5 py-1.5 text-sm transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-green-500 ${
                          checked
                            ? "border-green-600 bg-green-50 font-medium text-foreground"
                            : "border-border text-foreground hover:bg-secondary"
                        }`}
                      >
                        <span>{sizeLabel(facet.value)}</span>
                      </label>
                    </li>
                  )
                })}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">{GLOBAL_FACET_HINT}</p>
            </div>
          )}
        </div>
      )}

      {/* Hersteller (#50) — Mehrfachauswahl über sellerId */}
      {sellerFacets.length > 0 && (
        <div className="border-t border-border">
          <FacetSectionHeader
            icon={Factory}
            label="Hersteller"
            selectedCount={selectedSellerIds.length}
            expanded={expandedFilterSections.sellers}
            onToggle={() =>
              setExpandedFilterSections((prev) => ({ ...prev, sellers: !prev.sellers }))
            }
          />
          {expandedFilterSections.sellers && (
            <div className="px-4 pb-4">
              <ul className="space-y-1">
                {sellerFacets.map((seller) => (
                  <li key={seller.id}>
                    <label className="flex cursor-pointer items-center gap-2.5 py-1 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={selectedSellerIds.includes(seller.id)}
                        onChange={() => onToggleSeller(seller.id)}
                        aria-label={`${seller.companyName}, ${seller.productCount} Produkte`}
                        className="h-4 w-4 rounded border-border text-green-600 focus:ring-green-500"
                      />
                      <span className="flex-1">{seller.companyName}</span>
                      <span
                        aria-hidden="true"
                        className="rounded-full bg-secondary px-1.5 py-0.5 text-xs text-muted-foreground"
                      >
                        {seller.productCount}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted-foreground">{GLOBAL_FACET_HINT}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Section header shared by the facet sections ────────────────────────────────

function FacetSectionHeader({
  icon: Icon,
  label,
  selectedCount,
  expanded,
  onToggle,
}: {
  icon: typeof Star
  label: string
  selectedCount: number
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={expanded}
      className="flex w-full items-center justify-between px-4 py-3.5 text-left transition-colors hover:bg-secondary"
    >
      <div className="flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-green-600" />
        <span className="text-sm font-medium text-foreground">{label}</span>
        {selectedCount > 0 && (
          <span className="rounded-full bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-600">
            {selectedCount}
          </span>
        )}
      </div>
      {expanded ? (
        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      ) : (
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      )}
    </button>
  )
}
