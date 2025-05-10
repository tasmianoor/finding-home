"use client"

import { useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"

export default function SignOutPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const signOut = async () => {
      await supabase.auth.signOut()
      // Add a query parameter to indicate successful sign out
      router.push('/?signedOut=true')
    }

    signOut()
  }, [router, supabase.auth])

  return null // This page will redirect immediately
} 