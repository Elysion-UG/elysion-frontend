"use client"

import { useState } from "react"

export type ProducerTab = "about" | "products" | "sustainability"

const TABS: { id: ProducerTab; label: string }[] = [
  { id: "about", label: "Über uns" },
  { id: "products", label: "Produkte" },
  { id: "sustainability", label: "Nachhaltigkeit" },
]

export function useProducerTabs(initial: ProducerTab = "about") {
  const [activeTab, setActiveTab] = useState<ProducerTab>(initial)
  return { activeTab, setActiveTab, tabs: TABS }
}
