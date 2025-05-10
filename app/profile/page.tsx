"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import Image from 'next/image'
import MainNav from '../components/MainNav'
import Footer from '../components/Footer'

interface Profile {
  id: string
  full_name: string
  email: string
  relation_to_robin: string
  bio: string | null
  avatar_url: string | null
  updated_at: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const getProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/signin')
          return
        }

        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()

        if (error) throw error

        if (!data) {
          router.push('/profile/setup')
          return
        }

        setProfile(data as Profile)
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setIsLoading(false)
      }
    }

    getProfile()
  }, [supabase, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f5]">
        <MainNav />
        <main className="pt-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
            <div className="text-center">
              <p className="text-[#171415] newsreader-400">Loading...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (!profile) {
    return null
  }

  return (
    <div className="min-h-screen bg-[#faf9f5]">
      <MainNav />
      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 mb-8">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-[#faf9f5]">
                {profile.avatar_url ? (
                  <Image
                    src={profile.avatar_url}
                    alt={profile.full_name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#d97756]">
                    <span className="text-4xl font-medium">
                      {profile.full_name?.charAt(0) || '?'}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#171415] mb-2 newsreader-500">
                  {profile.full_name}
                </h1>
                <p className="text-[#171415] mb-1 newsreader-400">
                  {profile.email}
                </p>
                <p className="text-[#171415]/60 newsreader-400">
                  {profile.relation_to_robin ? (
                    profile.relation_to_robin.split('_').map(word => 
                      word.charAt(0).toUpperCase() + word.slice(1)
                    ).join(' ')
                  ) : 'Relation to Robin'}
                </p>
              </div>
            </div>

            {profile.bio && (
              <div className="mt-6 pt-6 border-t border-[#e4d9cb]">
                <h2 className="text-lg font-medium text-[#171415] mb-2 newsreader-500">
                  About
                </h2>
                <p className="text-[#171415]/80 newsreader-400">
                  {profile.bio}
                </p>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-[#e4d9cb]">
              <p className="text-sm text-[#171415]/40 newsreader-400">
                Profile last updated: {new Date(profile.updated_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
