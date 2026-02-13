"use client"

import type React from "react"

import { useState } from "react"
import { ChevronRight, ChevronLeft, Check, Leaf, Heart, Recycle } from "lucide-react"

type SustainabilityPreference = {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
}

const sustainabilityOptions: SustainabilityPreference[] = [
  {
    id: "organic",
    label: "Organic & Natural",
    description: "Products made from organic materials without harmful chemicals",
    icon: Leaf,
  },
  {
    id: "ethical",
    label: "Ethical Production",
    description: "Fair wages and safe working conditions for all workers",
    icon: Heart,
  },
  {
    id: "eco-friendly",
    label: "Eco-Friendly Packaging",
    description: "Minimal, recyclable, or biodegradable packaging materials",
    icon: Recycle,
  },
  {
    id: "local",
    label: "Locally Sourced",
    description: "Products sourced from local suppliers to reduce carbon footprint",
    icon: Leaf,
  },
  {
    id: "carbon-neutral",
    label: "Carbon Neutral",
    description: "Products with net-zero carbon emissions throughout their lifecycle",
    icon: Recycle,
  },
  {
    id: "cruelty-free",
    label: "Cruelty-Free",
    description: "No animal testing involved in product development or manufacturing",
    icon: Heart,
  },
]

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedPreferences, setSelectedPreferences] = useState<string[]>([])
  const [budgetRange, setBudgetRange] = useState<[number, number]>([50, 200])
  const [shoppingFrequency, setShoppingFrequency] = useState("")

  const totalSteps = 3

  const handlePreferenceToggle = (preferenceId: string) => {
    setSelectedPreferences((prev) =>
      prev.includes(preferenceId) ? prev.filter((id) => id !== preferenceId) : [...prev, preferenceId],
    )
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
      // Complete onboarding
      console.log("Onboarding completed:", {
        preferences: selectedPreferences,
        budget: budgetRange,
        frequency: shoppingFrequency,
      })
      alert("Onboarding completed! Redirecting to shop...")
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return selectedPreferences.length > 0
      case 2:
        return true // Budget step is always valid
      case 3:
        return shoppingFrequency !== ""
      default:
        return false
    }
  }

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-green-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-green-600">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-green-200 rounded-full h-2">
            <div
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">What matters most to you?</h2>
              <p className="text-green-600 mb-6">
                Select the sustainability aspects that are important to you. This helps us recommend the best products.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                {sustainabilityOptions.map((option) => {
                  const Icon = option.icon
                  const isSelected = selectedPreferences.includes(option.id)
                  return (
                    <button
                      key={option.id}
                      onClick={() => handlePreferenceToggle(option.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                        isSelected
                          ? "border-green-600 bg-green-50 shadow-md"
                          : "border-green-200 hover:border-green-400"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg ${isSelected ? "bg-green-600 text-white" : "bg-green-100 text-green-600"}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <h3 className={`font-semibold mb-1 ${isSelected ? "text-green-800" : "text-green-700"}`}>
                            {option.label}
                          </h3>
                          <p className={`text-sm ${isSelected ? "text-green-700" : "text-green-600"}`}>
                            {option.description}
                          </p>
                        </div>
                        {isSelected && <Check className="w-5 h-5 text-green-600 mt-1" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">What's your budget range?</h2>
              <p className="text-green-600 mb-6">
                Help us show you products within your preferred price range for better recommendations.
              </p>
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-green-700 mb-2">
                    Monthly Budget: ${budgetRange[0]} - ${budgetRange[1]}
                  </label>
                  <div className="px-4">
                    <input
                      type="range"
                      min="25"
                      max="500"
                      step="25"
                      value={budgetRange[1]}
                      onChange={(e) => setBudgetRange([budgetRange[0], Number.parseInt(e.target.value)])}
                      className="w-full h-2 bg-green-200 rounded-lg appearance-none cursor-pointer accent-green-600"
                    />
                    <div className="flex justify-between text-sm text-green-600 mt-1">
                      <span>$25</span>
                      <span>$500+</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <h4 className="font-semibold text-green-800">Budget-Friendly</h4>
                    <p className="text-green-600 text-sm">$25 - $75</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <h4 className="font-semibold text-green-800">Mid-Range</h4>
                    <p className="text-green-600 text-sm">$75 - $200</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <h4 className="font-semibold text-green-800">Premium</h4>
                    <p className="text-green-600 text-sm">$200+</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold text-green-800 mb-2">How often do you shop?</h2>
              <p className="text-green-600 mb-6">
                This helps us understand your shopping habits and provide personalized recommendations.
              </p>
              <div className="space-y-3">
                {[
                  { value: "weekly", label: "Weekly", description: "I shop for sustainable products regularly" },
                  { value: "monthly", label: "Monthly", description: "I make sustainable purchases monthly" },
                  {
                    value: "occasionally",
                    label: "Occasionally",
                    description: "I buy sustainable products when needed",
                  },
                  { value: "rarely", label: "Rarely", description: "I'm just starting my sustainable journey" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setShoppingFrequency(option.value)}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all hover:shadow-md ${
                      shoppingFrequency === option.value
                        ? "border-green-600 bg-green-50 shadow-md"
                        : "border-green-200 hover:border-green-400"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3
                          className={`font-semibold mb-1 ${shoppingFrequency === option.value ? "text-green-800" : "text-green-700"}`}
                        >
                          {option.label}
                        </h3>
                        <p
                          className={`text-sm ${shoppingFrequency === option.value ? "text-green-700" : "text-green-600"}`}
                        >
                          {option.description}
                        </p>
                      </div>
                      {shoppingFrequency === option.value && <Check className="w-5 h-5 text-green-600" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2 px-4 py-2 text-green-700 hover:text-green-900 disabled:text-green-400 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center gap-2 bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors"
          >
            {currentStep === totalSteps ? "Complete Setup" : "Next"}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
