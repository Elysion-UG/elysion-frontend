"use client"

import { useState } from "react"
import { Mail, CheckCircle, RefreshCw, ArrowLeft } from "lucide-react"

export default function EmailVerification() {
  const [email] = useState("user@example.com") // This would come from the registration process
  const [isResending, setIsResending] = useState(false)
  const [resendCount, setResendCount] = useState(0)

  const handleResendEmail = async () => {
    setIsResending(true)
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 2000))
    setIsResending(false)
    setResendCount(resendCount + 1)
  }

  const handleBackToLogin = () => {
    console.log("Navigate back to login")
    // Here you would handle navigation back to login
  }

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-green-800 mb-2">Check Your Email</h1>
          <p className="text-green-600">
            We've sent a verification link to <br />
            <span className="font-medium">{email}</span>
          </p>
        </div>

        {/* Instructions */}
        <div className="space-y-4 mb-8">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-green-700 text-sm">Click the verification link in your email to activate your account</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-green-700 text-sm">Check your spam folder if you don't see the email in your inbox</p>
          </div>
          <div className="flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <p className="text-green-700 text-sm">The verification link will expire in 24 hours</p>
          </div>
        </div>

        {/* Resend Email */}
        <div className="space-y-4">
          <button
            onClick={handleResendEmail}
            disabled={isResending}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 disabled:bg-green-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isResending ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Resend Verification Email
              </>
            )}
          </button>

          {resendCount > 0 && (
            <div className="text-center">
              <p className="text-green-600 text-sm">
                Email sent! ({resendCount} {resendCount === 1 ? "time" : "times"})
              </p>
            </div>
          )}

          <button
            onClick={handleBackToLogin}
            className="w-full border border-green-300 text-green-700 py-3 px-4 rounded-lg font-medium hover:bg-green-50 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Still having trouble?{" "}
            <button
              onClick={() => alert("Contact support functionality would be implemented here")}
              className="text-green-600 hover:text-green-800 font-medium transition-colors"
            >
              Contact Support
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
