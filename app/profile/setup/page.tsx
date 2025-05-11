"use client"

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'
import { Upload, User } from 'lucide-react'
import Image from 'next/image'
import MainNav from '../../components/MainNav'
import Footer from '../../components/Footer'
import { Button } from '@/components/ui/button'

export default function ProfileSetupPage() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [relation, setRelation] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient({
    options: {
      global: {
        headers: {
          'Accept': 'application/json'
        }
      }
    }
  })
  const router = useRouter()

  useEffect(() => {
    const getInitialData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          router.push('/signin')
          return
        }

        // Check if profile already exists
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .throwOnError()

        if (profile) {
          router.push('/profile')
          return
        }

        // Set initial values from session
        setFullName(session.user.user_metadata?.full_name || '')
        setEmail(session.user.email || '')
      } catch (err) {
        console.error('Error:', err)
      }
    }

    getInitialData()
  }, [supabase, router])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null)
      setIsUploading(true)
      
      const file = e.target.files?.[0]
      if (!file) return

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size should be less than 5MB')
        return
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session found')

      const fileExt = file.name.split('.').pop()
      const fileName = `${session.user.id}-${Math.random()}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('profiles')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('profiles')
        .getPublicUrl(filePath)

      setAvatarUrl(publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error uploading image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleSubmit = async () => {
    try {
      setError(null)
      setIsLoading(true)
      
      if (!fullName || !email || !relation) {
        setError('Please fill in all required fields')
        return
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session found')

      const { error: updateError } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          full_name: fullName,
          email: email,
          relation: relation,
          bio: bio,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .throwOnError()

      if (updateError) throw updateError

      router.push('/profile')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error saving profile')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f5]">
      <MainNav />
      <main className="pt-16">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
          <div className="bg-white rounded-lg shadow-md p-6 sm:p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-[#171415] mb-2 fraunces-500">
                Complete Your Profile
              </h1>
              <p className="text-[#171415]/60 newsreader-400">
                Tell us a bit about yourself to get started
              </p>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium text-[#171415] mb-1 newsreader-400">
                  Full Name
                </label>
                <input
                  type="text"
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full px-3 py-2 border border-[#e4d9cb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#d97756] focus:border-transparent newsreader-400 placeholder:text-[#171415]/60"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#171415] mb-1 newsreader-400">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-3 py-2 border border-[#e4d9cb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#d97756] focus:border-transparent newsreader-400 placeholder:text-[#171415]/60"
                />
              </div>

              <div>
                <label htmlFor="relation" className="block text-sm font-medium text-[#171415] mb-1 newsreader-400">
                  Relation to Robin
                </label>
                <select
                  id="relation"
                  value={relation}
                  onChange={(e) => setRelation(e.target.value)}
                  className="w-full px-3 py-2 border border-[#e4d9cb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#d97756] focus:border-transparent newsreader-400"
                >
                  <option value="">Select a relation</option>
                  <option value="spouse_or_child">Spouse or child</option>
                  <option value="parent_or_sibling">Parent or sibling</option>
                  <option value="relative">Relative</option>
                  <option value="friend">Friend</option>
                </select>
              </div>

              <div>
                <label htmlFor="bio" className="block text-sm font-medium text-[#171415] mb-1 newsreader-400">
                  Bio <span className="text-[#d97756] newsreader-400">(Optional)</span>
                </label>
                <textarea
                  id="bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 70))}
                  placeholder="Tell us more about how you know Robin..."
                  className="w-full px-3 py-2 border border-[#e4d9cb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#d97756] focus:border-transparent min-h-[100px] resize-none newsreader-400 placeholder:text-[#171415]/60"
                />
                <p className="text-sm text-[#171415]/60 mt-1 newsreader-400">
                  {70 - bio.length} characters remaining
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#171415] mb-1 newsreader-400">
                  Profile Picture <span className="text-[#d97756] newsreader-400">(Optional)</span>
                </label>
                <div className="mt-1 flex items-center space-x-4">
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-[#faf9f5]">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt="Profile"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[#d97756]">
                        <User className="h-12 w-12" />
                      </div>
                    )}
                  </div>
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center px-4 py-2 border border-[#e4d9cb] rounded-md text-sm font-medium text-[#171415] hover:bg-[#faf9f5] transition-colors newsreader-400">
                      <Upload className="h-4 w-4 mr-2" />
                      {isUploading ? 'Uploading...' : 'Upload Image'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {error && (
                <p className="text-red-500 text-sm newsreader-400">{error}</p>
              )}

              <Button
                onClick={handleSubmit}
                variant="default"
                size="lg"
                isLoading={isLoading}
              >
                {isLoading ? 'Creating profile...' : 'Create profile'}
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
} 