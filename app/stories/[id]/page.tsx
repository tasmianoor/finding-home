"use client"

import { use } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import MainNav from "../../components/MainNav"
import Footer from "../../components/Footer"
import StoryContent from "./StoryContent"

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

interface StoryPageProps {
  params: Promise<{ id: string }>
}

export default function StoryPage({ params }: StoryPageProps) {
  const resolvedParams = use(params)
  const storyId = resolvedParams.id
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
          .eq('id', storyId)
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
  }, [supabase, storyId])

  useEffect(() => {
    const checkBookmarkStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) return

        const { data } = await supabase
          .from('bookmarks')
          .select()
          .eq('user_id', session.user.id)
          .eq('story_id', storyId)
          .single()

        setIsBookmarked(!!data)
      } catch (error) {
        console.error('Error checking bookmark status:', error)
      }
    }

    checkBookmarkStatus()
  }, [supabase, storyId])

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
          .eq('story_id', storyId)
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
  }, [supabase, storyId])

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
          .eq('story_id', storyId)
      } else {
        await supabase
          .from('bookmarks')
          .insert({
            user_id: session.user.id,
            story_id: storyId,
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
          story_id: storyId,
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf9f5]">
      <MainNav />
      <main className="pt-16">
        <StoryContent storyId={storyId} />
      </main>
      <Footer />
    </div>
  )
}
