"use client"

import Link from "next/link"
import Image from "next/image"

export default function ConfirmPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#faf9f5]">
      {/* Simple Header */}
      <header className="flex justify-center items-center py-6">
        <Link href="/" className="flex items-end gap-2">
          <Image
            src="/logos/logo-orange.png"
            alt="Finding Home Logo"
            width={30}
            height={30}
            className="w-[30px] h-[30px]"
          />
          <span className="text-[18px] leading-[24px] font-normal fraunces-400 text-[#171415]">Finding Home</span>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-md mx-auto px-4 py-8 text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-[#171415] mb-4 fraunces-500">
            Check your email
          </h1>
          <p className="text-[#171415]/80 mb-8 newsreader-400" style={{ fontSize: "20px", lineHeight: "28px" }}>
            A confirmation link has been sent to your email address. Please click the link to verify your account and gain access to Finding Home.
          </p>
          <div className="space-y-4">
            <Link
              href="/signin"
              className="block w-full bg-[#171415] hover:bg-[#171415]/90 text-[#faf9f5] py-3 px-4 rounded-md transition-colors text-center newsreader-400"
            >
              Go to Sign In
            </Link>
            <Link
              href="/"
              className="block text-[#B34700] hover:text-[#B34700]/90 transition-colors newsreader-400"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
} 