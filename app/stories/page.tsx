"use client"

import Link from "next/link"
import { HomeIcon, PlusCircle, Search, Baby, Trophy, Palette, Flag, Star, Plane, Heart, Users, Activity, X } from "lucide-react"
import { useState, useEffect } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import type { Database } from "@/lib/database.types"
import MainNav from "../components/MainNav"
import Footer from "../components/Footer"
import { useRouter } from "next/navigation"

// Icon data structure
const tagIcons = [
  { name: "Childhood", icon: "/icons/childhood.png" },
  { name: "Sports", icon: "/icons/sports.png" },
  { name: "Hobbies", icon: "/icons/hobbies.png" },
  { name: "War", icon: "/icons/war.png" },
  { name: "Pride", icon: "/icons/pride.png" },
  { name: "Travel", icon: "/icons/travel.png" },
  { name: "Grief", icon: "/icons/grief.png" },
  { name: "Family", icon: "/icons/family.png" },
  { name: "Health", icon: "/icons/health.png" },
  { name: "Milestones", icon: "/icons/milestones.png" },
  { name: "Reunion", icon: "/icons/reunion.png" },
  { name: "School", icon: "/icons/school.png" }
]

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
    tag_id: string
    tags: {
      name: string
      icon: string
    }
  }>
}

interface StoryWithTags {
  id: string
  story_tags: Array<{
    tags: {
      name: string
    }
  }>
}

// Function to get icon URL from Supabase storage
const getIconUrl = (iconName: string) => {
  const supabase = createClientComponentClient<Database>()
  const { data } = supabase.storage
    .from('icons')
    .getPublicUrl(iconName)
  return data.publicUrl
}

