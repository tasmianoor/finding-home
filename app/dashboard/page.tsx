"use client"

import Link from "next/link"
import { HomeIcon, PlusCircle, Bookmark, PenLine, BookOpen, User, Heart } from "lucide-react"
import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/database.types"
import { useRouter } from "next/navigation"
import MainNav from "../components/MainNav"
import Footer from "../components/Footer"

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

interface BookmarkJoin {
  story_id: string;
  stories: {
    id: string;
    title: string;
    description: string;
    episode_number: number;
    audio_url: string;
    thumbnail_url: string;
    transcript_question: string;
    transcript_answer: string;
    duration: number;
    is_published: boolean;
    view_count: number;
    created_at: string;
    updated_at: string;
    story_tags?: Array<{
      tags: {
        name: string;
        icon: string;
      }
    }>;
  };
}

export default function DashboardPage() {
  const [featuredStory, setFeaturedStory] = useState<Story | null>(null)
  const [recentStories, setRecentStories] = useState<Story[]>([])
  const [latestStories, setLatestStories] = useState<Story[]>([])
  const [bookmarkedStories, setBookmarkedStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalStories, setTotalStories] = useState(0)
  const storiesPerPage = 9
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()

  const toggleBookmark = async (e: React.MouseEvent, storyId: string) => {
    e.preventDefault() // Prevent navigation
    e.stopPropagation() // Prevent event bubbling

    try {
      const { data: { session }, error: authError } = await supabase.auth.getSession()
      if (authError || !session) {
        router.push('/signin')
        return
      }

      // Check if story is already bookmarked
      const { data: existingBookmark } = await supabase
        .from('bookmarks')
        .select()
        .eq('user_id', session.user.id)
        .eq('story_id', storyId)
        .single()

      if (existingBookmark) {
        // Remove bookmark
        await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', session.user.id)
          .eq('story_id', storyId)

        setBookmarkedStories(prev => prev.filter(story => story.id !== storyId))
      } else {
        // Add bookmark
        await supabase
          .from('bookmarks')
          .insert({
            user_id: session.user.id,
            story_id: storyId,
            created_at: new Date().toISOString()
          })

        // Add the story to bookmarked stories if it's not already there
        const storyToAdd = [...latestStories, ...recentStories].find(s => s.id === storyId)
        if (storyToAdd && !bookmarkedStories.some(s => s.id === storyId)) {
          setBookmarkedStories(prev => [...prev, storyToAdd])
        }
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error)
    }
  }

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        if (authError || !session) {
          return
        }

        // First get all stories ordered by creation date to establish episode numbers
        const { data: allStories } = await supabase
          .from('stories')
          .select('id, created_at')
          .order('created_at', { ascending: true })

        const episodeMap = new Map(
          allStories?.map((story, index) => [story.id, index + 1]) || []
        )

        // Fetch bookmarked stories
        console.log('Fetching bookmarks for user:', session.user.id)
        const { data, error: bookmarksError } = await supabase
          .from('bookmarks')
          .select(`
            story_id,
            stories (
              *,
              story_tags (
                tag_id,
                tags (
                  name,
                  icon
                )
              )
            )
          `)
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })

        if (bookmarksError) {
          console.error('Error fetching bookmarks:', bookmarksError)
          throw new Error(`Failed to fetch bookmarks: ${bookmarksError.message}`)
        } else if (data) {
          console.log('Bookmarks fetched successfully:', data)
          const bookmarks = data as unknown as BookmarkJoin[]
          const stories = bookmarks.map(bookmark => ({
            ...bookmark.stories,
            episode_number: episodeMap.get(bookmark.stories.id) || 0,
            tags: bookmark.stories.story_tags?.map(st => ({
              name: st.tags.name,
              icon: st.tags.icon
            })) || []
          }))
          setBookmarkedStories(stories)
        }

        // Fetch featured story (latest episode)
        const { data: featured, error: featuredError } = await supabase
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
          .order('created_at', { ascending: false })
          .limit(1)
          .single()

        if (featuredError) {
          console.error('Error fetching featured story:', {
            message: featuredError.message,
            details: featuredError.details,
            hint: featuredError.hint,
            code: featuredError.code
          })
          // Don't throw error, just log it and continue
        } else if (featured) {
          console.log('Featured story fetched successfully:', {
            id: featured.id,
            title: featured.title,
            has_tags: !!featured.story_tags?.length
          })
          const tags = featured.story_tags?.map((st: { tags: { name: string; icon: string } }) => ({
            name: st.tags.name,
            icon: st.tags.icon
          })) || []
          
          setFeaturedStory({ 
            ...featured, 
            episode_number: episodeMap.get(featured.id) || 0,
            tags 
          })
        } else {
          console.log('No featured story found')
        }

        // Fetch recent stories
        const { data: recent, error: recentError } = await supabase
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
          .order('updated_at', { ascending: false })
          .limit(2)

        if (recentError) {
          console.error('Error fetching recent stories:', {
            message: recentError.message,
            details: recentError.details,
            hint: recentError.hint,
            code: recentError.code
          })
          // Don't throw error, just log it and continue
        } else if (recent) {
          console.log('Recent stories fetched successfully:', {
            count: recent.length,
            first_story: recent[0]?.title
          })
          const storiesWithTags = recent.map(story => ({
            ...story,
            episode_number: episodeMap.get(story.id) || 0,
            tags: story.story_tags?.map((st: { tags: { name: string; icon: string } }) => ({
              name: st.tags.name,
              icon: st.tags.icon
            })) || []
          }))
          setRecentStories(storiesWithTags)
        } else {
          console.log('No recent stories found')
        }

        // Get total count of stories
        const { count } = await supabase
          .from('stories')
          .select('*', { count: 'exact', head: true })

        if (count !== null) {
          setTotalStories(count)
        }

        // Fetch latest stories with pagination
        const from = (currentPage - 1) * storiesPerPage
        const to = from + storiesPerPage - 1

        const { data: latest, error: latestError } = await supabase
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
          .order('created_at', { ascending: false })
          .range(from, to)

        if (latestError) {
          console.error('Error fetching latest stories:', latestError)
        } else if (latest) {
          const storiesWithTags = latest.map(story => ({
            ...story,
            episode_number: episodeMap.get(story.id) || 0,
            tags: story.story_tags?.map((st: { tags: { name: string; icon: string } }) => ({
              name: st.tags.name,
              icon: st.tags.icon
            })) || []
          }))
          setLatestStories(storiesWithTags)
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStories()
  }, [supabase, currentPage])

  const totalPages = Math.ceil(totalStories / storiesPerPage)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f5] flex flex-col">
        <MainNav />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#d97756]"></div>
        </main>
        <Footer />
      </div>
    )
  }

  // If there are no stories at all, show the empty state
  if (!featuredStory && recentStories.length === 0 && latestStories.length === 0) {
    return (
      <div className="min-h-screen bg-[#faf9f5]">
        <MainNav />
        <main className="pt-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20 lg:py-24">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-[#faf9f5] rounded-full mb-6">
                <Heart className="h-8 w-8 text-[#d97756]" />
              </div>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#171415] mb-4 fraunces-500">
                Welcome to the family
              </h2>
              <p className="text-base sm:text-lg text-[#171415] mb-8 max-w-2xl mx-auto newsreader-400">
                As you explore stories, bookmark your favorites, and add your own memories, this space will come alive with your journey. Each interaction helps weave your unique thread into our family's tapestry.
              </p>
            </div>

            {/* Story cards grid */}
            <div className="mt-16 sm:mt-20">
              <h3 className="text-lg sm:text-xl font-semibold text-[#171415] mb-6 text-center newsreader-500">
                Explore our stories
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {[
                  {
                    title: "Your Profile",
                    description: "View and manage your profile settings. Keep your information up to date to stay connected with the family.",
                    icon: <User className="h-5 w-5 text-[#d97756] mb-2" />,
                    link: "/profile"
                  },
                  {
                    title: "Family Stories",
                    description: "Discover and listen to stories shared by family members. Each story is a unique piece of our family's history.",
                    icon: <BookOpen className="h-5 w-5 text-[#d97756] mb-2" />,
                    link: "/stories"
                  },
                  {
                    title: "Add Memories",
                    description: "Share your own stories and memories with the family. Your experiences help build our collective history.",
                    icon: <PenLine className="h-5 w-5 text-[#d97756] mb-2" />,
                    link: "/add-memories"
                  }
                ].map((card, index) => (
                  <Link 
                    key={index}
                    href={card.link}
                    className="block bg-white p-6 rounded-lg shadow-md hover:shadow-lg border border-[#e4d9cb] hover:border-[#d97756] transition-all duration-200 group hover:-translate-y-1 hover:bg-[#faf9f5]"
                  >
                    {card.icon}
                    <h4 className="font-medium text-[#171415] mb-2 newsreader-500 group-hover:text-[#d97756] transition-colors">{card.title}</h4>
                    <p className="text-[#171415] text-sm newsreader-400 group-hover:text-[#171415]/80">{card.description}</p>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf9f5] flex flex-col">
      <MainNav />
      <main className="flex-1">
        {featuredStory && (
          <section className="bg-[#faf9f5] py-8 sm:py-12 md:py-16">
            <div className="max-w-6xl mx-auto px-4 sm:px-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-center">
                <div className="space-y-4 sm:space-y-6">
                  <div className="inline-block bg-[#faf9f5] px-3 sm:px-4 py-1 rounded-md">
                    <span className="font-medium text-[#d97756] text-sm sm:text-base newsreader-500">NEW STORY</span>
                  </div>
                  <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#171415] fraunces-500">
                    Episode {featuredStory.episode_number}:
                    <br />
                    {featuredStory.title}
                  </h1>
                  <p className="text-base sm:text-lg text-[#171415] max-w-lg newsreader-400">
                    {featuredStory.description}
                  </p>
                  <Link 
                    href={`/stories/${featuredStory.id}`}
                    className="inline-block bg-[#171415] hover:bg-[#171415]/90 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-md transition-colors text-sm sm:text-base instrument-400"
                  >
                    Listen now
                  </Link>
                </div>
                <div className="relative mt-6 lg:mt-0">
                  <div className="bg-[#faf9f5] absolute inset-0 rounded-lg transform translate-x-2 sm:translate-x-4 translate-y-2 sm:translate-y-4"></div>
                  <img
                    src={featuredStory.thumbnail_url || "/placeholder.svg"}
                    alt={featuredStory.title}
                    className="relative z-10 rounded-md w-[450px] h-[450px] object-cover"
                  />
                </div>
              </div>
            </div>
          </section>
        )}

        {recentStories.length > 0 && (
          <section className="bg-white py-12">
            <div className="max-w-6xl mx-auto px-6">
              <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 md:mb-12 text-[#171415] fraunces-500">Pick up where you left off</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                {recentStories.map((story) => (
                  <Link key={story.id} href={`/stories/${story.id}`} className="relative group cursor-pointer rounded-md overflow-hidden transition-all duration-200">
                    <div className="absolute top-3 right-3 z-10">
                      <Bookmark 
                        className="h-5 w-5 text-white cursor-pointer" 
                        fill={bookmarkedStories.some(b => b.id === story.id) ? "currentColor" : "none"}
                        onClick={(e) => toggleBookmark(e, story.id)}
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
                        <p className="text-white text-base sm:text-lg mb-3 sm:mb-4 newsreader-400 line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
                          {story.description}
                        </p>
                        <p className="text-white/80 text-xs sm:text-sm mb-2 sm:mb-3 newsreader-400">
                          {new Date(story.created_at).toLocaleDateString('en-US', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                        <div className="h-1.5 bg-gray-300/30 rounded-full w-full">
                          <div className="h-full bg-[#d97756] rounded-full w-[80%]"></div>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {bookmarkedStories.length > 0 && (
          <section className="bg-[#faf9f5] py-12">
            <div className="max-w-6xl mx-auto px-6">
              <h2 className="text-3xl sm:text-4xl font-bold mb-8 sm:mb-12 md:mb-16 text-[#171415] fraunces-500">Saved by you</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {bookmarkedStories.map((story) => (
                  <Link key={story.id} href={`/stories/${story.id}`} className="relative group cursor-pointer rounded-md overflow-hidden transition-all duration-200">
                    <div className="absolute top-3 right-3 z-10">
                      <Bookmark 
                        className="h-5 w-5 text-white cursor-pointer" 
                        fill="currentColor"
                        onClick={(e) => toggleBookmark(e, story.id)}
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
                        <p className="text-white text-base sm:text-lg mb-3 sm:mb-4 newsreader-400 line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
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
          </section>
        )}

        {latestStories.length > 0 && (
          <section className="bg-white py-12">
            <div className="max-w-6xl mx-auto px-6">
              <div className="mb-12">
                <div className="flex justify-between items-end mb-6 sm:mb-8">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#171415] fraunces-500">Latest Buzz</h2>
                  <p className="text-sm text-[#171415] newsreader-400">
                    Showing {latestStories.length} of {totalStories} stories
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {latestStories.map((story) => (
                    <Link key={story.id} href={`/stories/${story.id}`} className="relative group cursor-pointer rounded-md overflow-hidden transition-all duration-200">
                      <div className="absolute top-3 right-3 z-10">
                        <Bookmark 
                          className="h-5 w-5 text-white cursor-pointer" 
                          fill={bookmarkedStories.some(b => b.id === story.id) ? "currentColor" : "none"}
                          onClick={(e) => toggleBookmark(e, story.id)}
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
                          <p className="text-white text-base sm:text-lg mb-3 sm:mb-4 newsreader-400 line-clamp-2 group-hover:line-clamp-none transition-all duration-300">
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
                {totalPages > 1 && (
                  <div className="mt-8 flex justify-center gap-2">
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className={`px-4 py-2 rounded-md text-sm transition-colors instrument-400 ${
                        currentPage === 1
                          ? 'bg-[#faf9f5] text-[#171415]/40 cursor-not-allowed'
                          : 'bg-white text-[#171415] hover:bg-[#faf9f5] border border-[#e4d9cb] hover:border-[#171415]'
                      }`}
                    >
                      Previous
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-4 py-2 rounded-md text-sm transition-colors instrument-400 ${
                          currentPage === page
                            ? 'bg-[#171415] text-white hover:bg-[#171415]/90'
                            : 'bg-white text-[#171415] hover:bg-[#faf9f5] border border-[#e4d9cb] hover:border-[#171415]'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className={`px-4 py-2 rounded-md text-sm transition-colors instrument-400 ${
                        currentPage === totalPages
                          ? 'bg-[#faf9f5] text-[#171415]/40 cursor-not-allowed'
                          : 'bg-white text-[#171415] hover:bg-[#faf9f5] border border-[#e4d9cb] hover:border-[#171415]'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </div>
              <div className="mt-8 flex justify-center">
                <Link 
                  href="/stories" 
                  className="inline-block border-2 border-[#171415] text-[#171415] px-6 py-3 rounded-md transition-colors hover:bg-[#faf9f5] instrument-400"
                >
                  Browse all stories
                </Link>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}
