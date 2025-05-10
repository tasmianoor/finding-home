"use client"

import Link from "next/link"
import { HomeIcon, PlusCircle, Search, Trash2 } from "lucide-react"
import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/database.types"
import MainNav from "../components/MainNav"
import Footer from "../components/Footer"

// Debounce helper function
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

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

export default function StoriesPage() {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const debouncedSearchQuery = useDebounce(searchQuery, 300) // 300ms delay
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest" | "az">("recent")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const storiesPerPage = 6
  const supabase = createClientComponentClient<Database>()

  useEffect(() => {
    const fetchStories = async () => {
      try {
        setIsLoading(true)
        
        // Check if user is authenticated
        const { data: { session }, error: authError } = await supabase.auth.getSession()
        if (authError || !session) {
          console.error('Not authenticated:', authError)
          return
        }

        // Build the query
        let query = supabase
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
          `, { count: 'exact' })

        // Apply search if query exists
        if (debouncedSearchQuery) {
          query = query.or(`title.ilike.%${debouncedSearchQuery}%,description.ilike.%${debouncedSearchQuery}%`)
        }

        // Apply filters if any are selected
        if (selectedFilters.length > 0) {
          query = query.in(
            'story_tags.tags.name',
            selectedFilters
          )
        }

        // Apply sorting
        switch (sortOrder) {
          case "recent":
            query = query.order('created_at', { ascending: false })
            break
          case "oldest":
            query = query.order('created_at', { ascending: true })
            break
          case "az":
            query = query.order('title', { ascending: true })
            break
        }

        // Apply pagination
        const start = (currentPage - 1) * storiesPerPage
        query = query.range(start, start + storiesPerPage - 1)

        // Execute query
        const { data, error, count } = await query

        if (error) {
          console.error('Error fetching stories:', error)
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          })
        } else if (data) {
          console.log('Fetched stories:', data.length)
          const storiesWithTags = data.map(story => ({
            ...story,
            tags: story.story_tags?.map((st: { tags: { name: string; icon: string } }) => ({
              name: st.tags.name,
              icon: st.tags.icon
            })) || []
          }))
          setStories(storiesWithTags)
          setTotalCount(count || 0)
          setTotalPages(Math.ceil((count || 0) / storiesPerPage))
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStories()
  }, [supabase, debouncedSearchQuery, sortOrder, currentPage, selectedFilters])

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSortOrder(e.target.value as "recent" | "oldest" | "az")
    setCurrentPage(1) // Reset to first page when changing sort order
  }

  const toggleFilter = (filter: string) => {
    if (selectedFilters.includes(filter)) {
      setSelectedFilters(selectedFilters.filter((f) => f !== filter))
    } else {
      setSelectedFilters([...selectedFilters, filter])
    }
    setCurrentPage(1) // Reset to first page when changing filters
  }

  const resetFilters = () => {
    setSelectedFilters([])
    setCurrentPage(1)
  }

  const handleDelete = async (e: React.MouseEvent, storyId: string) => {
    e.preventDefault() // Prevent navigation to story detail
    
    if (!window.confirm('Are you sure you want to delete this story? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('stories')
        .delete()
        .eq('id', storyId)

      if (error) {
        console.error('Error deleting story:', error)
        return
      }

      // Remove the story from the local state
      setStories(stories.filter(story => story.id !== storyId))
      
      // If we're on a page that would now be empty, go back one page
      if (stories.length === 1 && currentPage > 1) {
        setCurrentPage(prev => prev - 1)
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f5]">
        <MainNav />
        <main className="pt-16">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
            <div className="text-center">
              <p className="text-[#171415] newsreader-400">Loading...</p>
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
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          <h1 className="text-4xl font-bold text-[#171415] mb-8 newsreader-500">
            All Stories
          </h1>

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search stories..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full px-4 py-2 border border-[#e4d9cb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#d97756] focus:border-transparent newsreader-400"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#171415]/40">
                <Search className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Filter Tags */}
          <div className="flex flex-col gap-4 mb-12">
            {selectedFilters.length > 0 && (
              <p className="text-sm text-[#171415]/60 newsreader-400">
                Active filters: {selectedFilters.length}
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              {[
                { name: "Childhood", icon: "👶" },
                { name: "Sports", icon: "🏆" },
                { name: "Hobbies & Interests", icon: "🎨" },
                { name: "Liberation war", icon: "🏳️" },
                { name: "Proud moments", icon: "🌟" },
                { name: "Travel", icon: "✈️" },
                { name: "Grief", icon: "💔" },
                { name: "Family", icon: "👨‍👩‍👧‍👦" },
                { name: "Health", icon: "❤️" },
              ].map((filter) => (
                <button
                  key={filter.name}
                  onClick={() => toggleFilter(filter.name)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md border text-sm newsreader-400 ${
                    selectedFilters.includes(filter.name)
                      ? "bg-[#171415] border-[#171415] text-[#faf9f5]"
                      : "bg-white border-[#e4d9cb] text-[#171415] hover:bg-[#faf9f5]"
                  } transition-colors`}
                >
                  <span>{filter.icon}</span>
                  <span>{filter.name}</span>
                </button>
              ))}
              {selectedFilters.length > 0 && (
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-2 px-4 py-2 rounded-md border border-[#d97756] bg-[#d97756] text-[#faf9f5] hover:bg-[#d97756]/90 text-sm newsreader-400 transition-colors"
                >
                  <span>Reset Filters</span>
                </button>
              )}
            </div>
          </div>

          {/* Stories Section */}
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold text-[#171415] newsreader-500">Stories</h2>
              <p className="text-sm text-[#171415]/60 newsreader-400">
                Showing {stories.length} of {totalCount} stories
              </p>
            </div>
            <div className="relative">
              <select 
                value={sortOrder}
                onChange={handleSortChange}
                className="appearance-none bg-white border border-[#e4d9cb] rounded-md py-2 pl-4 pr-10 focus:outline-none focus:ring-2 focus:ring-[#d97756] focus:border-transparent text-sm newsreader-400"
              >
                <option value="recent">Most recent</option>
                <option value="oldest">Oldest first</option>
                <option value="az">A-Z</option>
              </select>
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <svg
                  className="h-4 w-4 text-[#171415]/40"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Story Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <p className="text-[#171415]/60 newsreader-400">
                  No stories found{debouncedSearchQuery ? ` matching "${debouncedSearchQuery}"` : ''}{selectedFilters.length > 0 ? ` with selected filters` : ''}.
                </p>
              </div>
            ) : (
              stories.map((story) => (
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
                    <button
                      onClick={(e) => handleDelete(e, story.id)}
                      className="absolute top-2 right-2 p-2 bg-[#d97756] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-[#d97756]/90"
                      aria-label="Delete story"
                    >
                      <Trash2 className="h-4 w-4 text-white" />
                    </button>
                  </div>
                  <div className="mt-2 text-sm text-[#171415]/60 newsreader-400">
                    {new Date(story.created_at).toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </div>
                </Link>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-12 flex justify-center">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className={`w-10 h-10 flex items-center justify-center rounded-md border text-sm newsreader-400 ${
                    currentPage === 1 
                      ? 'border-[#e4d9cb] bg-[#faf9f5] text-[#171415]/40 cursor-not-allowed' 
                      : 'border-[#e4d9cb] bg-white text-[#171415] hover:bg-[#faf9f5]'
                  }`}
                >
                  &lt;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 flex items-center justify-center rounded-md border text-sm newsreader-400 ${
                      currentPage === page
                        ? 'border-[#171415] bg-[#171415] text-[#faf9f5]'
                        : 'border-[#e4d9cb] bg-white text-[#171415] hover:bg-[#faf9f5]'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className={`w-10 h-10 flex items-center justify-center rounded-md border text-sm newsreader-400 ${
                    currentPage === totalPages 
                      ? 'border-[#e4d9cb] bg-[#faf9f5] text-[#171415]/40 cursor-not-allowed' 
                      : 'border-[#e4d9cb] bg-white text-[#171415] hover:bg-[#faf9f5]'
                  }`}
                >
                  &gt;
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}