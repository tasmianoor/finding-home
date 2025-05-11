"use client"

import Link from "next/link"
import { useState } from "react"
import { HomeIcon } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Footer from "../components/Footer"

export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      // Redirect to dashboard on successful sign in
      router.push('/dashboard')
    } catch (error) {
      console.error('Sign in error:', error)
      setError("An unexpected error occurred")
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target
    setFormData(prev => ({
      ...prev,
      [id]: value
    }))
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-[#faf9f5] flex justify-between items-center px-4 sm:px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/logos/logo-orange.png"
            alt="Finding Home Logo"
            width={30}
            height={30}
            className="w-[30px] h-[30px]"
          />
          <span className="text-[#171415] font-normal fraunces-400">Finding Home</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center bg-[#faf9f5]">
        <div className="max-w-md w-full mx-auto px-4 py-8">
          <div className="bg-[#faf9f5] p-6 rounded-lg shadow-sm border border-[#e4d9cb]">
            <h1 className="text-2xl font-bold text-[#171415] mb-6 fraunces-500">Sign In</h1>
            
            {error && (
              <div className="bg-[#faf9f5] text-[#d97756] p-3 rounded-md mb-4 newsreader-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-1 md:space-y-2">
                <label htmlFor="email" className="block text-[#171415] newsreader-400">
                  Email address
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full p-2 md:p-3 border border-[#e4d9cb] rounded-md focus:outline-none focus:ring-1 focus:ring-[#171415] newsreader-400"
                  required
                />
              </div>

              <div className="space-y-1 md:space-y-2">
                <label htmlFor="password" className="block text-[#171415] newsreader-400">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full p-2 md:p-3 border border-[#e4d9cb] rounded-md focus:outline-none focus:ring-1 focus:ring-[#171415] newsreader-400"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#171415] hover:bg-[#171415]/90 text-[#faf9f5] py-2 md:py-3 rounded-md transition-colors newsreader-400"
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="mt-4">
              <button className="w-full bg-[#faf9f5] text-[#B34700] py-2 md:py-3 rounded-md hover:bg-[#faf9f5]/90 transition-colors newsreader-400">
                I forgot my password
              </button>
            </div>

            <div className="mt-4 text-center newsreader-400">
              <Link href="/#join-form" className="text-[#B34700] hover:underline newsreader-400">
                Sign up here
              </Link>{" "}
              if you don't have an account
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