export default function StoriesPage() {
  const [selectedFilters, setSelectedFilters] = useState<string[]>([])
  const [stories, setStories] = useState<Story[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest" | "az">("recent")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [availableTags, setAvailableTags] = useState<Array<{ name: string; icon: string; iconUrl?: string }>>([])
  const storiesPerPage = 6
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const fetchStories = async () => {
    try {
      setIsLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/signin');
        return;
      }

      // Fetch the user's profile to get their relation
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('relation')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        return;
      }

      // Determine allowed visibility types based on user's relation
      let allowedVisibilities = [];
      if (profile.relation === 'spouse_or_child') {
        allowedVisibilities = ['spouse_or_child', 'parent_or_sibling', 'relative'];
      } else if (profile.relation === 'parent_or_sibling') {
        allowedVisibilities = ['parent_or_sibling', 'relative'];
      } else if (profile.relation === 'relative') {
        allowedVisibilities = ['relative'];
      } else {
        allowedVisibilities = [profile.relation];
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
          ),
          story_visibility:story_visibility(*)
        `, { count: 'exact' });

      // Apply visibility filter
      query = query.in('story_visibility.visibility_type', allowedVisibilities);

      // Apply search if query exists
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      // Apply filters if any are selected
      if (selectedFilters.length > 0) {
        console.log('Selected filters:', selectedFilters);
        
        try {
          // First get the tag IDs for the selected tag names
          const { data: tagData, error: tagError } = await supabase
            .from('tags')
            .select('id')
            .in('name', selectedFilters);

          if (tagError) {
            console.error('Error fetching tag IDs:', tagError);
            console.error('Tag error details:', {
              message: tagError.message,
              code: tagError.code,
              details: tagError.details,
              hint: tagError.hint
            });
            setError('Unable to fetch tags. Please try again.');
            return;
          }

          if (!tagData || tagData.length === 0) {
            console.log('No tags found for selected filters');
            setStories([]);
            setTotalCount(0);
            setTotalPages(1);
            return;
          }

          const tagIds = tagData.map(tag => tag.id);
          console.log('Found tag IDs:', tagIds);

          // Then get stories that have these tags
          const { data: storyTagData, error: storyTagError } = await supabase
            .from('story_tags')
            .select('story_id')
            .in('tag_id', tagIds);

          if (storyTagError) {
            console.error('Error fetching story tags:', storyTagError);
            console.error('Story tag error details:', {
              message: storyTagError.message,
              code: storyTagError.code,
              details: storyTagError.details,
              hint: storyTagError.hint
            });
            setError('Unable to fetch stories with selected tags. Please try again.');
            return;
          }

          if (!storyTagData || storyTagData.length === 0) {
            console.log('No stories found with selected tags');
            setStories([]);
            setTotalCount(0);
            setTotalPages(1);
            return;
          }

          const storyIds = [...new Set(storyTagData.map(st => st.story_id))];
          console.log('Found story IDs:', storyIds);

          // Build the query with proper joins and filters
          query = supabase
            .from('stories')
            .select(`
              *,
              story_tags!inner (
                tag_id,
                tags (
                  name,
                  icon
                )
              ),
              story_visibility:story_visibility(*)
            `, { count: 'exact' })
            .in('id', storyIds);

          // Apply visibility filter
          query = query.in('story_visibility.visibility_type', allowedVisibilities);

          // Apply search if query exists
          if (searchQuery) {
            query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
          }
        } catch (error) {
          console.error('Error in tag filtering:', error);
          setError('An error occurred while filtering stories. Please try again.');
          return;
        }
      } else {
        // If no filters are selected, use the default select
        query = supabase
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
            story_visibility:story_visibility(*)
          `, { count: 'exact' });

        // Apply visibility filter
        query = query.in('story_visibility.visibility_type', allowedVisibilities);

        // Apply search if query exists
        if (searchQuery) {
          query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
        }
      }

      // Apply sorting
      switch (sortOrder) {
        case "recent":
          query = query.order('created_at', { ascending: false });
          break;
        case "oldest":
          query = query.order('created_at', { ascending: true });
          break;
        case "az":
          query = query.order('title', { ascending: true });
          break;
      }

      // Apply pagination
      const start = (currentPage - 1) * storiesPerPage;
      query = query.range(start, start + storiesPerPage - 1);

      // Log the query parameters for debugging
      console.log('Query parameters:', {
        selectedFilters,
        sortOrder,
        start,
        end: start + storiesPerPage - 1
      });

      // Execute query
      const { data, error, count } = await query;

      if (error) {
        // Log sanitized error information
        const sanitizedError = {
          message: error.message,
          code: error.code,
          // Only include details and hint in development
          ...(process.env.NODE_ENV === 'development' && {
            details: error.details,
            hint: error.hint
          })
        };
        
        console.error('Error fetching stories:', sanitizedError);
        console.error('Full error object:', error);
        
        // Set user-friendly error message based on error type
        if (error.code === 'PGRST301') {
          setError('No stories found matching your criteria.');
        } else if (error.code === 'PGRST116') {
          setError('Unable to fetch stories. Please check your connection and try again.');
        } else {
          setError('Failed to fetch stories. Please try again later.');
        }
        
        // Clear stories to show error state
        setStories([]);
        setTotalCount(0);
        setTotalPages(1);
      } else if (data) {
        console.log('Fetched stories:', data.length);
        console.log('First story data:', data[0]);
        const storiesWithTags = data.map(story => ({
          ...story,
          tags: story.story_tags?.map((st: { tags: { name: string; icon: string } }) => ({
            name: st.tags.name,
            icon: st.tags.icon
          })) || []
        }));
        setStories(storiesWithTags);
        setTotalCount(count || 0);
        setTotalPages(Math.ceil((count || 0) / storiesPerPage));
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStories();
  }, [supabase, router, searchQuery, sortOrder, currentPage, selectedFilters]);

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const { data: tags, error } = await supabase
          .from('tags')
          .select('name, icon')
          .order('name')

        if (error) {
          console.error('Error fetching tags:', error)
          return
        }

        if (tags) {
          // Add icon paths to the tags
          const tagsWithIcons = tags.map(tag => {
            const tagIcon = tagIcons.find(t => t.name === tag.name)
            return {
              ...tag,
              iconUrl: tagIcon ? tagIcon.icon : '/icons/placeholder.png'
            }
          })
          setAvailableTags(tagsWithIcons)
        }
      } catch (error) {
        console.error('Error:', error)
      }
    }

    fetchTags()
  }, [supabase])

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
          <h1 className="text-4xl font-bold text-[#171415] mb-4 fraunces-500">
            All Stories
          </h1>

          {/* Error Message */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-600 newsreader-400">{error}</p>
              <button 
                onClick={() => {
                  setError(null);
                  fetchStories();
                }}
                className="mt-2 text-sm text-red-600 hover:text-red-700 newsreader-400"
              >
                Try again
              </button>
            </div>
          )}

          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-4 mb-8">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search stories..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setSearchQuery(searchInput);
                    setCurrentPage(1);
                  }
                }}
                className="w-full px-4 py-2 border border-[#e4d9cb] rounded-md focus:outline-none focus:ring-2 focus:ring-[#d97756] focus:border-transparent newsreader-400"
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center gap-2">
                {searchInput && (
                  <button
                    onClick={() => {
                      setSearchInput('');
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                    className="text-[#171415]/40 hover:text-[#d97756] transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
                <Search className="h-5 w-5 text-[#171415]/40" />
              </div>
            </div>
          </div>

          {/* Filter Tags */}
          <div className="flex flex-col gap-4 mb-12">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-[#171415] fraunces-500">Filter by tags</h3>
              {selectedFilters.length > 0 && (
                <button
                  onClick={resetFilters}
                  className="text-sm text-[#d97756] hover:text-[#b15e4e] newsreader-400 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
            {selectedFilters.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedFilters.map((filter) => (
                  <div
                    key={filter}
                    className="flex items-center gap-2 px-3 py-1.5 bg-[#171415] text-[#faf9f5] rounded-md text-sm newsreader-400"
                  >
                    <span>{filter}</span>
                    <button
                      onClick={() => toggleFilter(filter)}
                      className="hover:text-[#d97756] transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {availableTags.map((tag) => (
                <button
                  key={tag.name}
                  onClick={() => toggleFilter(tag.name)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md border text-sm newsreader-400 transition-colors ${
                    selectedFilters.includes(tag.name)
                      ? "bg-[#f8e8e3] border-[#d97756] text-[#171415]"
                      : "bg-white border-[#e4d9cb] text-[#171415] hover:bg-[#faf9f5]"
                  }`}
                >
                  <img 
                    src={tag.iconUrl} 
                    alt={`${tag.name} icon`}
                    className="w-4 h-4"
                    onError={(e) => {
                      console.error(`Failed to load icon for ${tag.name}:`, tag.iconUrl)
                      e.currentTarget.src = '/placeholder.svg' // Fallback image
                    }}
                  />
                  <span>{tag.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Stories Section */}
          <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-bold text-[#171415] fraunces-500">Browse the whole collection</h2>
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
                  No stories found{searchQuery ? ` matching "${searchQuery}"` : ''}{selectedFilters.length > 0 ? ` with selected filters` : ''}.
                </p>
              </div>
            ) : (
              stories.map((story) => (
                <Link 
                  key={story.id} 
                  href={`/stories/${story.id}`} 
                  className="relative group cursor-pointer rounded-md overflow-hidden transition-all duration-200"
                >
                  <div className="relative">
                    <img
                      src={story.thumbnail_url || "/placeholder.svg"}
                      alt={story.title}
                      className="w-full h-[360px] object-cover transition-all duration-300 group-hover:brightness-[0.85]"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-[#b15e4e]/90 p-6 group-hover:pl-10 flex flex-col justify-end transition-all duration-300">
                      <h3 className="text-white text-2xl sm:text-3xl md:text-4xl group-hover:text-2xl sm:group-hover:text-2xl md:group-hover:text-3xl font-bold mb-2 sm:mb-3 fraunces-400 transition-all duration-300">
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