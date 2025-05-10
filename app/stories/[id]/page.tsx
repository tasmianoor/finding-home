"use client"

import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import MainNav from "../../components/MainNav"
import Footer from "../../components/Footer"
import Image from "next/image"

interface Story {
  id: string
  title: string
  description: string
  episode_number: number
  audio_url: string
  thumbnail_url: string
  transcript_question: string
  transcript_answer: string
  duration: number
  is_published: boolean
  view_count: number
  created_at: string
  updated_at: string
  story_tags?: Array<{
    tags: {
      name: string
      icon: string
    }
  }>
}

export default function StoryPage({ params }: { params: { id: string } }) {
  const [story, setStory] = useState<Story | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const fetchStory = async () => {
      try {
        setIsLoading(true)
        
        const { data, error } = await supabase
          .from('stories')
          .select(`
            *,
            story_tags (
              tag_id,
              tags (
                name,
                icon
              )
            )
          `)
          .eq('id', params.id)
          .single()

        if (error) throw error

        if (data) {
          setStory(data as Story)
        }
      } catch (err) {
        console.error('Error:', err)
        setError('Failed to load story')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStory()
  }, [supabase, params.id])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f5]">
        <MainNav />
        <main className="pt-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
            <div className="text-center">
              <p className="text-[#171415] newsreader-400">Loading...</p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-[#faf9f5]">
        <MainNav />
        <main className="pt-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
            <div className="text-center">
              <p className="text-[#171415] newsreader-400">
                {error || 'Story not found'}
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf9f5]">
      <MainNav />
      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <article className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* Story Header */}
            <div className="relative h-[300px] sm:h-[400px] md:h-[500px]">
              <Image
                src={story.thumbnail_url || "/placeholder.svg"}
                alt={story.title}
                fill
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 sm:p-8 md:p-12 flex flex-col justify-end">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-4 newsreader-500">
                  {story.title}
                </h1>
                <div className="flex flex-wrap gap-2">
                  {story.story_tags?.map(({ tags }) => (
                    <span
                      key={tags.name}
                      className="px-3 py-1 bg-white/20 text-white rounded-full text-sm newsreader-400"
                    >
                      {tags.icon} {tags.name}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Story Content */}
            <div className="p-6 sm:p-8 md:p-12">
              <div className="prose max-w-none">
                <p className="text-[#171415]/80 text-lg mb-8 newsreader-400">
                  {story.description}
                </p>

                {story.transcript_question && (
                  <div className="mb-8">
                    <h2 className="text-xl font-medium text-[#171415] mb-4 newsreader-500">
                      Question
                    </h2>
                    <p className="text-[#171415]/80 newsreader-400">
                      {story.transcript_question}
                    </p>
                  </div>
                )}

                {story.transcript_answer && (
                  <div className="mb-8">
                    <h2 className="text-xl font-medium text-[#171415] mb-4 newsreader-500">
                      Answer
                    </h2>
                    <p className="text-[#171415]/80 newsreader-400">
                      {story.transcript_answer}
                    </p>
                  </div>
                )}

                {story.audio_url && (
                  <div className="mt-8">
                    <h2 className="text-xl font-medium text-[#171415] mb-4 newsreader-500">
                      Listen to the Story
                    </h2>
                    <audio
                      controls
                      className="w-full"
                      src={story.audio_url}
                    >
                      Your browser does not support the audio element.
                    </audio>
                  </div>
                )}
              </div>

              {/* Story Metadata */}
              <div className="mt-8 pt-8 border-t border-[#e4d9cb]">
                <div className="flex flex-wrap gap-4 text-sm text-[#171415]/60 newsreader-400">
                  <div>
                    Published: {new Date(story.created_at).toLocaleDateString()}
                  </div>
                  <div>
                    Duration: {story.duration} seconds
                  </div>
                  <div>
                    Views: {story.view_count}
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </main>
      <Footer />
    </div>
  )
}
