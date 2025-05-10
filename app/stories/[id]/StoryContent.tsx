"use client"

import type React from "react"
import Link from "next/link"
import { HomeIcon, PlusCircle, ArrowLeft, Bookmark, Rewind, FastForward, Play, Pause, Share2 } from "lucide-react"
import { useState, useRef, useEffect } from "react"
import NewStoryCard from "@/components/NewStoryCard"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/database.types"
import { useRouter } from "next/navigation"

// Helper function to format duration in seconds to MM:SS
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
}

interface Comment {
  id: string
  story_id: string
  user_id: string
  parent_id: string | null
  content: string
  created_at: string
  updated_at: string
  profiles: {
    username: string
    full_name: string
    avatar_url: string | null
  }
  replies?: Comment[]
}

interface StoryContentProps {
  storyId: string
}

interface Story {
  id: string
  title: string
  description: string
  episode_number: number
  audio_url: string | null
  video_url: string | null
  thumbnail_url: string | null
  transcript_question: string
  transcript_answer: string
  duration: number
  is_published: boolean
  view_count: number
  created_at: string
  updated_at: string
  tags?: Array<{
    name: string
    icon: string
  }>
  isNew?: boolean // Optional flag for new stories
  profiles?: {
    username: string
    full_name: string
    avatar_url: string | null
  }
}

interface StoryTag {
  tags: {
    name: string
    icon: string
  }
}

