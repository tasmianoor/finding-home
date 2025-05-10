"use client"

import type React from "react"
import Link from "next/link"
import { HomeIcon, PlusCircle, Upload, Loader2, X } from "lucide-react"
import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Spinner } from "@/components/ui/spinner"
import MainNav from "../components/MainNav"
import Footer from "../components/Footer"

interface Story {
  title: string
  description: string
  thumbnail_url?: string
  audio_url?: string
  transcript_question?: string
  transcript_answer?: string
  duration?: string
  is_published: boolean
  view_count: number
  episode_number: number
}

interface MediaPreview {
  url: string
  type: string
  file: File
}

export default function AddMemoriesPage() {
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [selectedVisibility, setSelectedVisibility] = useState<string[]>([])
  const [files, setFiles] = useState<File[]>([])
  const [mediaPreviews, setMediaPreviews] = useState<MediaPreview[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError) {
      console.error('Auth check error:', authError)
      router.push('/signin')
      return
    }
    if (!session) {
      console.log('No session found')
      router.push('/signin')
      return
    }
    console.log('Auth check successful:', session.user.id)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      
      // Get existing file types
      const existingImages = files.filter(file => file.type.startsWith('image/'))
      const existingAudios = files.filter(file => file.type.startsWith('audio/'))
      const existingVideos = files.filter(file => file.type.startsWith('video/'))
      
      // Get new file types
      const newImages = newFiles.filter(file => file.type.startsWith('image/'))
      const newAudios = newFiles.filter(file => file.type.startsWith('audio/'))
      const newVideos = newFiles.filter(file => file.type.startsWith('video/'))

      // Validate total counts
      if (existingImages.length + newImages.length > 3) {
        setError('Maximum three images allowed')
        return
      }

      if (existingVideos.length + newVideos.length > 1) {
        setError('Only a single video file allowed')
        return
      }

      if (existingAudios.length + newAudios.length > 3) {
        setError('Maximum three audio files allowed')
        return
      }

      // Check for video and audio combination
      if ((existingVideos.length > 0 || newVideos.length > 0) && 
          (existingAudios.length > 0 || newAudios.length > 0)) {
        setError('Cannot upload both video and audio files')
        return
      }

      setFiles([...files, ...newFiles])

      // Create preview URLs for all media types
      const newPreviews = newFiles.map((file) => ({
        url: URL.createObjectURL(file),
        type: file.type,
        file: file
      }))

      setMediaPreviews([...mediaPreviews, ...newPreviews])
      setError(null)
    }
  }

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag))
    } else {
      if (selectedTags.length < 3) {
        setSelectedTags([...selectedTags, tag])
      }
    }
  }

  const removeFile = (indexToRemove: number) => {
    const previewToRemove = mediaPreviews[indexToRemove]
    
    // Remove the file from files array
    setFiles(files.filter(file => file !== previewToRemove.file))
    
    // Revoke the object URL and remove from previews
    URL.revokeObjectURL(previewToRemove.url)
    setMediaPreviews(mediaPreviews.filter((_, index) => index !== indexToRemove))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (selectedVisibility.length === 0) {
      setError('Please select who can see this post')
      setIsLoading(false)
      return
    }

    try {
      // Check authentication
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError) {
        console.error('Authentication error:', authError)
        setError('Authentication error. Please try signing in again.')
        router.push('/signin')
        return
      }
      if (!session) {
        console.error('No session found')
        setError('Please sign in to create a story')
        router.push('/signin')
        return
      }

      console.log('User authenticated:', session.user.id)

      // First check if user has a profile and is verified
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, is_family_verified, username, full_name')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.error('Profile check error details:', {
          message: profileError.message,
          details: profileError.details,
          hint: profileError.hint,
          code: profileError.code
        })

        // If profile doesn't exist, create one
        if (profileError.code === 'PGRST116') {
          console.log('Profile not found, creating new profile...')
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              username: session.user.email?.split('@')[0] || 'user',
              full_name: session.user.user_metadata?.full_name || 'New User',
              is_family_verified: false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single()

          if (createError) {
            console.error('Error creating profile:', createError)
            setError('Failed to create profile. Please try again.')
            return
          }

          console.log('New profile created:', newProfile)
          setError('Your profile has been created, but needs to be verified before you can create stories.')
          return
        }

        setError('Error checking profile. Please try again.')
        return
      }

      if (!profile) {
        console.error('No profile found')
        setError('Please complete your profile setup first')
        return
      }

      if (!profile.is_family_verified) {
        console.error('User not verified')
        setError('Your account needs to be verified before you can create stories')
        return
      }

      console.log('Profile verified:', profile)

      // Verify Supabase connection and schema
      const { data: testData, error: testError } = await supabase
        .from('stories')
        .select('id, user_id')
        .limit(1)

      if (testError) {
        console.error('Supabase connection test failed:', testError)
        setError('Database connection error. Please try again.')
        return
      }
      console.log('Supabase connection test successful')

      // Log the data we're trying to insert
      const storyData = {
        user_id: profile.id,
        title,
        description,
        episode_number: 1,
        audio_url: '',
        thumbnail_url: '',
        transcript_question: '',
        transcript_answer: '',
        duration: 'PT0S',
        is_published: false,
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      console.log('Attempting to insert story with data:', storyData)

      // First create the story to get the ID
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert([storyData])  // Wrap in array to ensure proper format
        .select()

      if (storyError) {
        console.error('Raw story error:', storyError)
        console.error('Story creation error details:', {
          message: storyError.message,
          details: storyError.details,
          hint: storyError.hint,
          code: storyError.code,
          error: storyError
        })
        setError(`Failed to create story: ${storyError.message || 'Unknown error'}`)
        return
      }

      if (!story || story.length === 0) {
        console.error('No story data returned after insert')
        setError('Failed to create story: No data returned')
        return
      }

      console.log('Story created successfully:', story)
      const createdStory = story[0]

      // Add visibility options
      const visibilityPromises = selectedVisibility.map(async (visibility) => {
        const { error: visibilityError } = await supabase
          .from('story_visibility')
          .insert({
            story_id: createdStory.id,
            visibility_type: visibility.toLowerCase().replace(/\s+/g, '_')
          })

        if (visibilityError) {
          console.error('Error adding visibility:', visibilityError)
          throw visibilityError
        }
      })

      await Promise.all(visibilityPromises)
      console.log('Visibility options added:', selectedVisibility)

      // Upload files
      const uploadPromises = files.map(async (file) => {
        const fileExt = file.name.split('.').pop()?.toLowerCase() || ''
        const fileName = `${createdStory.id}-${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`
        const filePath = `${file.type.startsWith('image/') ? 'images' : 'audio'}/${fileName}`

        const { error: uploadError } = await supabase.storage
          .from('stories')
          .upload(filePath, file)

        if (uploadError) {
          console.error('Upload error:', uploadError)
          throw uploadError
        }

        const { data: { publicUrl } } = supabase.storage
          .from('stories')
          .getPublicUrl(filePath)

        return {
          type: file.type,
          url: publicUrl
        }
      })

      const uploadedFiles = await Promise.all(uploadPromises)
      console.log('Files uploaded:', uploadedFiles)
      
      // Update story with media URLs
      const thumbnailUrl = uploadedFiles.find(f => f.type.startsWith('image/'))?.url || 
        'https://gfnfawmtebnndhundozy.supabase.co/storage/v1/object/sign/stories/Audio-story.png?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InN0b3JhZ2UtdXJsLXNpZ25pbmcta2V5XzY5ZWUzYjBjLTVmNDAtNGFlYy05MWRkLTg4ODgyMTQxOWU4YSJ9.eyJ1cmwiOiJzdG9yaWVzL0F1ZGlvLXN0b3J5LnBuZyIsImlhdCI6MTc0Njg4NzkyNiwiZXhwIjoxNzQ5NDc5OTI2fQ.lfpVpbe1ygfFeT2_d7ydkP6aiGd6oBiN3Q9JpHOVqBM'
      const audioUrl = uploadedFiles.find(f => f.type.startsWith('audio/'))?.url || ''

      // Calculate duration for audio files if present
      let duration = '0 seconds'
      if (files.some(f => f.type.startsWith('audio/'))) {
        // For now, set a default duration. In a real app, you'd want to calculate this
        duration = '0 seconds'
      }

      const { error: updateError } = await supabase
        .from('stories')
        .update({
          thumbnail_url: thumbnailUrl,
          audio_url: audioUrl,
          duration: duration,
          updated_at: new Date().toISOString()
        })
        .eq('id', createdStory.id)

      if (updateError) {
        console.error('Story update error:', updateError)
        throw updateError
      }

      console.log('Story updated with media URLs:', {
        thumbnailUrl,
        audioUrl,
        duration
      })

      // Add tags
      if (selectedTags.length > 0) {
        const { data: tagData, error: tagQueryError } = await supabase
          .from('tags')
          .select('id, name')
          .in('name', selectedTags)

        if (tagQueryError) {
          console.error('Tag query error:', tagQueryError)
          throw tagQueryError
        }

        if (tagData && tagData.length > 0) {
          const tagIds = tagData.map(tag => tag.id)
          
          // Insert into story_tags junction table
          const { error: tagError } = await supabase
            .from('story_tags')
            .insert(
              tagIds.map(tagId => ({
                story_id: createdStory.id,
                tag_id: tagId,
                created_at: new Date().toISOString()
              }))
            )
            
          if (tagError) {
            console.error('Error adding tags:', tagError)
          } else {
            console.log('Tags added successfully:', selectedTags)
          }
        }
      }

      router.push('/dashboard')
    } catch (error) {
      console.error('Error:', error)
      setError('Failed to create story. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#faf9f5]">
      <MainNav />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#171415] mb-4 newsreader-500">
              Add Your Memory
            </h1>
            <p className="text-[#171415]/80 text-lg newsreader-400">
              Share a special moment or story that you'd like to preserve
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-[#171415] mb-2 newsreader-400">
                    Title
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-[#e4d9cb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#d97756] focus:border-transparent newsreader-400"
                    placeholder="Give your memory a title"
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-[#171415] mb-2 newsreader-400">
                    Your Story
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                    rows={10}
                    className="w-full px-4 py-2 border border-[#e4d9cb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#d97756] focus:border-transparent newsreader-400"
                    placeholder="Write your story here..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#171415] mb-2 newsreader-400">
                    Upload Media
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-[#e4d9cb] border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-[#171415]/40" />
                      <div className="flex text-sm text-[#171415]/60 newsreader-400">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer bg-white rounded-md font-medium text-[#d97756] hover:text-[#d97756]/90 focus-within:outline-none"
                        >
                          <span>Upload files</span>
                          <input
                            id="file-upload"
                            name="file-upload"
                            type="file"
                            multiple
                            accept="image/*,audio/*,video/*"
                            onChange={handleFileChange}
                            className="sr-only"
                          />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-[#171415]/40 newsreader-400">
                        Images (up to 3), Audio (up to 3), or Video (1)
                      </p>
                    </div>
                  </div>
                  
                  {/* Media Previews */}
                  {mediaPreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {mediaPreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          {preview.type.startsWith('image/') ? (
                            <img
                              src={preview.url}
                              alt="Preview"
                              className="w-full h-32 object-cover rounded-md"
                            />
                          ) : preview.type.startsWith('audio/') ? (
                            <div className="w-full h-32 bg-[#faf9f5] rounded-md flex items-center justify-center">
                              <span className="text-[#171415]/60">Audio File</span>
                            </div>
                          ) : (
                            <div className="w-full h-32 bg-[#faf9f5] rounded-md flex items-center justify-center">
                              <span className="text-[#171415]/60">Video File</span>
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            className="absolute top-2 right-2 p-1 bg-[#d97756] rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="h-4 w-4 text-white" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <p className="block text-xs sm:text-sm md:text-base font-medium mb-2 sm:mb-3 md:mb-4">
                    Who can see this post? (Select all that apply)
                  </p>
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 sm:gap-3">
                    {["Spouse or child", "Parent or sibling", "Relative", "Friend"].map((option) => (
                      <button
                        key={option}
                        type="button"
                        onClick={() => {
                          setSelectedVisibility(prev => {
                            if (prev.includes(option)) {
                              return prev.filter(v => v !== option)
                            }
                            return [...prev, option]
                          })
                        }}
                        disabled={isLoading}
                        className={`px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-md text-xs sm:text-sm md:text-base border ${
                          selectedVisibility.includes(option)
                            ? "bg-amber-100 border-amber-300 text-amber-800"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        } transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="block text-xs sm:text-sm md:text-base font-medium mb-2 sm:mb-3 md:mb-4">
                    Choose any 3 tags that best describe your post:
                  </p>
                  <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                    {[
                      "Childhood",
                      "Family",
                      "Grief",
                      "Health",
                      "Hobbies & Interests",
                      "Liberation war",
                      "Pride",
                      "Proud moments",
                      "Sports",
                      "Travel",
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        disabled={isLoading}
                        className={`px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-md text-xs sm:text-sm md:text-base border ${
                          selectedTags.includes(tag)
                            ? "bg-amber-100 border-amber-300 text-amber-800"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        } transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {error && (
                  <p className="text-[#d97756] text-sm newsreader-400">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#171415] text-[#faf9f5] py-3 px-4 rounded-md hover:bg-[#171415]/90 transition-colors newsreader-400"
                >
                  {isLoading ? 'Saving...' : 'Save Memory'}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-medium text-[#171415] mb-4 newsreader-500">
                Preview
              </h2>
              <div className="prose max-w-none">
                {title && (
                  <h3 className="text-2xl font-medium text-[#171415] mb-4 newsreader-500">
                    {title}
                  </h3>
                )}
                {description && (
                  <p className="text-[#171415]/80 whitespace-pre-wrap newsreader-400">
                    {description}
                  </p>
                )}
                {!title && !description && (
                  <p className="text-[#171415]/40 newsreader-400">
                    Your preview will appear here as you type
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
