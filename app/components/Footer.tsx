"use client"

import { HomeIcon } from "lucide-react"
import Image from "next/image"

export default function Footer() {
  return (
    <footer className="bg-[#171415] text-[#faf9f5] pt-6 pb-14 newsreader-400">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-start">
        <div className="flex flex-col items-start mb-4 md:mb-0">
          <div className="flex items-center gap-4">
            <Image
              src="/logos/logo-white.png"
              alt="Finding Home Logo"
              width={40}
              height={40}
              className="logo"
            />
            <span 
              className="font-medium fraunces-400 text-[#faf9f5] tracking-[0.04em]" 
              style={{ fontSize: "32px", lineHeight: "48px" }}
            >
              Finding Home
            </span>
          </div>
          <div className="mt-2 text-[#faf9f5] newsreader-400">
            For more information, please contact Tasmia Noor at{" "}
            <a href="mailto:tan50@hsg.harvard.edu" className="text-[#faf9f5] hover:underline newsreader-400">
              tan50@hsg.harvard.edu
            </a>
          </div>
        </div>
        <div className="text-[#faf9f5] text-left md:text-right md:mt-[72px]">
          <p>Copyright© 2024 | by Tasmia Noor</p>
        </div>
      </div>
    </footer>
  )
} 