"use client"

import type React from "react"
import Link from "next/link"
import { HomeIcon, PlusCircle, Upload, Loader2, X, ChevronLeft, ChevronRight } from "lucide-react"
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
      // Check if user is authenticated
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError) throw new Error(`Authentication error: ${authError.message}`)
      if (!session) throw new Error('No active session found')

      // Check if user has a profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (profileError) throw new Error(`Profile error: ${profileError.message}`)
      if (!profile) throw new Error('No profile found for user')

      // Check if database is connected
      const { error: dbError } = await supabase.from('stories').select('count').limit(1)
      if (dbError) throw new Error(`Database connection error: ${dbError.message}`)

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

      console.log('Creating story with data:', storyData)

      const { data: story, error: storyError } = await supabase
        .from('stories')
        .insert([storyData])
        .select()
        .single()

      if (storyError) {
        console.error('Story creation error:', storyError)
        throw new Error(`Failed to create story: ${storyError.message}`)
      }

      if (!story) {
        throw new Error('No story data returned after creation')
      }

      console.log('Story created successfully:', story)

      // Add visibility options
      try {
        const visibilityData = {
          story_id: story.id,
          visibility_type: selectedVisibility[0].toLowerCase().replace(/\s+/g, '_'),
          created_at: new Date().toISOString()
        }

        console.log('Adding visibility options:', visibilityData)

        const { error: visibilityError } = await supabase
          .from('story_visibility')
          .insert([visibilityData])

        if (visibilityError) {
          console.error('Visibility error:', visibilityError)
          throw new Error(`Failed to set visibility: ${visibilityError.message}`)
        }
      } catch (error) {
        console.error('Error adding visibility:', error)
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
            throw new Error(`Failed to check storage buckets: ${bucketError.message}`)
          }

          const memoriesBucket = buckets?.find(b => b.name === 'memories')
          if (!memoriesBucket) {
            console.error('Memories bucket not found, attempting to create it...')
            const { data: newBucket, error: createError } = await supabase
              .storage
              .createBucket('memories', {
                public: false,
                fileSizeLimit: 10 * 1024 * 1024 // 10MB
              })

            if (createError) {
              console.error('Failed to create memories bucket:', createError)
              throw new Error(`Failed to create memories bucket: ${createError.message}`)
            }

            if (!newBucket) {
              throw new Error('Failed to create memories bucket: No bucket data returned')
            }

            console.log('Memories bucket created successfully:', newBucket)
          }

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
              const filePath = `${fileType}/${Date.now()}_${file.name}`

              console.log('Uploading file to path:', filePath)

              const { data: uploadData, error: uploadError } = await supabase.storage
                .from('memories')
                .upload(filePath, file, {
                  cacheControl: '3600',
                  upsert: false
                })

              if (uploadError) {
                console.error('Upload error details:', {
                  error: uploadError,
                  file: file.name,
                  path: filePath
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
                file: file.name
              })
              throw new Error(`Failed to process file ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
            }
          })

          const uploadedFiles = await Promise.all(uploadPromises)
          console.log('All files uploaded successfully:', uploadedFiles)

          // Filter images and get the first one for thumbnail
          const images = uploadedFiles.filter(f => f.type === 'images')
          console.log('Uploaded images:', images)

          const thumbnailUrl = images.length > 0 ? images[0].url : null
          console.log('Selected thumbnail URL:', thumbnailUrl)

          // Update story with thumbnail
          if (thumbnailUrl) {
            const { error: updateError } = await supabase
              .from('stories')
              .update({ thumbnail_url: thumbnailUrl })
              .eq('id', story.id)

            if (updateError) {
              console.error('Thumbnail update error:', updateError)
              throw new Error(`Failed to update thumbnail: ${updateError.message}`)
            }
          }

          // Add files to story_files
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
            throw new Error(`Failed to add file records: ${filesError.message}`)
          }
        } catch (error) {
          console.error('Upload process error:', error)
          throw new Error(`Error in file upload process: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

      // Add tags if any
      if (selectedTags.length > 0) {
        try {
          const tagRecords = selectedTags.map(tag => ({
            story_id: story.id,
            tag_name: tag,
            created_at: new Date().toISOString()
          }))

          console.log('Adding tags:', tagRecords)

          const { error: tagError } = await supabase
            .from('story_tags')
            .insert(tagRecords)

          if (tagError) {
            console.error('Tag error:', tagError)
            throw new Error(`Failed to add tags: ${tagError.message}`)
          }
        } catch (error) {
          console.error('Error adding tags:', error)
          throw new Error(`Failed to add tags: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }

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
                        disabled={isSubmitting}
                        className={`px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-md text-xs sm:text-sm md:text-base border ${
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
                        disabled={isSubmitting}
                        className={`px-2 sm:px-3 md:px-4 py-2 sm:py-2.5 md:py-3 rounded-md text-xs sm:text-sm md:text-base border ${
                          selectedTags.includes(tag)
                            ? "bg-amber-100 border-amber-300 text-amber-800"
                            : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                        } transition-colors ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
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

                {success && (
                  <p className="text-[#171415] text-sm newsreader-400">
                    {success}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-[#171415] text-[#faf9f5] py-3 px-4 rounded-md hover:bg-[#171415]/90 transition-colors newsreader-400"
                >
                  {isSubmitting ? 'Saving...' : 'Save Memory'}
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
                {description && (
                  <p className="text-[#171415]/80 whitespace-pre-wrap newsreader-400">
                    {description}
                  </p>
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
