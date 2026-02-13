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
      description: "Supporting local communities and small businesses making a positive difference.",
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
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-green-800 mb-6">
            Building a Sustainable Future, Together
          </h1>
          <p className="text-xl text-green-600 max-w-3xl mx-auto leading-relaxed">
            EcoShop is more than just a marketplace. We're a community of conscious consumers and ethical brands working
            together to create a more sustainable world through mindful shopping choices.
          </p>
        </div>

        {/* Mission Statement */}
        <div className="bg-white rounded-lg shadow-sm border border-green-200 p-8 mb-16">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-green-800 mb-6">Our Mission</h2>
            <p className="text-lg text-green-700 leading-relaxed mb-6">
              To make sustainable shopping simple, accessible, and rewarding by connecting conscious consumers with
              verified eco-friendly products and ethical brands. We believe that every purchase is a vote for the kind
              of world we want to live in.
            </p>
            <div className="flex items-center justify-center gap-2">
              <Globe className="w-6 h-6 text-green-600" />
              <span className="text-green-600 font-medium">One purchase at a time, we're changing the world</span>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-green-800 text-center mb-12">Our Values</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-green-200 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-green-800 mb-3">{value.title}</h3>
                  <p className="text-green-600">{value.description}</p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-green-600 rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Our Impact</h2>
          <div className="grid md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-white mb-2">{stat.number}</div>
                <div className="text-green-100">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Story */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-16">
          <div>
            <h2 className="text-3xl font-bold text-green-800 mb-6">Our Story</h2>
            <div className="space-y-4 text-green-700">
              <p>
                EcoShop was born from a simple frustration: finding truly sustainable products was too difficult and
                time-consuming. Our founder, Sarah, spent countless hours researching brands, reading certifications,
                and trying to understand complex supply chains.
              </p>
              <p>
                She realized that if someone with an environmental science background found it challenging, how could
                everyday consumers make informed sustainable choices? That's when the idea for EcoShop was born.
              </p>
              <p>
                Today, we've built a platform that does the hard work for you. Every product is thoroughly vetted, every
                brand is carefully selected, and every purchase contributes to a more sustainable future.
              </p>
            </div>
          </div>
          <div className="bg-green-100 rounded-lg p-8 text-center">
            <Award className="w-16 h-16 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-green-800 mb-2">Certified B Corporation</h3>
            <p className="text-green-600">
              We're proud to be a certified B Corporation, meeting the highest standards of social and environmental
              performance, accountability, and transparency.
            </p>
          </div>
        </div>

        {/* Team */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-green-800 text-center mb-12">Meet Our Team</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {team.map((member, index) => (
              <div key={index} className="bg-white rounded-lg shadow-sm border border-green-200 overflow-hidden">
                <img src={member.image || "/placeholder.svg"} alt={member.name} className="w-full h-64 object-cover" />
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-green-800 mb-1">{member.name}</h3>
                  <p className="text-green-600 font-medium mb-3">{member.role}</p>
                  <p className="text-green-700 text-sm">{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Call to Action */}
        <div className="bg-white rounded-lg shadow-sm border border-green-200 p-8 text-center">
          <h2 className="text-3xl font-bold text-green-800 mb-4">Join Our Mission</h2>
          <p className="text-green-600 mb-6 max-w-2xl mx-auto">
            Ready to make a difference with your shopping choices? Explore our curated collection of sustainable
            products and start your journey toward more conscious consumption.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-green-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors">
              Start Shopping
            </button>
            <button className="border border-green-600 text-green-600 px-8 py-3 rounded-lg font-medium hover:bg-green-50 transition-colors">
              Become a Partner
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
