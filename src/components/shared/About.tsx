"use client"

import { Leaf, Heart, Recycle, Users, Award, Globe } from "lucide-react"

export default function About() {
  const values = [
    {
      icon: Leaf,
      title: "Sustainability First",
      description: "Every product we feature meets strict environmental and ethical standards.",
    },
    {
      icon: Heart,
      title: "Ethical Sourcing",
      description: "We partner with brands that prioritize fair wages and safe working conditions.",
    },
    {
      icon: Recycle,
      title: "Circular Economy",
      description: "Promoting products designed for longevity, repairability, and recyclability.",
    },
    {
      icon: Users,
      title: "Community Impact",
      description:
        "Supporting local communities and small businesses making a positive difference.",
    },
  ]

  const stats = [
    { number: "10,000+", label: "Sustainable Products" },
    { number: "500+", label: "Verified Brands" },
    { number: "50,000+", label: "Happy Customers" },
    { number: "1M+", label: "CO2 Saved (lbs)" },
  ]

  const team = [
    {
      name: "Sarah Johnson",
      role: "Founder & CEO",
      image: "/professional-woman-diverse.png",
      bio: "Environmental scientist turned entrepreneur, passionate about making sustainable living accessible to everyone.",
    },
    {
      name: "Michael Chen",
      role: "Head of Sustainability",
      image: "/professional-man.png",
      bio: "Former sustainability consultant with 10+ years experience in green supply chain management.",
    },
    {
      name: "Emily Rodriguez",
      role: "Product Curator",
      image: "/professional-woman-diverse.png",
      bio: "Expert in sustainable materials and ethical manufacturing, ensuring every product meets our standards.",
    },
  ]

  return (
    <div className="min-h-screen bg-green-50">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-16 text-center">
          <h1 className="mb-6 text-4xl font-bold text-green-800 md:text-5xl">
            Building a Sustainable Future, Together
          </h1>
          <p className="mx-auto max-w-3xl text-xl leading-relaxed text-green-600">
            EcoShop is more than just a marketplace. We're a community of conscious consumers and
            ethical brands working together to create a more sustainable world through mindful
            shopping choices.
          </p>
        </div>

        <div className="mb-16 rounded-lg border border-green-200 bg-white p-8 shadow-sm">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-6 text-3xl font-bold text-green-800">Our Mission</h2>
            <p className="mb-6 text-lg leading-relaxed text-green-700">
              To make sustainable shopping simple, accessible, and rewarding by connecting conscious
              consumers with verified eco-friendly products and ethical brands. We believe that
              every purchase is a vote for the kind of world we want to live in.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Globe className="h-6 w-6 text-green-600" />
              <span className="font-medium text-green-600">
                One purchase at a time, we're changing the world
              </span>
            </div>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="mb-12 text-center text-3xl font-bold text-green-800">Our Values</h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <div
                  key={index}
                  className="rounded-lg border border-green-200 bg-white p-6 text-center shadow-sm"
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                    <Icon className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="mb-3 text-xl font-semibold text-green-800">{value.title}</h3>
                  <p className="text-green-600">{value.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="mb-16 rounded-lg bg-green-600 p-8">
          <h2 className="mb-12 text-center text-3xl font-bold text-white">Our Impact</h2>
          <div className="grid gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="mb-2 text-4xl font-bold text-white">{stat.number}</div>
                <div className="text-green-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="mb-16 grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h2 className="mb-6 text-3xl font-bold text-green-800">Our Story</h2>
            <div className="space-y-4 text-green-700">
              <p>
                EcoShop was born from a simple frustration: finding truly sustainable products was
                too difficult and time-consuming. Our founder, Sarah, spent countless hours
                researching brands, reading certifications, and trying to understand complex supply
                chains.
              </p>
              <p>
                She realized that if someone with an environmental science background found it
                challenging, how could everyday consumers make informed sustainable choices? That's
                when the idea for EcoShop was born.
              </p>
              <p>
                Today, we've built a platform that does the hard work for you. Every product is
                thoroughly vetted, every brand is carefully selected, and every purchase contributes
                to a more sustainable future.
              </p>
            </div>
          </div>
          <div className="rounded-lg bg-green-100 p-8 text-center">
            <Award className="mx-auto mb-4 h-16 w-16 text-green-600" />
            <h3 className="mb-2 text-xl font-semibold text-green-800">Certified B Corporation</h3>
            <p className="text-green-600">
              We're proud to be a certified B Corporation, meeting the highest standards of social
              and environmental performance, accountability, and transparency.
            </p>
          </div>
        </div>

        <div className="mb-16">
          <h2 className="mb-12 text-center text-3xl font-bold text-green-800">Meet Our Team</h2>
          <div className="grid gap-8 md:grid-cols-3">
            {team.map((member, index) => (
              <div
                key={index}
                className="overflow-hidden rounded-lg border border-green-200 bg-white shadow-sm"
              >
                <img
                  src={member.image || "/placeholder.svg"}
                  alt={member.name}
                  className="h-64 w-full object-cover"
                />
                <div className="p-6">
                  <h3 className="mb-1 text-xl font-semibold text-green-800">{member.name}</h3>
                  <p className="mb-3 font-medium text-green-600">{member.role}</p>
                  <p className="text-sm text-green-700">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-green-200 bg-white p-8 text-center shadow-sm">
          <h2 className="mb-4 text-3xl font-bold text-green-800">Join Our Mission</h2>
          <p className="mx-auto mb-6 max-w-2xl text-green-600">
            Ready to make a difference with your shopping choices? Explore our curated collection of
            sustainable products and start your journey toward more conscious consumption.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <button className="rounded-lg bg-green-600 px-8 py-3 font-medium text-white transition-colors hover:bg-green-700">
              Start Shopping
            </button>
            <button className="rounded-lg border border-green-600 px-8 py-3 font-medium text-green-600 transition-colors hover:bg-green-50">
              Become a Partner
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
