"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { HomeIcon, PlusCircle, Bookmark, PenLine } from "lucide-react"
import { usePathname } from "next/navigation"

export default function MainNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="bg-white flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-50 shadow-sm">
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/logos/logo-orange.png"
          alt="Finding Home Logo"
          width={30}
          height={30}
          className="w-[30px] h-[30px]"
        />
        <span className="text-sm sm:text-base text-[#171415] font-medium">Finding Home</span>
      </Link>

      {/* Navigation Links */}
      <div className="flex items-center gap-6">
        <Link 
          href="/add-memories" 
          className={`flex items-center gap-1 text-[#171415] font-normal hover:text-[#d97756] transition-colors ${
            pathname === '/add-memories' ? 'text-[#d97756]' : ''
          }`}
        >
          <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4" />
          <span className="text-sm sm:text-base hidden sm:inline font-normal">Add your own memories</span>
          <span className="text-sm inline sm:hidden font-normal">Add</span>
        </Link>
        <Link 
          href="/profile" 
          className={`text-sm sm:text-base text-[#171415] font-normal hover:text-[#d97756] transition-colors ${
            pathname === '/profile' ? 'text-[#d97756]' : ''
          }`}
        >
          Profile
        </Link>
        <Link 
          href="/signout" 
          className={`text-sm sm:text-base text-[#171415] font-normal hover:text-[#d97756] transition-colors ${
            pathname === '/signout' ? 'text-[#d97756]' : ''
          }`}
        >
          Sign out
        </Link>
      </div>

      {/* Mobile menu button */}
      <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="sm:hidden text-[#171415]">
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="absolute top-full right-0 bg-[#faf9f5] shadow-md rounded-md p-4 sm:hidden">
          <div className="flex flex-col gap-4">
            <Link
              href="/add-memories"
              className="text-[#171415] hover:text-[#d97756] transition-colors font-normal"
              onClick={() => setMobileMenuOpen(false)}
            >
              Add your own memories
            </Link>
            <Link
              href="/profile"
              className="text-[#171415] hover:text-[#d97756] transition-colors font-normal"
              onClick={() => setMobileMenuOpen(false)}
            >
              Profile
            </Link>
            <Link
              href="/signout"
              className="text-[#171415] hover:text-[#d97756] transition-colors font-normal"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign out
            </Link>
          </div>
        </div>
      )}
    </header>
  )
} 