export default function StoryContent({ storyId }: StoryContentProps) {
  // All state hooks
  const [story, setStory] = useState<Story | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [showTranscript, setShowTranscript] = useState(true)
  const [commentText, setCommentText] = useState("")
  const [replyText, setReplyText] = useState("")
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [likesCount, setLikesCount] = useState(0)
  const [isLiked, setIsLiked] = useState(false)
  const [commentsCount, setCommentsCount] = useState(0)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [nextStory, setNextStory] = useState<Story | null>(null)

  // All ref hooks
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressRef = useRef<HTMLDivElement>(null)

  // All other hooks
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()

  // Data fetching effect
  useEffect(() => {
    const fetchStoryAndComments = async () => {
      try {
        setIsLoading(true)
        
        // Get current user session
        const { data: { session: userSession } } = await supabase.auth.getSession()
        setCurrentUserId(userSession?.user?.id || null)

        // Fetch story details with proper joins
        const { data: storyData, error: storyError } = await supabase
          .from('stories')
          .select(`
            *,
            story_tags (
              tags (
                name,
                icon
              )
            ),
            profiles!stories_user_id_fkey (
              username,
              full_name,
              avatar_url
            )
          `)
          .eq('id', storyId)
          .single()

        if (storyError) {
          console.error('Error fetching story:', storyError)
          return
        }

        // Fetch comments with user profiles
        const { data: commentsData, error: commentsError } = await supabase
          .from('comments')
          .select(`
            *,
            profiles!comments_user_id_fkey (
              username,
              full_name,
              avatar_url
            )
          `)
          .eq('story_id', storyId)
          .order('created_at', { ascending: false })

        if (commentsError) {
          console.error('Error fetching comments:', commentsError)
        }

        // Fetch likes count and user's like status
        if (userSession) {
          const { count: likesCountData } = await supabase
            .from('likes')
            .select('*', { count: 'exact' })
            .eq('story_id', storyId)

          const { data: userLike } = await supabase
            .from('likes')
            .select()
            .eq('story_id', storyId)
            .eq('user_id', userSession.user.id)
            .single()

          setLikesCount(likesCountData || 0)
          setIsLiked(!!userLike)
        }

        // Organize comments into a tree structure
        const commentTree = organizeComments(commentsData || [])
        setComments(commentTree)
        setCommentsCount((commentsData || []).length)

        if (storyData) {
          const storyWithTags = {
            ...storyData,
            tags: storyData.story_tags?.map((st: any) => ({
              name: st.tags.name,
              icon: st.tags.icon
            })) || [],
            isNew: new Date(storyData.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
            profiles: storyData.profiles
          }
          setStory(storyWithTags)

          // Check if story is bookmarked
          if (userSession) {
            const { data: bookmarkData } = await supabase
              .from('bookmarks')
              .select()
              .eq('user_id', userSession.user.id)
              .eq('story_id', storyId)
              .single()

            setIsBookmarked(!!bookmarkData)
          }

          // Fetch next story
          const { data: nextStoryData, error: nextStoryError } = await supabase
            .from('stories')
            .select(`
              *,
              story_tags (
                tags (
                  name,
                  icon
                )
              )
            `)
            .gt('episode_number', storyData.episode_number)
            .eq('is_published', true)
            .order('episode_number', { ascending: true })
            .limit(1)
            .single()

          if (!nextStoryError && nextStoryData) {
            const nextStoryWithTags = {
              ...nextStoryData,
              tags: nextStoryData.story_tags?.map((st: any) => ({
                name: st.tags.name,
                icon: st.tags.icon
              })) || [],
              isNew: new Date(nextStoryData.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000
            }
            setNextStory(nextStoryWithTags)
          }
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStoryAndComments()
  }, [supabase, storyId])

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
      }
    }
  }, [])

  // Event handlers and other functions
  const toggleBookmark = async () => {
    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session) {
        router.push('/signin')
        return
      }

      if (isBookmarked) {
        // Remove bookmark
        await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', session.user.id)
          .eq('story_id', storyId)
      } else {
        // Add bookmark
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

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play().catch((error) => {
          console.error("Error playing audio:", error)
        })
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (progressRef.current && audioRef.current) {
      const rect = progressRef.current.getBoundingClientRect()
      const pos = (e.clientX - rect.left) / rect.width
      audioRef.current.currentTime = pos * audioRef.current.duration
    }
  }

  const rewind = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - 10)
    }
  }

  const forward = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(audioRef.current.duration, audioRef.current.currentTime + 10)
    }
  }

  const toggleTranscript = () => {
    setShowTranscript(!showTranscript)
  }

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
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
          content: commentText,
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

      setComments(prev => [commentWithProfile as Comment, ...prev])
      setCommentText("")
      setCommentsCount(prev => prev + 1)
    } catch (error) {
      console.error('Error posting comment:', error)
    }
  }

  const handleReplySubmit = async (parentId: string) => {
    try {
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

      // Then insert the reply
      const { data: reply, error: replyError } = await supabase
        .from('comments')
        .insert({
          story_id: storyId,
          user_id: session.user.id,
          parent_id: parentId,
          content: replyText,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single()

      if (replyError) {
        console.error('Error posting reply:', replyError)
        return
      }

      // Combine reply with profile data
      const replyWithProfile = {
        ...reply,
        profiles: userProfile
      }

      // Update the comments tree
      const newComments = [...comments]
      const parentComment = findCommentById(newComments, parentId)
      if (parentComment) {
        parentComment.replies = parentComment.replies || []
        parentComment.replies.push(replyWithProfile as Comment)
      }
      
      setComments(newComments)
      setReplyText("")
      setReplyingTo(null)
      setCommentsCount(prev => prev + 1)
    } catch (error) {
      console.error('Error posting reply:', error)
    }
  }

  const findCommentById = (comments: Comment[], id: string): Comment | null => {
    for (const comment of comments) {
      if (comment.id === id) return comment
      if (comment.replies) {
        const found = findCommentById(comment.replies, id)
        if (found) return found
      }
    }
    return null
  }

  const toggleLike = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/signin')
        return
      }

      if (isLiked) {
        await supabase
          .from('likes')
          .delete()
          .eq('user_id', session.user.id)
          .eq('story_id', storyId)
        setLikesCount(prev => prev - 1)
      } else {
        await supabase
          .from('likes')
          .insert({
            user_id: session.user.id,
            story_id: storyId,
            created_at: new Date().toISOString()
          })
        setLikesCount(prev => prev + 1)
      }
      setIsLiked(!isLiked)
    } catch (error) {
      console.error('Error toggling like:', error)
    }
  }

  // Helper function to organize comments into a tree structure
  const organizeComments = (flatComments: Comment[]): Comment[] => {
    const commentMap = new Map<string, Comment>()
    const rootComments: Comment[] = []

    // First pass: Create a map of all comments
    flatComments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] })
    })

    // Second pass: Organize into tree structure
    flatComments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!
      if (comment.parent_id) {
        const parentComment = commentMap.get(comment.parent_id)
        if (parentComment) {
          parentComment.replies?.push(commentWithReplies)
        }
      } else {
        rootComments.push(commentWithReplies)
      }
    })

    return rootComments
  }

  // Add delete comment function
  const handleDeleteComment = async (commentId: string) => {
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)

      if (error) {
        console.error('Error deleting comment:', error)
        return
      }

      // Remove the comment from state
      const removeComment = (comments: Comment[]): Comment[] => {
        return comments.filter(comment => {
          if (comment.id === commentId) return false
          if (comment.replies) {
            comment.replies = removeComment(comment.replies)
          }
          return true
        })
      }

      setComments(prev => removeComment(prev))
      setCommentsCount(prev => prev - 1)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (isLoading || !story) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen" style={{ background: "linear-gradient(to bottom, #fffdf5, #ffefd0)" }}>
      {/* Header */}
      <header className="bg-white flex justify-between items-center px-3 sm:px-4 md:px-6 py-2 sm:py-3 md:py-4 sticky top-0 z-50 shadow-sm">
        <Link href="/" className="flex items-center gap-1 sm:gap-2">
          <div className="bg-black rounded p-0.5 sm:p-1">
            <HomeIcon className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
          </div>
          <span className="text-xs sm:text-sm md:text-base text-gray-800 font-medium">Finding Home</span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3 md:gap-6">
          <Link href="/add-memories" className="flex items-center gap-1 text-gray-800">
            <PlusCircle className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm md:text-base hidden xs:inline">Add your own memories</span>
            <span className="text-xs sm:text-sm md:text-base inline xs:hidden">Add</span>
          </Link>
          <Link href="/profile" className="text-xs sm:text-sm md:text-base text-gray-800">
            Profile
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 md:px-6 py-10 sm:py-12 md:py-16 lg:py-20">
          {/* Back Button */}
          <Link
            href="/stories"
            className="inline-flex items-center gap-1 sm:gap-2 text-gray-800 hover:text-amber-700 mb-10 sm:mb-12 md:mb-16"
          >
            <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
            <span className="text-xs sm:text-sm md:text-base font-medium">Back to all stories</span>
          </Link>

          {/* Story Header */}
          <div className="mb-8 sm:mb-10 md:mb-12 relative">
            <div className="flex justify-between items-start mb-4 sm:mb-6">
              {story.isNew && (
                <div className="inline-block bg-amber-200 px-3 sm:px-4 py-1 rounded-md">
                  <span className="font-medium text-amber-900 text-xs sm:text-sm">NEW STORY</span>
                </div>
              )}
              <button
                onClick={toggleBookmark}
                className="text-amber-500 hover:text-amber-600 transition-colors"
                aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
              >
                <Bookmark
                  className="h-5 w-5 sm:h-6 sm:w-6 md:h-7 md:w-7"
                  fill={isBookmarked ? "currentColor" : "none"}
                />
              </button>
            </div>

            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 sm:mb-6 md:mb-8">
              {story.title}
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-gray-800 mb-6 sm:mb-8 md:mb-10">{story.description}</p>

            {/* Share button - positioned absolutely */}
            <div className="absolute right-0 bottom-0 md:bottom-10">
              <button
                className="bg-gray-900 text-white p-2 rounded-full hover:bg-gray-800 transition-colors"
                aria-label="Share this story"
              >
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6 sm:mb-8 md:mb-10">
              {story.tags?.map((tag) => (
                <span
                  key={tag.name}
                  className="inline-flex items-center px-2 sm:px-3 py-1 rounded-md bg-gray-800 text-white text-xs sm:text-sm"
                >
                  <span className="mr-1">{tag.icon}</span>
                  {tag.name}
                </span>
              ))}
            </div>
          </div>

          {/* Media Player */}
          <div className="bg-gray-900 rounded-lg overflow-hidden shadow-md">
            <div className="flex items-center p-3 sm:p-4">
              <img
                src={story.thumbnail_url || "/placeholder.svg"}
                alt="Episode thumbnail"
                className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-md mr-3 sm:mr-4"
              />
              <div className="flex-1">
                <h2 className="text-white text-sm sm:text-base font-medium mb-1">{story.title}</h2>
                <p className="text-gray-300 text-xs sm:text-sm line-clamp-1">{story.description}</p>
              </div>
              <button
                onClick={toggleBookmark}
                className="text-white hover:text-amber-400 transition-colors ml-2"
                aria-label={isBookmarked ? "Remove bookmark" : "Add bookmark"}
              >
                <Bookmark className="h-4 w-4 sm:h-5 sm:w-5" fill={isBookmarked ? "currentColor" : "none"} />
              </button>
            </div>

            {/* Video Player */}
            {story.video_url && (
              <div className="relative pt-[56.25%]"> {/* 16:9 aspect ratio */}
                <video
                  ref={audioRef as any}
                  src={story.video_url}
                  className="absolute top-0 left-0 w-full h-full object-cover"
                  controls
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                />
              </div>
            )}

            {/* Audio Player */}
            {story.audio_url && !story.video_url && (
              <>
                <div className="px-3 sm:px-4 pb-3 sm:pb-4">
                  <div
                    ref={progressRef}
                    className="h-1 bg-gray-700 rounded-full mb-3 cursor-pointer"
                    onClick={handleProgressClick}
                  >
                    <div
                      className="h-full bg-amber-500 rounded-full"
                      style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <button
                        onClick={rewind}
                        className="text-white hover:text-amber-400 transition-colors mr-3 sm:mr-4"
                        aria-label="Rewind 10 seconds"
                      >
                        <Rewind className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                      <button
                        onClick={togglePlay}
                        className="bg-white hover:bg-amber-400 transition-colors rounded-full p-1 sm:p-1.5 mr-3 sm:mr-4"
                        aria-label={isPlaying ? "Pause" : "Play"}
                      >
                        {isPlaying ? (
                          <Pause className="h-4 w-4 sm:h-5 sm:w-5 text-gray-900" />
                        ) : (
                          <Play className="h-4 w-4 sm:h-5 sm:w-5 text-gray-900" />
                        )}
                      </button>
                      <button
                        onClick={forward}
                        className="text-white hover:text-amber-400 transition-colors"
                        aria-label="Forward 10 seconds"
                      >
                        <FastForward className="h-4 w-4 sm:h-5 sm:w-5" />
                      </button>
                    </div>
                    <span className="text-white text-xs sm:text-sm">{formatDuration(story.duration)}</span>
                  </div>
                </div>

                {/* Hidden audio element */}
                <audio
                  ref={audioRef}
                  src={story.audio_url}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />
              </>
            )}

            {/* Image Only */}
            {!story.video_url && !story.audio_url && story.thumbnail_url && (
              <div className="relative pt-[56.25%]"> {/* 16:9 aspect ratio */}
                <img
                  src={story.thumbnail_url}
                  alt={story.title}
                  className="absolute top-0 left-0 w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Transcript Section - Full Width */}
        <div className="w-full bg-white mt-8 sm:mt-10 md:mt-12">
          <div className="max-w-4xl mx-auto px-6 sm:px-8 py-8 sm:py-10">
            <h2 className="text-gray-500 text-sm sm:text-base font-medium uppercase tracking-wider mb-6 sm:mb-8">
              TRANSCRIPT
            </h2>

            <div className="space-y-6">
              <p className="text-gray-700 italic">{story.transcript_question}</p>

              <p className="text-gray-800">{story.transcript_answer}</p>
            </div>
          </div>
        </div>

        {/* Comments Section - Full Width */}
        <div className="w-full bg-white">
          <div className="max-w-4xl mx-auto px-3 xs:px-4 sm:px-6 md:px-8 py-6 sm:py-8 md:py-10">
            {/* Likes */}
            <div className="flex items-center gap-1 xs:gap-2 mb-4 sm:mb-6">
              <button
                onClick={toggleLike}
                className={`flex items-center gap-1 ${isLiked ? 'text-amber-600' : 'text-gray-600'} hover:text-amber-600 transition-colors`}
              >
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                </svg>
                <span className="text-gray-600 text-xs sm:text-sm">{likesCount} {likesCount === 1 ? 'person liked' : 'people liked'} this story</span>
              </button>
            </div>

            {/* Comments heading */}
            <h3 className="text-gray-500 font-medium uppercase text-xs sm:text-sm mb-4 sm:mb-6">
              {commentsCount} {commentsCount === 1 ? 'COMMENT' : 'COMMENTS'}
            </h3>

            {/* Comment form */}
            <form onSubmit={handleCommentSubmit} className="bg-white border border-gray-100 rounded-md p-3 sm:p-4 mb-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                <img
                  src={story.profiles?.avatar_url || "/placeholder-avatar.png"}
                  alt={story.profiles?.full_name || "Your avatar"}
                  className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
                />
                <div>
                  <p className="font-medium text-sm sm:text-base">{story.profiles?.full_name || "You"}</p>
                  <p className="text-gray-500 text-xs">{new Date().toLocaleDateString()}</p>
                </div>
              </div>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="What are your thoughts?"
                className="w-full p-2 border border-gray-200 rounded-md mb-3 sm:mb-4 text-sm sm:text-base resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                rows={3}
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!commentText.trim()}
                  className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md transition-colors"
                >
                  Post
                </button>
              </div>
            </form>

            {/* Comments list */}
            <div className="space-y-4 sm:space-y-6">
              {comments.map((comment) => (
                <div key={comment.id}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                      <img
                        src={comment.profiles.avatar_url || "/placeholder-avatar.png"}
                        alt={comment.profiles.full_name}
                        className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-sm sm:text-base">{comment.profiles.full_name}</p>
                        <p className="text-gray-500 text-xs">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {currentUserId === comment.user_id && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-500 text-xs sm:text-sm hover:text-red-600"
                        >
                          Delete
                        </button>
                      )}
                      <button
                        onClick={() => setReplyingTo(comment.id)}
                        className="text-gray-500 text-xs sm:text-sm hover:text-amber-600"
                      >
                        Reply
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm sm:text-base">{comment.content}</p>

                  {/* Reply form */}
                  {replyingTo === comment.id && (
                    <div className="mt-4 bg-white border border-gray-100 rounded-md p-3 sm:p-4">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Write a reply..."
                        className="w-full p-2 border border-gray-200 rounded-md mb-3 sm:mb-4 text-sm sm:text-base resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
                        rows={2}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setReplyingTo(null)}
                          className="text-gray-500 hover:text-gray-700 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleReplySubmit(comment.id)}
                          disabled={!replyText.trim()}
                          className="bg-amber-600 hover:bg-amber-700 disabled:bg-gray-300 text-white px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm rounded-md transition-colors"
                        >
                          Reply
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Nested replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="ml-6 sm:ml-8 md:ml-10 mt-4 sm:mt-6 space-y-4 sm:space-y-6 border-l-2 border-gray-100 pl-3 sm:pl-4 md:pl-6">
                      {comment.replies.map((reply) => (
                        <div key={reply.id}>
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                              <img
                                src={reply.profiles.avatar_url || "/placeholder-avatar.png"}
                                alt={reply.profiles.full_name}
                                className="w-6 h-6 sm:w-8 sm:h-8 rounded-full object-cover"
                              />
                              <div>
                                <p className="font-medium text-sm sm:text-base">{reply.profiles.full_name}</p>
                                <p className="text-gray-500 text-xs">
                                  {new Date(reply.created_at).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            {currentUserId === reply.user_id && (
                              <button
                                onClick={() => handleDeleteComment(reply.id)}
                                className="text-red-500 text-xs sm:text-sm hover:text-red-600"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                          <p className="text-gray-700 text-sm sm:text-base">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* New Story Section */}
        {nextStory && (
          <NewStoryCard
            episodeNumber={nextStory.episode_number}
            title={nextStory.title}
            description={nextStory.description}
            imageSrc={nextStory.thumbnail_url || "/placeholder.svg"}
            storyId={nextStory.id}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black text-white py-3 xs:py-4 sm:py-6">
        <div className="max-w-6xl mx-auto px-3 xs:px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center gap-1 xs:gap-2 mb-2 xs:mb-3 md:mb-0">
            <div className="bg-white rounded p-0.5 xs:p-1">
              <HomeIcon className="h-2.5 w-2.5 xs:h-3 xs:w-3 sm:h-4 sm:w-4 text-black" />
            </div>
            <span className="text-xs xs:text-sm sm:text-base font-medium">Finding home</span>
          </div>
          <div className="text-center md:text-right text-[10px] xs:text-xs sm:text-sm">
            <p>Copyrighted 2024</p>
            <p>Designed by T. Noor</p>
          </div>
        </div>
      </footer>
    </div>
  )
} 