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
  profiles?: {
    full_name: string
  }
}

interface Comment {
  id: string
  content: string
  created_at: string
  updated_at: string
  profiles: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

export default function StoryPage({ params }: { params: { id: string } }) {
  const [story, setStory] = useState<Story | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [commentsCount, setCommentsCount] = useState(0)
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
            ),
            profiles (
              full_name
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

  useEffect(() => {
    const checkBookmarkStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const { data } = await supabase
          .from('bookmarks')
          .select()
          .eq('user_id', session.user.id)
          .eq('story_id', params.id)
          .single()

        setIsBookmarked(!!data)
      } catch (error) {
        console.error('Error checking bookmark status:', error)
      }
    }

    checkBookmarkStatus()
  }, [supabase, params.id])

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const { data, error } = await supabase
          .from('comments')
          .select(`
            id,
            content,
            created_at,
            updated_at,
            profiles!comments_user_id_fkey (
              id,
              full_name,
              avatar_url
            )
          `)
          .eq('story_id', params.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching comments:', error.message)
          return
        }

        if (data) {
          // Transform the data to match the Comment interface
          const typedComments = data.map(comment => ({
            ...comment,
            profiles: comment.profiles[0] // Take the first profile since it's a one-to-one relationship
          })) as Comment[]
          
          setComments(typedComments)
          setCommentsCount(typedComments.length)
        }
      } catch (error) {
        console.error('Error in fetchComments:', error instanceof Error ? error.message : 'Unknown error')
      }
    }

    fetchComments()
  }, [supabase, params.id])

  const toggleBookmark = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session) {
        router.push('/signin')
        return
      }

      if (isBookmarked) {
        await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', session.user.id)
          .eq('story_id', params.id)
      } else {
        await supabase
          .from('bookmarks')
          .insert({
            user_id: session.user.id,
            story_id: params.id,
            created_at: new Date().toISOString()
          })
      }

      setIsBookmarked(!isBookmarked)
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    try {
      setIsSubmitting(true)
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/signin')
        return
      }

      // First get the user's profile
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('username, full_name, avatar_url')
        .eq('id', session.user.id)
        .single()

      if (profileError) {
        console.error('Error fetching user profile:', profileError)
        return
      }

      // Then insert the comment
      const { data: comment, error: commentError } = await supabase
        .from('comments')
        .insert({
          story_id: params.id,
          user_id: session.user.id,
          content: newComment.trim(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (commentError) {
        console.error('Error posting comment:', commentError)
        return
      }

      // Combine comment with profile data
      const commentWithProfile = {
        ...comment,
        profiles: userProfile
      }

      // Update the comments list with the new comment
      setComments(prev => [commentWithProfile as Comment, ...prev])
      setNewComment('')
      setCommentsCount(prev => prev + 1)
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

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
      <main className="pt-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#171415] hover:text-[#b15e4e] transition-colors mb-12 newsreader-400"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15.8332 10H4.1665" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M8.33317 5L3.33317 10L8.33317 15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Back
          </button>

          <article className="rounded-lg overflow-hidden">
            {/* Story Title and Bookmark */}
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#171415] fraunces-400">
                {story.title}
              </h1>
              <button
                onClick={toggleBookmark}
                className="p-2 hover:bg-[#faf9f5] rounded-full transition-colors"
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 24 24"
                  fill={isBookmarked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="text-[#171415] hover:text-[#b15e4e] transition-colors"
                >
                  <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                </svg>
              </button>
            </div>

            {/* Submitter Info */}
            <p className="text-[#171415]/60 text-lg mb-8 fraunces-400">
              Submitted by {story.profiles?.full_name || 'Anonymous'} • {new Date(story.created_at).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>

            {/* Story Description */}
            <p className="text-[#171415] text-2xl leading-8 mb-6 newsreader-400">
              {story.description}
            </p>

            {/* Story Tags */}
            <div className="flex flex-wrap gap-2 mb-5">
              {story.story_tags?.map(({ tags }) => (
                <span
                  key={tags.name}
                  className="px-4 py-2 bg-[#faf9f5] text-[#171415] rounded-full text-sm newsreader-400 border border-[#e4d9cb]"
                >
                  {tags.icon} {tags.name}
                </span>
              ))}
            </div>

            {/* Story Header */}
            <div className="relative h-[300px] sm:h-[400px] md:h-[500px] mb-8">
              <Image
                src={story.thumbnail_url || "/placeholder.svg"}
                alt={story.title}
                fill
                className="object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 sm:p-8 md:p-12 flex flex-col justify-end">
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

                {/* Comments Section */}
                <div className="mt-16">
                  <h2 className="text-2xl font-bold text-[#171415] mb-8 fraunces-400">Comments</h2>
                  
                  {/* Comment Form */}
                  <form onSubmit={handleSubmitComment} className="mb-12">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share your thoughts..."
                      className="w-full h-32 p-4 border border-[#e4d9cb] rounded-lg focus:outline-none focus:border-[#b15e4e] resize-none newsreader-400"
                    />
                    <div className="mt-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={isSubmitting || !newComment.trim()}
                        className={`inline-block border-2 border-[#171415] text-[#171415] px-6 py-3 rounded-md transition-colors hover:bg-[#faf9f5] instrument-400 ${
                          isSubmitting || !newComment.trim()
                            ? 'bg-[#e4d9cb]/60 text-[#c6af96] border-0'
                            : ''
                        }`}
                      >
                        {isSubmitting ? 'Posting...' : 'Post Comment'}
                      </button>
                    </div>
                  </form>

                  {/* Comments List */}
                  <div className="space-y-8">
                    {comments.map((comment) => (
                      <div key={comment.id} className="border-b border-[#e4d9cb] pb-8 last:border-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-[#171415] fraunces-400">
                            {comment.profiles?.full_name || 'Anonymous'}
                          </span>
                          <span className="text-[#171415]/40 text-sm newsreader-400">
                            • {new Date(comment.created_at).toLocaleDateString('en-US', {
                                month: 'long',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                          </span>
                        </div>
                        <p className="text-[#171415] newsreader-400">{comment.content}</p>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <p className="text-[#171415]/60 text-center newsreader-400">
                        No comments yet. Be the first to share your thoughts!
                      </p>
                    )}
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
