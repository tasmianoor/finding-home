"use client"

import type React from "react"
import Link from "next/link"
import { HomeIcon, PlusCircle, Upload, Loader2, X, ChevronLeft, ChevronRight, Baby, Users, Heart, Stethoscope, Palette, Flag, Trophy, PartyPopper, Medal, Plane, GraduationCap, Award } from "lucide-react"
import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Spinner } from "@/components/ui/spinner"
import MainNav from "../components/MainNav"
import Footer from "../components/Footer"
import { Button } from '@/components/ui/button'

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
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transcriptQuestion, setTranscriptQuestion] = useState("")
  const [transcriptAnswer, setTranscriptAnswer] = useState("")
  const [success, setSuccess] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

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
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    if (selectedVisibility.length === 0) {
      setError('Please select who can see this post')
      setIsSubmitting(false)
      return
    }

    try {
      console.log('Starting story creation process...')
      
      // Check if user is authenticated
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError) {
        console.error('Authentication error:', authError)
        throw new Error(`Authentication error: ${authError.message}`)
      }
      if (!session) {
        console.error('No active session found')
        throw new Error('No active session found')
      }
      console.log('Authentication successful:', session.user.id)

      // Check if user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.error('Profile error:', profileError)
        throw new Error(`Profile error: ${profileError.message}`)
      }
      if (!profile) {
        console.error('No profile found for user')
        throw new Error('No profile found for user')
      }
      console.log('Profile check successful:', profile)

      // Check if database is connected
      const { error: dbError } = await supabase.from('stories').select('count').limit(1)
      if (dbError) {
        console.error('Database connection error:', dbError)
        throw new Error(`Database connection error: ${dbError.message}`)
      }
      console.log('Database connection successful')

      // Create the story first
      const storyData = {
        user_id: session.user.id,
        title,
        description,
        thumbnail_url: mediaPreviews.find(p => p.type.startsWith('image/'))?.url || '',
        audio_url: mediaPreviews.find(p => p.type.startsWith('audio/'))?.url || '',
        transcript_question: transcriptQuestion,
        transcript_answer: transcriptAnswer,
        duration: 'PT0S', // Default duration
        is_published: true, // Set to true by default
        view_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      console.log('Attempting to create story with data:', {
        ...storyData,
        user_id: storyData.user_id, // Log the user_id to verify it matches auth.uid()
        session_user_id: session.user.id // Log the session user_id for comparison
      })

      // Start a transaction
      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert([storyData])
        .select()
        .single()

      if (storyError) {
        console.error('Story creation error:', {
          error: storyError,
          code: storyError.code,
          details: storyError.details,
          hint: storyError.hint,
          message: storyError.message
        })
        throw new Error(`Failed to create story: ${storyError.message}`)
      }

      if (!story) {
        console.error('No story data returned after creation')
        throw new Error('No story data returned after creation')
      }

      console.log('Story created successfully:', story)

      // Add visibility options
      try {
        // Create visibility records for each selected visibility option
        const visibilityRecords = selectedVisibility.map(visibility => ({
          story_id: story.id,
          visibility_type: visibility.toLowerCase().replace(/\s+/g, '_'),
          created_at: new Date().toISOString()
        }))

        console.log('Adding visibility options:', visibilityRecords)

        const { error: visibilityError } = await supabase
          .from('story_visibility')
          .insert(visibilityRecords)

        if (visibilityError) {
          console.error('Visibility error:', visibilityError)
          throw new Error(`Failed to set visibility: ${visibilityError.message}`)
        }

        console.log('Successfully set visibility options')
      } catch (error) {
        console.error('Error adding visibility:', error)
        // If visibility creation fails, we should delete the story to maintain consistency
        try {
          const { error: deleteError } = await supabase
            .from('stories')
            .delete()
            .eq('id', story.id)
          
          if (deleteError) {
            console.error('Failed to clean up story after visibility error:', deleteError)
          }
        } catch (cleanupError) {
          console.error('Error during cleanup:', cleanupError)
        }
        throw new Error(`Failed to set visibility: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }

      // Process file uploads
      if (files.length > 0) {
        try {
          console.log('Starting file upload process...')
          console.log('Number of files to upload:', files.length)

          // Check if storage bucket exists
          const { data: buckets, error: bucketError } = await supabase
            .storage
            .listBuckets()

          if (bucketError) {
            console.error('Bucket check error:', bucketError)
            // Continue with story creation even if bucket check fails
            console.log('Continuing with story creation despite bucket check error')
          }

          console.log('Available buckets:', buckets)

          const memoriesBucket = buckets?.find(b => b.name === 'memories')
          if (!memoriesBucket) {
            console.log('Memories bucket not found, attempting to create it...')
            try {
              const { data: newBucket, error: createError } = await supabase
                .storage
                .createBucket('memories', {
                  public: true,
                  fileSizeLimit: 10 * 1024 * 1024, // 10MB
                  allowedMimeTypes: ['image/*', 'audio/*', 'video/*']
                })

              if (createError) {
                console.error('Failed to create memories bucket:', createError)
                // Continue with story creation even if bucket creation fails
                console.log('Continuing with story creation despite bucket creation error')
              }

              if (newBucket) {
                console.log('Memories bucket created successfully:', newBucket)
              }
            } catch (error) {
              console.error('Error during bucket creation:', error)
            }
          } else {
            console.log('Using existing memories bucket:', memoriesBucket)
            // Update bucket to ensure it's public
            const { error: updateError } = await supabase
              .storage
              .updateBucket('memories', {
                public: true
              })
            
            if (updateError) {
              console.error('Error updating bucket to public:', updateError)
            } else {
              console.log('Successfully updated bucket to public')
            }
          }

          // Verify authentication status
          const { data: { session }, error: authError } = await supabase.auth.getSession()
          if (authError) {
            console.error('Auth check error:', authError)
            throw new Error('Authentication error')
          }
          if (!session) {
            console.error('No active session')
            throw new Error('No active session')
          }
          console.log('User authenticated:', session.user.id)

          console.log('Using memories bucket for uploads')

          const uploadPromises = files.map(async (file) => {
            try {
              console.log('Processing file:', {
                name: file.name,
                type: file.type,
                size: file.size
              })

              // Validate file size (10MB limit)
              if (file.size > 10 * 1024 * 1024) {
                throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`)
              }

              const fileType = file.type.startsWith('image/') ? 'images' : 'audio'
              const filePath = `${session.user.id}/${fileType}/${Date.now()}_${file.name}`

              console.log('Attempting to upload file to path:', filePath)

              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('memories')
                .upload(filePath, file, {
                  cacheControl: '3600',
                  upsert: true
                })

              if (uploadError) {
                console.error('Upload error details:', {
                  error: uploadError,
                  file: file.name,
                  path: filePath,
                  user: session.user.id
                })
                throw new Error(`Upload failed: ${uploadError.message}`)
              }

              if (!uploadData) {
                throw new Error('No upload data returned')
              }

              console.log('File uploaded successfully:', uploadData)

              const { data: { publicUrl } } = supabase.storage
                .from('memories')
                .getPublicUrl(filePath)

              if (!publicUrl) {
                throw new Error('No public URL generated')
              }

              console.log('Public URL generated:', publicUrl)

              return {
                path: filePath,
                url: publicUrl,
                type: fileType
              }
            } catch (error) {
              console.error('File processing error:', {
                error,
                file: file.name,
                user: session.user.id
              })
              // Return null for failed uploads instead of throwing
              return null
            }
          })

          const uploadedFiles = (await Promise.all(uploadPromises)).filter((file): file is NonNullable<typeof file> => file !== null)
          console.log('Successfully uploaded files:', uploadedFiles)

          // Filter images and get the first one for thumbnail
          const images = uploadedFiles.filter(f => f.type === 'images')
          console.log('Uploaded images:', images)

          const thumbnailUrl = images.length > 0 ? images[0].url : null
          console.log('Selected thumbnail URL:', thumbnailUrl)

          // Update story with thumbnail if we have one
          if (thumbnailUrl) {
            const { error: updateError } = await supabase
              .from('stories')
              .update({ thumbnail_url: thumbnailUrl })
              .eq('id', story.id)

            if (updateError) {
              console.error('Thumbnail update error:', updateError)
              // Continue even if thumbnail update fails
              console.log('Continuing despite thumbnail update error')
            }
          }

          // Add files to story_files only if we have uploaded files
          if (uploadedFiles.length > 0) {
            const fileRecords = uploadedFiles.map(file => ({
              story_id: story.id,
              file_path: file.path,
              file_type: file.type,
              created_at: new Date().toISOString()
            }))

            console.log('Adding file records:', fileRecords)

            const { error: filesError } = await supabase
              .from('story_files')
              .insert(fileRecords)

            if (filesError) {
              console.error('File records error:', filesError)
              // Continue even if file records insertion fails
              console.log('Continuing despite file records error')
            } else {
              console.log('File records added successfully.')
            }
          }
        } catch (error) {
          console.error('Upload process error:', error)
          // Continue with story creation even if file upload fails
          console.log('Continuing with story creation despite upload process error')
        }
      }

      // Add tags if any
      if (selectedTags.length > 0) {
        try {
          console.log('Starting tag processing with selected tags:', selectedTags)

          // Ensure we have between 1-3 tags
          if (selectedTags.length < 1 || selectedTags.length > 3) {
            throw new Error('Please select between 1 and 3 tags')
          }

          // First, get existing tags
          console.log('Fetching existing tags from database...')
          const { data: existingTags, error: tagsError } = await supabase
            .from('tags')
            .select('id, name')
            .in('name', selectedTags)

          if (tagsError) {
            console.error('Error fetching tags:', tagsError)
            throw new Error(`Failed to fetch tags: ${tagsError.message}`)
          }

          console.log('Existing tags found:', existingTags)

          // Find which tags need to be created
          const existingTagNames = existingTags?.map(tag => tag.name) || []
          const tagsToCreate = selectedTags.filter(tag => !existingTagNames.includes(tag))

          console.log('Tags to create:', tagsToCreate)

          // Create new tags if needed
          let createdTags = []
          if (tagsToCreate.length > 0) {
            console.log('Creating new tags in database...')
            const { data: newTags, error: createError } = await supabase
              .from('tags')
              .insert(tagsToCreate.map(name => ({ name })))
              .select()

            if (createError) {
              console.error('Error creating tags:', createError)
              throw new Error(`Failed to create tags: ${createError.message}`)
            }

            createdTags = newTags || []
            console.log('New tags created:', createdTags)
          }

          // Combine existing and newly created tags
          const allTags = [...(existingTags || []), ...createdTags]
          console.log('All tags (existing + new):', allTags)

          // Verify we have all the selected tags
          if (allTags.length !== selectedTags.length) {
            throw new Error('Failed to process all selected tags')
          }

          // Create and insert story_tags records one by one
          console.log('Starting to create story_tags records...')
          for (const tag of allTags) {
            const storyTagRecord = {
              story_id: story.id,
              tag_id: tag.id,
              created_at: new Date().toISOString()
            }

            console.log('Inserting story_tag record:', storyTagRecord)

            const { data: insertedRecord, error: insertError } = await supabase
              .from('story_tags')
              .insert(storyTagRecord)
              .select()
              .single()

            if (insertError) {
              console.error('Error inserting story_tag record:', insertError)
              throw new Error(`Failed to add tag ${tag.name} to story: ${insertError.message}`)
            }

            console.log('Successfully inserted story_tag record:', insertedRecord)
          }

          // Create visibility records for each tag
          const tagVisibilityRecords = selectedTags.map(tag => ({
            story_id: story.id,
            visibility_type: tag.toLowerCase().replace(/\s+/g, '_'),
            created_at: new Date().toISOString()
          }))

          console.log('Adding tag visibility records:', tagVisibilityRecords)

          const { error: tagVisibilityError } = await supabase
            .from('story_visibility')
            .insert(tagVisibilityRecords)

          if (tagVisibilityError) {
            console.error('Tag visibility error:', tagVisibilityError)
            throw new Error(`Failed to add tag visibility: ${tagVisibilityError.message}`)
          }

          console.log('Successfully completed all tag operations')
        } catch (error) {
          console.error('Error adding tags:', error)
          // Continue with story creation even if tag operations fail
          console.log('Continuing with story creation despite tag operation errors')
        }
      } else {
        // If no tags are selected, show an error
        setError('Please select at least 1 tag')
        setIsSubmitting(false)
        return
      }

      // If we get here, everything was successful
      setSuccess('Story created successfully!')
      router.push(`/stories/${story.id}`)
    } catch (err) {
      console.error('Error in handleSubmit:', err)
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === mediaPreviews.filter(p => p.type.startsWith('image/')).length - 1 ? 0 : prev + 1
    )
  }

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? mediaPreviews.filter(p => p.type.startsWith('image/')).length - 1 : prev - 1
    )
  }

  return (
    <div className="min-h-screen bg-[#faf9f5]">
      <MainNav />
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#171415] mb-4 fraunces-500">
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
                  <label 
                    htmlFor="file-upload" 
                    className="mt-1 flex justify-center items-center px-6 pt-5 pb-6 border-2 border-[#e4d9cb] border-dashed rounded-md cursor-pointer hover:border-[#d97756] transition-colors"
                  >
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-[#171415]/40" />
                      <div className="flex justify-center text-sm text-[#171415]/60 newsreader-400">
                        <p className="font-normal">Upload, or drag and drop files here</p>
                      </div>
                      <p className="text-xs text-[#171415]/40 newsreader-400">
                        We currently accept up to 3 images, 1 audio file or 1 video file per post
                      </p>
                    </div>
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
                        disabled={isSubmitting}
                      className={`px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-md text-xs sm:text-sm md:text-base border newsreader-400 ${
                        selectedVisibility.includes(option)
                          ? "bg-amber-100 border-amber-300 text-amber-800"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        } transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="block text-xs sm:text-sm md:text-base font-medium mb-2 sm:mb-3 md:mb-4">
                  Choose 1-3 tags that best describe your post:
                </p>
                <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                  {[
                    { name: "Childhood", icon: Baby },
                    { name: "Family", icon: Users },
                    { name: "Grief", icon: Heart },
                    { name: "Health", icon: Stethoscope },
                    { name: "Hobbies/Interests", icon: Palette },
                    { name: "Liberation war", icon: Flag },
                    { name: "Milestones", icon: Award },
                    { name: "Proud moments", icon: Medal },
                    { name: "Reunion", icon: PartyPopper },
                    { name: "School", icon: GraduationCap },
                    { name: "Sports", icon: Trophy },
                    { name: "Travel", icon: Plane },
                  ].sort((a, b) => a.name.localeCompare(b.name)).map(({ name, icon: Icon }) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => toggleTag(name)}
                      disabled={isSubmitting}
                      className={`px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-md text-xs sm:text-sm md:text-base border newsreader-400 flex items-center gap-2 ${
                        selectedTags.includes(name)
                          ? "bg-amber-100 border-amber-300 text-amber-800"
                          : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        } transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <Icon className="w-4 h-4 text-[#d97756]" />
                      <span className="text-left font-normal">{name}</span>
                    </button>
                  ))}
                </div>
              </div>

                {error && (
                  <p className="text-[#d97756] text-sm newsreader-400">
                    {error}
                  </p>
                )}

                {success && (
                  <p className="text-[#171415] text-sm newsreader-400">
                    {success}
                  </p>
                )}

                <Button
                  type="submit"
                  variant="default"
                  size="lg"
                  isLoading={isSubmitting}
                >
                  {isSubmitting ? 'Sharing memory...' : 'Share memory'}
                </Button>
              </form>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-medium text-[#d97756] mb-4 fraunces-500">
                Preview
              </h2>
              <div className="prose max-w-none">
                {title && (
                  <h1 className="text-2xl font-medium text-[#171415] mb-4 fraunces-500">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="text-[#171415]/80 whitespace-pre-wrap newsreader-400 mb-6">
                    {description}
                  </p>
                )}
                {mediaPreviews.length > 0 && (
                  <div className="mb-6">
                    {/* Show images in slideshow if there are multiple images */}
                    {mediaPreviews.some(p => p.type.startsWith('image/')) && (
                      <div className="relative group mb-4">
                        {mediaPreviews
                          .filter(p => p.type.startsWith('image/'))
                          .map((preview, index) => (
                            <div
                              key={index}
                              className={`w-full transition-opacity duration-300 ${
                                index === currentImageIndex ? 'opacity-100' : 'opacity-0 absolute top-0 left-0'
                              }`}
                            >
                              <img
                                src={preview.url}
                                alt="Preview"
                                className="w-full h-auto rounded-lg object-cover"
                              />
                            </div>
                          ))}
                        {mediaPreviews.filter(p => p.type.startsWith('image/')).length > 1 && (
                          <>
                            <button
                              onClick={prevImage}
                              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ChevronLeft className="h-6 w-6" />
                            </button>
                            <button
                              onClick={nextImage}
                              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <ChevronRight className="h-6 w-6" />
                            </button>
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                              {mediaPreviews
                                .filter(p => p.type.startsWith('image/'))
                                .map((_, idx) => (
                                  <div
                                    key={idx}
                                    className={`w-2 h-2 rounded-full ${
                                      idx === currentImageIndex ? 'bg-white' : 'bg-white/50'
                                    }`}
                                  />
                                ))}
                            </div>
                          </>
                        )}
                      </div>
                    )}
                    
                    {/* Show other media types */}
                    {mediaPreviews
                      .filter(p => !p.type.startsWith('image/'))
                      .map((preview, index) => (
                        <div key={index} className="mb-4 last:mb-0">
                          {preview.type.startsWith('audio/') ? (
                            <div className="w-full p-4 bg-[#faf9f5] rounded-lg">
                              <audio controls className="w-full">
                                <source src={preview.url} type={preview.type} />
                                Your browser does not support the audio element.
                              </audio>
                            </div>
                          ) : preview.type.startsWith('video/') ? (
                            <div className="w-full">
                              <video controls className="w-full rounded-lg">
                                <source src={preview.url} type={preview.type} />
                                Your browser does not support the video element.
                              </video>
                            </div>
                          ) : null}
                        </div>
                      ))}
                  </div>
                )}
                {transcriptQuestion && (
                  <div className="mt-6 p-4 bg-[#faf9f5] rounded-lg">
                    <h4 className="text-lg font-medium text-[#171415] mb-2 newsreader-500">
                      Question
                    </h4>
                    <p className="text-[#171415]/80 newsreader-400">
                      {transcriptQuestion}
                    </p>
                  </div>
                )}
                {transcriptAnswer && (
                  <div className="mt-4 p-4 bg-[#faf9f5] rounded-lg">
                    <h4 className="text-lg font-medium text-[#171415] mb-2 newsreader-500">
                      Answer
                    </h4>
                    <p className="text-[#171415]/80 newsreader-400">
                      {transcriptAnswer}
                    </p>
                  </div>
                )}
                {!title && !description && !mediaPreviews.length && !transcriptQuestion && !transcriptAnswer && (
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
