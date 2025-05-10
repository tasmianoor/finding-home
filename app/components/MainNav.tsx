"use client"

import { useState, useEffect } from "react"
import { Menu } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { HomeIcon, PlusCircle, Bookmark, PenLine } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

export default function MainNav() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isSignedIn, setIsSignedIn] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientComponentClient()

  const isHomePage = pathname === '/'

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setIsSignedIn(!!session)
    }
    checkSession()
  }, [supabase.auth])

  const handleHomeClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (isSignedIn) {
      router.push('/dashboard')
    } else {
      router.push('/')
    }
  }

  return (
    <header className={`flex justify-between px-4 sm:px-6 pr-8 sm:pr-8 py-3 sm:py-4 fixed top-0 left-0 right-0 z-50 ${isHomePage ? 'bg-transparent' : 'bg-white shadow-sm'}`}>
      <Link href={isSignedIn ? "/dashboard" : "/"} onClick={handleHomeClick} className="flex items-end gap-2">
        <Image
          src={isHomePage ? "/logos/logo-white.png" : "/logos/logo-orange.png"}
          alt="Finding Home Logo"
          width={30}
          height={30}
          className="w-[30px] h-[30px]"
        />
        <span className={`text-[18px] leading-[24px] font-normal fraunces-400 ${isHomePage ? 'text-white' : 'text-[#171415]'}`}>Finding Home</span>
      </Link>

      {/* Navigation Links */}
      <div className="flex items-end gap-6">
        {isSignedIn ? (
          <>
            <Link 
              href="/add-memories" 
              className={`flex items-end gap-1 font-normal transition-colors ${
                isHomePage 
                  ? 'text-white hover:text-white/80' 
                  : 'text-[#171415] hover:text-[#d97756]'
              } ${pathname === '/add-memories' ? (isHomePage ? 'text-white/80' : 'text-[#d97756]') : ''}`}
            >
              <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="text-sm sm:text-base hidden sm:inline font-normal">Add your own memories</span>
              <span className="text-sm inline sm:hidden font-normal">Add</span>
            </Link>
            <Link 
              href="/profile" 
              className={`text-sm sm:text-base font-normal transition-colors ${
                isHomePage 
                  ? 'text-white hover:text-white/80' 
                  : 'text-[#171415] hover:text-[#d97756]'
              } ${pathname === '/profile' ? (isHomePage ? 'text-white/80' : 'text-[#d97756]') : ''}`}
            >
              Profile
            </Link>
            <Link 
              href="/signout" 
              className={`text-sm sm:text-base font-normal transition-colors ${
                isHomePage 
                  ? 'text-white hover:text-white/80' 
                  : 'text-[#171415] hover:text-[#d97756]'
              } ${pathname === '/signout' ? (isHomePage ? 'text-white/80' : 'text-[#d97756]') : ''}`}
            >
              Sign out
            </Link>
          </>
        ) : (
          <Link 
            href="/signin" 
            className={`text-sm sm:text-base font-normal transition-colors ${
              isHomePage 
                ? 'text-white hover:text-white/80' 
                : 'text-[#171415] hover:text-[#d97756]'
            } ${pathname === '/signin' ? (isHomePage ? 'text-white/80' : 'text-[#d97756]') : ''}`}
          >
            Sign in
          </Link>
        )}
      </div>

      {/* Mobile menu button */}
      <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`sm:hidden flex items-end ${isHomePage ? 'text-white' : 'text-[#171415]'}`}>
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className={`absolute top-full right-0 shadow-md rounded-md p-4 sm:hidden ${isHomePage ? 'bg-[#6b2412]/90' : 'bg-[#faf9f5]'}`}>
          <div className="flex flex-col gap-4">
            {isSignedIn ? (
              <>
                <Link
                  href="/add-memories"
                  className={`transition-colors font-normal ${
                    isHomePage 
                      ? 'text-white hover:text-white/80' 
                      : 'text-[#171415] hover:text-[#d97756]'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Add your own memories
                </Link>
                <Link
                  href="/profile"
                  className={`transition-colors font-normal ${
                    isHomePage 
                      ? 'text-white hover:text-white/80' 
                      : 'text-[#171415] hover:text-[#d97756]'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  href="/signout"
                  className={`transition-colors font-normal ${
                    isHomePage 
                      ? 'text-white hover:text-white/80' 
                      : 'text-[#171415] hover:text-[#d97756]'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign out
                </Link>
              </>
            ) : (
              <Link
                href="/signin"
                className={`transition-colors font-normal ${
                  isHomePage 
                    ? 'text-white hover:text-white/80' 
                    : 'text-[#171415] hover:text-[#d97756]'
                }`}
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
} 