"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import Image from 'next/image'
import { Upload, BookOpen, User, Trash2 } from 'lucide-react'
import MainNav from '../components/MainNav'
import Footer from '../components/Footer'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Profile {
  id: string
  full_name: string
  email: string
  relation: string
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
  const [storyToDelete, setStoryToDelete] = useState<Story | null>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()

  const refreshProfile = async () => {
    try {
      setIsLoading(true)
      console.log('Starting profile refresh...')
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      console.log('Session check:', { 
        hasSession: !!session, 
        error: sessionError,
        userId: session?.user?.id 
      })
      
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
        .maybeSingle()

      if (profileError) {
        console.error('Profile fetch error:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        })
        throw new Error(`Failed to fetch profile: ${profileError.message}`)
      }

      if (!profileData) {
        console.log('No profile found, redirecting to setup')
        router.push('/profile/setup')
        return
      }

      console.log('Profile fetched successfully:', {
        id: profileData.id,
        full_name: profileData.full_name,
        email: profileData.email,
        has_avatar: !!profileData.avatar_url
      })
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

      console.log('Stories fetched successfully:', {
        count: storiesData?.length,
        first_story: storiesData?.[0]?.title
      })
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
      if (!file) {
        console.log('No file selected')
        return
      }

      console.log('Starting upload process...', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      })

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

      // Get session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      if (sessionError) {
        console.error('Session error:', sessionError)
        throw new Error('Failed to get session')
      }

      if (!session) {
        console.log('No session found')
        router.push('/signin')
        return
      }

      console.log('Session found, user ID:', session.user.id)

      // Create a unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${session.user.id}/${Date.now()}.${fileExt}`
      console.log('Generated filename:', fileName)

      // Upload the file with proper content type
      console.log('Attempting to upload file...')
      const { data, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) {
        console.error('Upload error:', {
          message: uploadError.message,
          name: uploadError.name,
          statusCode: (uploadError as any).statusCode
        })
        if (uploadError.message.includes('400')) {
          throw new Error('Invalid file format or size. Please try a different image.')
        }
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      if (!data) {
        throw new Error('No data returned from upload')
      }

      console.log('File uploaded successfully:', {
        path: data.path,
        id: data.id
      })

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      console.log('Generated public URL:', publicUrl)
      console.log('URL components:', {
        fileName,
        bucket: 'avatars',
        fullUrl: publicUrl
      })

      // Update the profile
      console.log('Updating profile with new avatar URL...')
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id)

      if (updateError) {
        console.error('Profile update error:', {
          message: updateError.message,
          details: updateError.details,
          hint: updateError.hint,
          code: updateError.code
        })
        throw new Error(`Profile update failed: ${updateError.message}`)
      }

      console.log('Profile updated successfully')

      // Update the local state
      setEditedProfile(prev => ({
        ...prev,
        avatar_url: publicUrl
      }))

      console.log('Local state updated')

    } catch (err) {
      console.error('Error in handleImageUpload:', err)
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Failed to upload image. Please try again.')
      }
    }
  }

  const handleSave = async () => {
    try {
      setError(null)
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        throw new Error('Failed to get session')
      }

      if (!session) {
        console.log('No session found')
        router.push('/signin')
        return
      }

      // Validate required fields
      if (!editedProfile.full_name?.trim()) {
        throw new Error('Full name is required')
      }

      if (!editedProfile.relation) {
        throw new Error('Relationship to Robin is required')
      }

      // Validate field lengths
      if (editedProfile.full_name.trim().length > 100) {
        throw new Error('Full name must be less than 100 characters')
      }

      if (editedProfile.bio && editedProfile.bio.trim().length > 70) {
        throw new Error('Bio must be less than 70 characters')
      }

      // Prepare the profile data
      const profileData = {
        id: session.user.id,
        full_name: editedProfile.full_name.trim(),
        relation: editedProfile.relation,
        bio: editedProfile.bio?.trim() || null,
        avatar_url: editedProfile.avatar_url,
        updated_at: new Date().toISOString()
      }

      console.log('Saving profile with data:', profileData)

      // First check if profile exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .single()

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error checking profile:', checkError)
        throw new Error(`Failed to check profile: ${checkError.message}`)
      }

      let result;
      if (!existingProfile) {
        // Create new profile
        result = await supabase
          .from('profiles')
          .insert({
            ...profileData,
            created_at: new Date().toISOString()
          })
          .select()
          .throwOnError()
      } else {
        // Update existing profile
        result = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', session.user.id)
          .select()
          .throwOnError()
      }

      if (!result.data || result.data.length === 0) {
        throw new Error('No profile was saved')
      }

      console.log('Profile saved successfully:', {
        id: result.data[0].id,
        full_name: result.data[0].full_name,
        updated_at: result.data[0].updated_at
      })

      setProfile(result.data[0] as Profile)
      setIsEditing(false)
    } catch (err) {
      console.error('Error saving profile:', err)
      if (err instanceof Error) {
        console.error('Error details:', {
          message: err.message,
          name: err.name,
          stack: err.stack
        })
      }
      setError(err instanceof Error ? err.message : 'Failed to save profile. Please try again.')
    }
  }

  const handleCancel = () => {
    setEditedProfile(profile as Profile)
    setIsEditing(false)
  }

  const handleDeleteStory = async () => {
    if (!storyToDelete) return

    try {
      const { error: deleteError } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyToDelete.id)

      if (deleteError) {
        throw new Error(`Failed to delete story: ${deleteError.message}`)
      }

      // Update local state
      setStories(prev => prev.filter(story => story.id !== storyToDelete.id))
      setStoryToDelete(null)
    } catch (err) {
      console.error('Error deleting story:', err)
      setError(err instanceof Error ? err.message : 'Failed to delete story. Please try again.')
    }
  }

  const handleRemoveProfileImage = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        console.error('Session error:', sessionError)
        throw new Error('Failed to get session')
      }

      if (!session) {
        console.log('No session found')
        router.push('/signin')
        return
      }

      // Delete the image from storage if it exists
      if (profile?.avatar_url) {
        const { error: deleteError } = await supabase.storage
          .from('avatars')
          .remove([`${session.user.id}/${profile.avatar_url.split('/').pop()}`])

        if (deleteError) {
          console.error('Error deleting avatar:', deleteError)
          throw new Error('Failed to delete profile image from storage')
        }
      }

      // Update profile to remove avatar_url
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', session.user.id)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        throw new Error('Failed to update profile')
      }

      // Update local state
      setProfile(prev => prev ? { ...prev, avatar_url: null } : null)
      setEditedProfile(prev => ({ ...prev, avatar_url: null }))
      setError(null)
    } catch (err) {
      console.error('Error removing profile image:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove profile image')
    }
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
                  <h2 className="text-lg font-medium text-[#171415] mb-2 fraunces-500">
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
                    <Button
                      onClick={refreshProfile}
                      variant="secondary"
                    >
                      Refresh status
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 rounded-full overflow-hidden bg-[#faf9f5]">
                {isEditing ? (
                  <div className="relative w-full h-full group">
                    {editedProfile.avatar_url ? (
                      <img
                        src={editedProfile.avatar_url}
                        alt={editedProfile.full_name || 'Profile'}
                        className="w-[calc(100%+8px)] h-[calc(100%+8px)] object-cover -m-1"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#ffcfad]">
                        <User className="h-12 w-12 text-[#d97756]" />
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
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name || 'Profile'}
                        className="w-[calc(100%+8px)] h-[calc(100%+8px)] object-cover -m-1"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#ffcfad]">
                        <User className="h-12 w-12 text-[#d97756]" />
                      </div>
                    )}
                  </>
                )}
              </div>
              {isEditing && profile.avatar_url && (
                <button
                  onClick={handleRemoveProfileImage}
                  className="text-[#d97756] hover:text-[#d97756]/80 text-sm font-medium transition-colors mt-2"
                >
                  Remove Profile Image
                </button>
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
                      value={editedProfile.relation}
                      onChange={(e) => setEditedProfile({ ...editedProfile, relation: e.target.value })}
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
                    <Button
                      onClick={handleSave}
                      variant="default"
                    >
                      Save changes
                    </Button>
                    <Button
                      onClick={handleCancel}
                      variant="secondary"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex justify-between items-start">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-bold text-[#171415] mb-2 fraunces-500">
                        {profile.full_name}
                      </h1>
                      <p className="text-[#171415] mb-2 newsreader-400">
                        {profile.email}
                      </p>
                      <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#faf9f5] border border-[#e4d9cb] mb-4">
                        <span className="text-[#171415] newsreader-400">
                          {profile.relation === 'spouse_or_child' ? 'Spouse or Child' :
                           profile.relation === 'parent_or_sibling' ? 'Parent or Sibling' :
                           profile.relation === 'relative' ? 'Relative' :
                           profile.relation === 'friend' ? 'Friend' :
                           'Relation to Robin'}
                        </span>
                      </div>
                      {profile.bio && (
                        <div className="mt-4">
                          <h2 className="text-lg font-medium text-[#171415] mb-2 fraunces-500">
                            About
                          </h2>
                          <p className="text-[#171415]/80 newsreader-400">
                            {profile.bio}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Button
                        onClick={() => setIsEditing(true)}
                        variant="outline"
                        size="lg"
                        className="border-[#171415] text-[#171415] hover:bg-[#171415] hover:text-[#faf9f5]"
                      >
                        Edit Profile
                      </Button>
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

          <AlertDialog open={!!storyToDelete} onOpenChange={() => setStoryToDelete(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-[#171415] fraunces-500">Delete Memory</AlertDialogTitle>
                <AlertDialogDescription className="text-[#171415]/80 newsreader-400">
                  Are you sure you want to delete this memory? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel asChild>
                  <Button variant="default" className="instrument-400 text-[#171415] hover:text-[#171415]">
                    No, keep my memories
                  </Button>
                </AlertDialogCancel>
                <AlertDialogAction asChild>
                  <Button 
                    variant="secondary" 
                    className="instrument-400 text-white hover:text-white"
                    onClick={handleDeleteStory}
                  >
                    Continue to delete
                  </Button>
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <div className="mt-12 pt-12 border-t border-[#e4d9cb]">
            {stories.length > 0 && (
              <div>
                <h2 className="text-2xl font-medium text-[#171415] mb-6 fraunces-500 flex items-center gap-2" style={{ fontWeight: 500 }}>
                  <BookOpen className="h-6 w-6 text-[#d97756]" />
                  My shared memories
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stories.map((story) => (
                    <Link 
                      key={story.id} 
                      href={`/stories/${story.id}`} 
                      className="relative group cursor-pointer rounded-md overflow-hidden transition-all duration-200"
                    >
                      <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Trash2 
                          className="h-5 w-5 text-white cursor-pointer hover:text-[#d97756]" 
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setStoryToDelete(story);
                          }}
                        />
                      </div>
                      <div className="relative">
                        <img
                          src={story.thumbnail_url || "/placeholder.svg"}
                          alt={story.title}
                          className="w-full h-[360px] object-cover transition-all duration-300 group-hover:brightness-[0.85]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent group-hover:bg-[#b15e4e]/90 p-6 group-hover:pl-10 flex flex-col justify-end transition-all duration-300">
                          <h3 className="text-white text-[28px] font-bold mb-2 sm:mb-3 fraunces-400 transition-all duration-300">
                            {story.title}
                          </h3>
                          <p className="text-white text-base sm:text-lg mb-3 sm:mb-4 newsreader-400 line-clamp-2 group-hover:line-clamp-4 transition-all duration-300">
                            {story.description}
                          </p>
                          <p className="text-white/80 text-xs sm:text-sm mb-2 sm:mb-3 newsreader-400">
                            {new Date(story.created_at).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
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
                <h2 className="text-2xl font-medium text-[#171415] mb-4 fraunces-500 flex items-center justify-center gap-2">
                  <BookOpen className="h-6 w-6 text-[#d97756]" />
                  My Shared Memories
                </h2>
                <p className="text-[#171415]/60 mb-6 newsreader-400 max-w-md mx-auto">
                  Your memories with Robin are waiting to be shared!
                </p>
                <Button
                  onClick={() => router.push('/add-memories')}
                  variant="default"
                  size="lg"
                >
                  Share your first memory
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
