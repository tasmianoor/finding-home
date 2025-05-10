"use client"

import { useState } from "react"
import { HomeIcon, ArrowUp, X, Menu } from "lucide-react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import Link from "next/link"
import MainNav from "./components/MainNav"
import ImageCarousel from "./components/ImageCarousel"
import Footer from "./components/Footer"

export default function Home() {
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
  })

  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: formData.fullName,
          },
        },
      })

      if (authError) {
        setError(authError.message)
        return
      }

      if (authData?.user) {
        // Redirect to confirmation page immediately
        router.push('/auth/confirm')
      }
    } catch (error) {
      console.error('Signup error:', error)
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
      <MainNav />

      {/* Hero Section with Video Background */}
      <section className="relative h-screen w-full overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 w-full h-full">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute min-w-full min-h-full object-cover"
            preload="auto"
          >
            <source 
              src="https://gfnfawmtebnndhundozy.supabase.co/storage/v1/object/public/videos//bangladesh.mp4" 
              type="video/mp4" 
            />
            Your browser does not support the video tag.
          </video>
          {/* Overlay */}
          <div className="absolute inset-0 bg-[#6b2412] bg-opacity-80"></div>
        </div>

        {/* Content */}
        <div className="relative z-10 h-full flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 md:mb-6 fraunces-400" style={{ fontSize: "60px" }}>Finding Home</h1>
            <p className="text-xl md:text-2xl text-white mb-6 md:mb-8 leading-tight newsreader-200" style={{ fontSize: "36px", lineHeight: "44px", letterSpacing: "0.05em" }}>
              <strong>A collection of memories and stories of Robin Noor</strong>
              </p>
              <div>
              <a href="#join-form" className="btn-primary" style={{ fontSize: "22px", fontWeight: "300" }}>
                Get access to memories today
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="bg-[#faf9f5] py-12 md:py-16 relative">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-12">
            <h2 className="text-2xl md:text-3xl font-medium text-[#171415] fraunces-400">About</h2>
            <div className="md:col-span-3 text-[#171415] space-y-6 md:space-y-10">
              <p className="text-base md:text-lg leading-relaxed newsreader-400" style={{ fontSize: "24px", lineHeight: "32px" }}>
                Finding Home is a special place where families can save and share their stories for years to come. Think of it as a digital family album that never gets dusty or lost. Each story becomes a treasure that family members near and far can enjoy together. The best part? These memories stay safe in one place, ready for children, grandchildren, and even great-grandchildren to discover.
              </p>
              <p className="text-base md:text-lg leading-relaxed newsreader-400" style={{ fontSize: "24px", lineHeight: "32px" }}>
                Finding Home helps bridge the gap between generations, making sure that important family stories and wisdom don't fade away with time.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-white py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 md:gap-12">
          <h2 className="text-2xl md:text-3xl font-medium text-[#171415] fraunces-400">How it works</h2>
            <div className="md:col-span-3 text-[#171415] space-y-6 md:space-y-10">
              <p className="text-base md:text-lg leading-relaxed newsreader-400" style={{ fontSize: "24px"}}>
                1. Request Access </p>
              <p className="text-base md:text-lg leading-relaxed newsreader-300" style={{ fontSize: "20px", lineHeight: "28px", marginTop: "20px" }}>
              To keep your family stories private and secure, Finding Home is invitation-only. Simply request access through our homepage, and we'll help you get started.</p>

              <p className="text-base md:text-lg leading-relaxed newsreader-400" style={{ fontSize: "24px"}}>
              2. Explore & interact </p>
              <p className="text-base md:text-lg leading-relaxed newsreader-300" style={{ fontSize: "20px", marginTop: "20px" }}>
              Family members can watch, listen to, and comment on each story. Start conversations, ask questions, and add details that make the memories even richer.</p>

              <p className="text-base md:text-lg leading-relaxed newsreader-400" style={{ fontSize: "24px"}}>
                3. Share your own stories</p>
              <p className="text-base md:text-lg leading-relaxed newsreader-300" style={{ fontSize: "20px", marginTop: "20px" }}>
              Upload videos of Grandpa telling his favorite jokes, audio of Mom sharing her childhood memories, or photos from family reunions with the stories behind them.</p>

              <p className="text-base md:text-lg leading-relaxed newsreader-400" style={{ fontSize: "24px"}}>
                4 Preserve the future </p>
              <p className="text-base md:text-lg leading-relaxed newsreader-300" style={{ fontSize: "20px", marginTop: "20px" }}>
              All stories are safely stored and organized, creating a living history that grows with each new addition. Future generations will thank you for saving these precious memories.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Gallery */}
      <ImageCarousel />

      {/* Join Form Section */}
      <section id="join-form" className="py-16 md:py-24 bg-[#faf9f5]">
        
          <h2 className="text-3xl md:text-4xl font-medium text-[#171415] mb-8 md:mb-12 text-center fraunces-400">
            Get access to memories today
          </h2>
          <div className="max-w-lg mx-auto px-4 sm:px-6">
          <div className="mb-6 md:mb-8">
            <div className="text-[15px] md:text-[20px] text-[#171415] tracking-wider newsreader-500">
              Sign up below to request access and we'll send you an email verifying your account.
              <br />
              <span className="text-[#B34700] text-[15px] md:text-[20px] newsreader-500">(All fields are required.)</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 text-red-700 p-3 rounded-md text-sm newsreader-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSignUp} className="space-y-4 md:space-y-6">
            <div className="space-y-1 md:space-y-2">
              <label htmlFor="fullName" className="block text-[#171415] newsreader-400">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full p-2 md:p-3 border border-[#e4d9cb] rounded-md focus:outline-none focus:ring-1 focus:ring-[#171415] newsreader-200"
                required
              />
            </div>

            <div className="space-y-1 md:space-y-2">
              <label htmlFor="email" className="block text-[#171415] newsreader-400">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full p-2 md:p-3 border border-[#e4d9cb] rounded-md focus:outline-none focus:ring-1 focus:ring-[#171415] newsreader-200"
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
              className="btn-primary w-full"
            >
              {isLoading ? "Signing up..." : "Submit"}
            </button>
          </form>

          <div className="mt-4 md:mt-6 text-center newsreader-400">
            <Link href="/signin" className="text-[#B34700] hover:underline newsreader-400">
              Sign in here
            </Link>{" "}
            if you already have an account
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

      {/* Sign In Modal */}
      {showSignInModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-md relative">
            <button
              onClick={() => setShowSignInModal(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-4 md:p-6">
              <div className="mb-4 md:mb-6">
                <h3 className="text-base md:text-lg font-medium uppercase">
                  WELCOME HOME.{" "}
                  <span className="text-xs md:text-sm font-normal normal-case text-gray-500">
                    New to Finding Home?{" "}
                    <a
                      href="#join-form"
                      onClick={() => setShowSignInModal(false)}
                      className="text-amber-500 hover:underline"
                    >
                      Sign up here.
                    </a>
                  </span>
                </h3>
              </div>

              <form className="space-y-4">
                <div className="space-y-1 md:space-y-2">
                  <label htmlFor="signin-email" className="block text-gray-700">
                    Email address
                  </label>
                  <input
                    id="signin-email"
                    type="email"
                    className="w-full p-2 md:p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <label htmlFor="signin-password" className="block text-gray-700">
                    Password
                  </label>
                  <input
                    id="signin-password"
                    type="password"
                    className="w-full p-2 md:p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-amber-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white py-2 md:py-3 rounded-md transition-colors uppercase instrument-400"
                >
                  Submit
                </button>
              </form>

              <div className="mt-4">
                <button className="w-full bg-amber-100 text-amber-800 py-2 md:py-3 rounded-md hover:bg-amber-200 transition-colors instrument-400">
                  I forgot my password.
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
