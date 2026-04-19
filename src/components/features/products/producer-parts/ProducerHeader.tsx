"use client"

import { Award, Calendar, Leaf, MapPin, Users } from "lucide-react"
import type { Producer } from "./producer-mock"

interface ProducerHeaderProps {
  producer: Producer
}

export function ProducerHeader({ producer }: ProducerHeaderProps) {
  return (
    <div className="relative -mt-16 mb-8">
      <div className="rounded-xl bg-white p-6 shadow-lg md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start">
          <div className="-mt-16 flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-xl border-4 border-white bg-teal-600 shadow-lg md:-mt-20 md:h-32 md:w-32">
            <span className="text-4xl font-bold text-white md:text-5xl">
              {producer.logoInitial}
            </span>
          </div>

          <div className="flex-1">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-800">{producer.name}</h1>
                <p className="mt-1 text-slate-600">{producer.description}</p>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-teal-100 px-4 py-2">
                <Leaf className="h-6 w-6 text-teal-600" />
                <div>
                  <span className="text-2xl font-bold text-teal-700">
                    {producer.sustainabilityScore}%
                  </span>
                  <p className="text-xs text-teal-600">Nachhaltigkeits-Score</p>
                </div>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin className="h-4 w-4" />
                <span>
                  {producer.location}, {producer.country}
                </span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Calendar className="h-4 w-4" />
                <span>Gegründet {producer.foundedYear}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Users className="h-4 w-4" />
                <span>{producer.employeeCount} Mitarbeiter</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {producer.certifications.map((cert) => (
                <span
                  key={cert}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700"
                >
                  <Award className="h-3 w-3" />
                  {cert}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
