"use client"

import Link from "next/link"
import { HomeIcon } from "lucide-react"

export default function ConfirmPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-amber-50 flex justify-between items-center px-4 sm:px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-black rounded p-1">
            <HomeIcon className="h-4 w-4 text-white" />
          </div>
          <span className="text-gray-800 font-medium">Finding Home</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center bg-amber-50">
        <div className="max-w-md mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
            Check your email
          </h1>
          <p className="text-gray-700 mb-8">
            A confirmation link has been sent to your email address. Please click the link to verify your account and gain access to Finding Home.
          </p>
          <div className="space-y-4">
            <Link
              href="/signin"
              className="block w-full bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-md transition-colors text-center"
            >
              Go to Sign In
            </Link>
            <Link
              href="/"
              className="block text-amber-600 hover:text-amber-700 transition-colors"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-4">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-2 mb-2 md:mb-0">
            <div className="bg-white rounded p-1">
              <HomeIcon className="h-4 w-4 text-gray-900" />
            </div>
            <span className="font-medium">Finding home</span>
          </div>
          <div className="text-xs text-gray-400">
            <p>Copyright© 2024</p>
            <p>Designed by T. Noor</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 