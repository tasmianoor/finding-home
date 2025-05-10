"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import Image from 'next/image'
import { Upload, BookOpen } from 'lucide-react'
import MainNav from '../components/MainNav'
import Footer from '../components/Footer'
import Link from 'next/link'

interface Profile {
  id: string
  full_name: string
  email: string
  relationship_to_author: string
  bio: string | null
  avatar_url: string | null
  updated_at: string
  is_family_verified: boolean
}

interface Story {
  id: string
  title: string
  description: string
  content: string
  status: string
  created_at: string
  updated_at: string
  thumbnail_url: string | null
  user_id: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedProfile, setEditedProfile] = useState<Partial<Profile>>({})
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()

  const refreshProfile = async () => {
    try {
      setIsLoading(true)
      console.log('Starting profile refresh...')
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('Session check:', { session: !!session, error: sessionError })
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        throw new Error('Failed to get session')
      }

      if (!session) {
        console.log('No session found, redirecting to signin')
        router.push('/signin')
        return
      }

      console.log('Fetching profile for user:', session.user.id)
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.error('Profile fetch error:', profileError)
        throw new Error(`Failed to fetch profile: ${profileError.message}`)
      }

      if (!profileData) {
        console.log('No profile found, redirecting to setup')
        router.push('/profile/setup')
        return
      }

      console.log('Profile fetched successfully:', profileData)
      setProfile(profileData as Profile)
      setEditedProfile(profileData as Profile)

      // Fetch user's stories
      console.log('Fetching stories for user:', session.user.id)
      const { data: storiesData, error: storiesError } = await supabase
        .from('stories')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (storiesError) {
        console.error('Stories fetch error details:', {
          message: storiesError.message,
          details: storiesError.details,
          hint: storiesError.hint,
          code: storiesError.code
        })
        throw new Error(`Failed to fetch stories: ${storiesError.message}`)
      }

      console.log('Stories fetched successfully:', storiesData)
      setStories(storiesData as Story[])
    } catch (err) {
      console.error('Error refreshing profile:', err)
      if (err instanceof Error) {
        console.error('Error details:', {
          message: err.message,
          name: err.name,
          stack: err.stack
        })
      }
      setError(err instanceof Error ? err.message : 'Failed to load profile. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    refreshProfile()
  }, [supabase, router])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setError(null)
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
      if (!session) {
        router.push('/signin')
        return
      }

      const fileExt = file.name.split('.').pop()
      const fileName = `${session.user.id}-${Math.random()}.${fileExt}`
      const filePath = fileName

      // Delete old avatar if it exists
      if (editedProfile.avatar_url) {
        const oldPath = editedProfile.avatar_url.split('/').pop()
        if (oldPath) {
          await supabase.storage
            .from('avatars')
            .remove([oldPath])
        }
      }

      // Upload new avatar with proper metadata
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type
        })

      if (uploadError) {
        console.error('Upload error details:', {
          message: uploadError.message,
          name: uploadError.name
        })
        throw new Error(`Failed to upload image: ${uploadError.message || 'Unknown error'}`)
      }

      if (!uploadData) {
        throw new Error('No data returned from upload')
      }

      console.log('Upload successful:', uploadData)

      // Get the public URL with a signed URL that expires
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('avatars')
        .createSignedUrl(filePath, 31536000) // URL valid for 1 year

      if (signedUrlError) {
        console.error('Signed URL error:', signedUrlError)
        throw new Error(`Failed to generate image URL: ${signedUrlError.message}`)
      }

      if (!signedUrlData?.signedUrl) {
        throw new Error('No signed URL generated')
      }

      console.log('Signed URL generated successfully')
      setEditedProfile({ ...editedProfile, avatar_url: signedUrlData.signedUrl })
    } catch (err) {
      console.error('Error uploading image:', err)
      setError(err instanceof Error ? err.message : 'Failed to upload image. Please try again.')
    }
  }

  const handleSave = async () => {
    try {
      setError(null)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/signin')
        return
      }

      console.log('Saving profile with relation:', editedProfile.relationship_to_author)

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update({
          full_name: editedProfile.full_name,
          relationship_to_author: editedProfile.relationship_to_author,
          bio: editedProfile.bio,
          avatar_url: editedProfile.avatar_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id)
        .select()

      if (updateError) {
        console.error('Error updating profile:', updateError)
        throw updateError
      }

      console.log('Profile updated successfully:', data)
      setProfile(editedProfile as Profile)
      setIsEditing(false)
    } catch (err) {
      console.error('Error updating profile:', err)
      setError('Failed to update profile. Please try again.')
    }
  }

  const handleCancel = () => {
    setEditedProfile(profile as Profile)
    setIsEditing(false)
  }

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
    <div className="min-h-screen bg-[#faf9f5] flex flex-col">
      <MainNav />
      <main className="flex-1 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          {!profile.is_family_verified && (
            <div className="mb-8 bg-[#fff3f0] border border-[#d97756] rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="text-[#d97756] flex-shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-medium text-[#171415] mb-2 newsreader-500">
                    Account Not Verified
                  </h2>
                  <p className="text-[#171415]/80 mb-4 newsreader-400">
                    To ensure the security of our family stories, please request verification from Tasmia. This helps us maintain the privacy and authenticity of our shared memories.
                  </p>
                  <div className="flex gap-4">
                    <button
                      onClick={async () => {
                        try {
                          const { data: { session } } = await supabase.auth.getSession()
                          if (!session) {
                            router.push('/signin')
                            return
                          }

                          // First check if there's already a pending request
                          const { data: existingRequests, error: checkError } = await supabase
                            .from('verification_requests')
                            .select('*')
                            .eq('user_id', session.user.id)
                            .eq('status', 'pending')

                          if (checkError) {
                            console.error('Error checking existing request:', checkError)
                            throw new Error(`Failed to check existing verification request: ${checkError.message}`)
                          }

                          if (existingRequests && existingRequests.length > 0) {
                            alert('You already have a pending verification request. Please wait for Tasmia to review it.')
                            return
                          }

                          // Create new verification request
                          const { data: newRequest, error: insertError } = await supabase
                            .from('verification_requests')
                            .insert({
                              user_id: session.user.id,
                              status: 'pending',
                              created_at: new Date().toISOString()
                            })
                            .select()

                          if (insertError) {
                            console.error('Error creating verification request:', insertError)
                            throw new Error(`Failed to create verification request: ${insertError.message}`)
                          }

                          if (!newRequest) {
                            throw new Error('No data returned from verification request creation')
                          }

                          alert('Verification request sent! Tasmia will review your request and get back to you soon.')
                        } catch (err) {
                          console.error('Error requesting verification:', err)
                          setError(err instanceof Error ? err.message : 'Failed to send verification request. Please try again.')
                        }
                      }}
                      className="bg-[#d97756] text-white px-4 py-2 rounded-md hover:bg-[#d97756]/90 transition-colors newsreader-400"
                    >
                      Request verification
                    </button>
                    <button
                      onClick={refreshProfile}
                      className="bg-[#e4d9cb] text-[#171415] px-4 py-2 rounded-md hover:bg-[#e4d9cb]/90 transition-colors newsreader-400"
                    >
                      Refresh status
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="relative w-32 h-32 rounded-full overflow-hidden bg-[#faf9f5]">
              {isEditing ? (
                <div className="relative w-full h-full group">
                  {editedProfile.avatar_url ? (
                    <Image
                      src={editedProfile.avatar_url}
                      alt={editedProfile.full_name || 'Profile'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#d97756]">
                      <span className="text-5xl font-medium">
                        {editedProfile.full_name && editedProfile.full_name.length > 0 ? editedProfile.full_name.charAt(0) : '?'}
                      </span>
                    </div>
                  )}
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <Upload className="h-8 w-8 text-white" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              ) : (
                <>
                  {profile.avatar_url ? (
                    <Image
                      src={profile.avatar_url}
                      alt={profile.full_name || 'Profile'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[#d97756]">
                      <span className="text-5xl font-medium">
                        {profile.full_name && profile.full_name.length > 0 ? profile.full_name.charAt(0) : '?'}
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="fullName" className="block text-sm font-medium text-[#171415] mb-1 newsreader-400">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      value={editedProfile.full_name}
                      onChange={(e) => setEditedProfile({ ...editedProfile, full_name: e.target.value })}
                      className="w-full px-3 py-2 border border-[#e4d9cb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#d97756] focus:border-transparent newsreader-400"
                    />
                  </div>
                  <div>
                    <label htmlFor="relation" className="block text-sm font-medium text-[#171415] mb-1 newsreader-400">
                      Relation to Robin
                    </label>
                    <select
                      id="relation"
                      value={editedProfile.relationship_to_author}
                      onChange={(e) => setEditedProfile({ ...editedProfile, relationship_to_author: e.target.value })}
                      className="w-full px-3 py-2 border border-[#e4d9cb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#d97756] focus:border-transparent newsreader-400"
                    >
                      <option value="spouse_or_child">Spouse or child</option>
                      <option value="parent_or_sibling">Parent or sibling</option>
                      <option value="relative">Relative</option>
                      <option value="friend">Friend</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="bio" className="block text-sm font-medium text-[#171415] mb-1 newsreader-400">
                      Bio <span className="text-[#d97756]">(Optional)</span>
                    </label>
                    <textarea
                      id="bio"
                      value={editedProfile.bio || ''}
                      onChange={(e) => setEditedProfile({ ...editedProfile, bio: e.target.value.slice(0, 70) })}
                      className="w-full px-3 py-2 border border-[#e4d9cb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#d97756] focus:border-transparent min-h-[100px] resize-none newsreader-400"
                    />
                    <p className="text-sm text-[#171415]/60 mt-1 newsreader-400">
                      {70 - (editedProfile.bio?.length || 0)} characters remaining
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={handleSave}
                      className="bg-[#171415] text-[#faf9f5] px-4 py-2 rounded-md hover:bg-[#171415]/90 transition-colors newsreader-400"
                    >
                      Save changes
                    </button>
                    <button
                      onClick={handleCancel}
                      className="bg-[#e4d9cb] text-[#171415] px-4 py-2 rounded-md hover:bg-[#e4d9cb]/90 transition-colors newsreader-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-[#171415] mb-2 newsreader-500">
                        {profile.full_name}
                      </h1>
                      <p className="text-[#171415] mb-2 newsreader-400">
                        {profile.email}
                      </p>
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#faf9f5] border border-[#e4d9cb] mb-4">
                        <span className="text-[#171415] newsreader-400">
                          {profile.relationship_to_author === 'spouse_or_child' ? 'Spouse or Child' :
                           profile.relationship_to_author === 'parent_or_sibling' ? 'Parent or Sibling' :
                           profile.relationship_to_author === 'relative' ? 'Relative' :
                           profile.relationship_to_author === 'friend' ? 'Friend' :
                           'Relation to Robin'}
                        </span>
                      </div>
                      {profile.bio && (
                        <div className="mt-4">
                          <h2 className="text-lg font-medium text-[#171415] mb-2 newsreader-500">
                            About
                          </h2>
                          <p className="text-[#171415]/80 newsreader-400">
                            {profile.bio}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <button
                        onClick={handleEdit}
                        className="bg-[#e4d9cb] text-[#171415] px-4 py-2 rounded-md hover:bg-[#e4d9cb]/90 transition-colors newsreader-400"
                      >
                        Edit profile
                      </button>
                      <p className="text-sm text-[#171415]/40 newsreader-400">
                        Last updated: {new Date(profile.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {error && (
            <div className="mt-4 text-[#d97756] text-sm newsreader-400">
              {error}
            </div>
          )}

          <div className="mt-12 pt-12 border-t border-[#e4d9cb]">
            {stories.length > 0 && (
              <div>
                <h2 className="text-2xl font-medium text-[#171415] mb-6 newsreader-500 flex items-center gap-2">
                  <BookOpen className="h-6 w-6 text-[#d97756]" />
                  My Shared Memories
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stories.map((story) => (
                    <Link 
                      key={story.id} 
                      href={`/stories/${story.id}`} 
                      className="group cursor-pointer relative"
                    >
                      <div className="relative h-64 overflow-hidden rounded-lg">
                        <img
                          src={story.thumbnail_url || "/placeholder.svg"}
                          alt={story.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 flex flex-col justify-end">
                          <h3 className="text-white text-xl font-bold mb-2 newsreader-500">
                            {story.title}
                          </h3>
                          <p className="text-white/80 text-sm newsreader-400">
                            {story.description}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {stories.length === 0 && (
              <div className="mt-12 text-center">
                <h2 className="text-2xl font-medium text-[#171415] mb-4 newsreader-500 flex items-center justify-center gap-2">
                  <BookOpen className="h-6 w-6 text-[#d97756]" />
                  My Shared Memories
                </h2>
                <p className="text-[#171415]/60 mb-6 newsreader-400 max-w-md mx-auto">
                  Your memories with Robin are waiting to be shared!
                </p>
                <button
                  onClick={() => router.push('/add-memories')}
                  className="bg-[#171415] text-[#faf9f5] px-6 py-3 rounded-md hover:bg-[#171415]/90 transition-colors newsreader-400"
                >
                  Share your first memory
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
