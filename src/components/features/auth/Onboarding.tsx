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
      prev.includes(preferenceId)
        ? prev.filter((id) => id !== preferenceId)
        : [...prev, preferenceId]
    )
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    } else {
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
    <div className="flex min-h-screen items-center justify-center bg-green-50 p-4">
      <div className="w-full max-w-2xl rounded-lg bg-white p-8 shadow-xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-green-700">
              Step {currentStep} of {totalSteps}
            </span>
            <span className="text-sm text-green-600">
              {Math.round((currentStep / totalSteps) * 100)}% Complete
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-green-200">
            <div
              className="h-2 rounded-full bg-green-600 transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {currentStep === 1 && (
            <div>
              <h2 className="mb-2 text-2xl font-bold text-green-800">What matters most to you?</h2>
              <p className="mb-6 text-green-600">
                Select the sustainability aspects that are important to you. This helps us recommend
                the best products.
              </p>
              <div className="grid gap-4 md:grid-cols-2">
                {sustainabilityOptions.map((option) => {
                  const Icon = option.icon
                  const isSelected = selectedPreferences.includes(option.id)
                  return (
                    <button
                      key={option.id}
                      onClick={() => handlePreferenceToggle(option.id)}
                      className={`rounded-lg border-2 p-4 text-left transition-all hover:shadow-md ${
                        isSelected
                          ? "border-green-600 bg-green-50 shadow-md"
                          : "border-green-200 hover:border-green-400"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`rounded-lg p-2 ${isSelected ? "bg-green-600 text-white" : "bg-green-100 text-green-600"}`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h3
                            className={`mb-1 font-semibold ${isSelected ? "text-green-800" : "text-green-700"}`}
                          >
                            {option.label}
                          </h3>
                          <p
                            className={`text-sm ${isSelected ? "text-green-700" : "text-green-600"}`}
                          >
                            {option.description}
                          </p>
                        </div>
                        {isSelected && <Check className="mt-1 h-5 w-5 text-green-600" />}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h2 className="mb-2 text-2xl font-bold text-green-800">What's your budget range?</h2>
              <p className="mb-6 text-green-600">
                Help us show you products within your preferred price range for better
                recommendations.
              </p>
              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-medium text-green-700">
                    Monthly Budget: ${budgetRange[0]} - ${budgetRange[1]}
                  </label>
                  <div className="px-4">
                    <input
                      type="range"
                      min="25"
                      max="500"
                      step="25"
                      value={budgetRange[1]}
                      onChange={(e) =>
                        setBudgetRange([budgetRange[0], Number.parseInt(e.target.value)])
                      }
                      className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-green-200 accent-green-600"
                    />
                    <div className="mt-1 flex justify-between text-sm text-green-600">
                      <span>$25</span>
                      <span>$500+</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="rounded-lg bg-green-50 p-4 text-center">
                    <h4 className="font-semibold text-green-800">Budget-Friendly</h4>
                    <p className="text-sm text-green-600">$25 - $75</p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-4 text-center">
                    <h4 className="font-semibold text-green-800">Mid-Range</h4>
                    <p className="text-sm text-green-600">$75 - $200</p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-4 text-center">
                    <h4 className="font-semibold text-green-800">Premium</h4>
                    <p className="text-sm text-green-600">$200+</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h2 className="mb-2 text-2xl font-bold text-green-800">How often do you shop?</h2>
              <p className="mb-6 text-green-600">
                This helps us understand your shopping habits and provide personalized
                recommendations.
              </p>
              <div className="space-y-3">
                {[
                  {
                    value: "weekly",
                    label: "Weekly",
                    description: "I shop for sustainable products regularly",
                  },
                  {
                    value: "monthly",
                    label: "Monthly",
                    description: "I make sustainable purchases monthly",
                  },
                  {
                    value: "occasionally",
                    label: "Occasionally",
                    description: "I buy sustainable products when needed",
                  },
                  {
                    value: "rarely",
                    label: "Rarely",
                    description: "I'm just starting my sustainable journey",
                  },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setShoppingFrequency(option.value)}
                    className={`w-full rounded-lg border-2 p-4 text-left transition-all hover:shadow-md ${
                      shoppingFrequency === option.value
                        ? "border-green-600 bg-green-50 shadow-md"
                        : "border-green-200 hover:border-green-400"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3
                          className={`mb-1 font-semibold ${shoppingFrequency === option.value ? "text-green-800" : "text-green-700"}`}
                        >
                          {option.label}
                        </h3>
                        <p
                          className={`text-sm ${shoppingFrequency === option.value ? "text-green-700" : "text-green-600"}`}
                        >
                          {option.description}
                        </p>
                      </div>
                      {shoppingFrequency === option.value && (
                        <Check className="h-5 w-5 text-green-600" />
                      )}
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
            className="flex items-center gap-2 px-4 py-2 text-green-700 transition-colors hover:text-green-900 disabled:cursor-not-allowed disabled:text-green-400"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed()}
            className="flex items-center gap-2 rounded-lg bg-green-600 px-6 py-2 font-medium text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:bg-green-400"
          >
            {currentStep === totalSteps ? "Complete Setup" : "Next"}
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
