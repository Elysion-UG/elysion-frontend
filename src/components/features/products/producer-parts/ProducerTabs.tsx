"use client"

import type { ProducerTab } from "./useProducerTabs"

interface ProducerTabsProps {
  tabs: { id: ProducerTab; label: string }[]
  activeTab: ProducerTab
  onChange: (tab: ProducerTab) => void
}

export function ProducerTabs({ tabs, activeTab, onChange }: ProducerTabsProps) {
  return (
    <div className="border-b border-slate-200">
      <nav className="flex" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onChange(tab.id)}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-teal-600 bg-teal-50 text-teal-600"
                : "text-slate-700 hover:bg-slate-50 hover:text-teal-600"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  )
}
