"use client"

import type React from "react"

import { useState } from "react"
import { Mail, Phone, MapPin, Send, Clock, MessageCircle } from "lucide-react"

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    await new Promise((resolve) => setTimeout(resolve, 2000))

    console.log("Contact form submitted:", formData)
    alert("Thank you for your message! We'll get back to you soon.")

    setFormData({
      name: "",
      email: "",
      subject: "",
      message: "",
    })
    setIsSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-stone-800">Get in Touch</h1>
          <p className="mx-auto max-w-2xl text-xl text-sage-600">
            Have questions about sustainable shopping or need help with your order? We're here to
            help!
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <div>
              <h2 className="mb-6 text-2xl font-bold text-stone-800">Contact Information</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-sage-50">
                    <Mail className="h-6 w-6 text-sage-600" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-stone-800">Email Us</h3>
                    <p className="text-sage-600">support@ecoshop.com</p>
                    <p className="text-sage-600">hello@ecoshop.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-sage-50">
                    <Phone className="h-6 w-6 text-sage-600" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-stone-800">Call Us</h3>
                    <p className="text-sage-600">+1 (555) 123-4567</p>
                    <p className="text-sm text-sage-600">Mon-Fri, 9AM-6PM EST</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-sage-50">
                    <MapPin className="h-6 w-6 text-sage-600" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-stone-800">Visit Us</h3>
                    <p className="text-sage-600">123 Sustainable Street</p>
                    <p className="text-sage-600">Green City, GC 12345</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-stone-200 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <Clock className="h-6 w-6 text-sage-600" />
                <h3 className="text-lg font-semibold text-stone-800">Business Hours</h3>
              </div>
              <div className="space-y-2 text-stone-700">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span>9:00 AM - 6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span>10:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span>Closed</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-sage-50 p-6">
              <div className="mb-3 flex items-center gap-3">
                <MessageCircle className="h-6 w-6 text-sage-600" />
                <h3 className="text-lg font-semibold text-stone-800">Quick Answers</h3>
              </div>
              <p className="mb-4 text-stone-700">
                Looking for quick answers? Check out our frequently asked questions for instant
                help.
              </p>
              <button className="rounded-lg bg-bark-700 px-4 py-2 text-white transition-colors hover:bg-bark-800">
                View FAQ
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-stone-200 bg-white p-8 shadow-sm">
            <h2 className="mb-6 text-2xl font-bold text-stone-800">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium text-stone-700">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-stone-200 px-4 py-3 transition-colors focus:border-sage-500 focus:ring-2 focus:ring-sage-100"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-medium text-stone-700">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full rounded-lg border border-stone-200 px-4 py-3 transition-colors focus:border-sage-500 focus:ring-2 focus:ring-sage-100"
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="mb-2 block text-sm font-medium text-stone-700">
                  Subject *
                </label>
                <select
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="w-full rounded-lg border border-stone-200 px-4 py-3 transition-colors focus:border-sage-500 focus:ring-2 focus:ring-sage-100"
                >
                  <option value="">Select a subject</option>
                  <option value="general">General Inquiry</option>
                  <option value="order">Order Support</option>
                  <option value="product">Product Question</option>
                  <option value="sustainability">Sustainability Information</option>
                  <option value="partnership">Partnership Opportunity</option>
                  <option value="feedback">Feedback</option>
                </select>
              </div>

              <div>
                <label htmlFor="message" className="mb-2 block text-sm font-medium text-stone-700">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="resize-vertical w-full rounded-lg border border-stone-200 px-4 py-3 transition-colors focus:border-sage-500 focus:ring-2 focus:ring-sage-100"
                  placeholder="Tell us how we can help you..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-bark-700 px-6 py-3 font-medium text-white transition-colors hover:bg-bark-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
