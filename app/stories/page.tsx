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
  { name: "Childhood", icon: "baby.svg", component: <Baby className="h-4 w-4 text-[#d97756]" /> },
  { name: "Sports", icon: "trophy.svg", component: <Trophy className="h-4 w-4 text-[#d97756]" /> },
  { name: "Hobbies & Interests", icon: "palette.svg", component: <Palette className="h-4 w-4 text-[#d97756]" /> },
  { name: "Liberation war", icon: "flag.svg", component: <Flag className="h-4 w-4 text-[#d97756]" /> },
  { name: "Proud moments", icon: "star.svg", component: <Star className="h-4 w-4 text-[#d97756]" /> },
  { name: "Travel", icon: "plane.svg", component: <Plane className="h-4 w-4 text-[#d97756]" /> },
  { name: "Grief", icon: "heart.svg", component: <Heart className="h-4 w-4 text-[#d97756]" /> },
  { name: "Family", icon: "users.svg", component: <Users className="h-4 w-4 text-[#d97756]" /> },
  { name: "Health", icon: "activity.svg", component: <Activity className="h-4 w-4 text-[#d97756]" /> },
]

// Function to upload icons to Supabase storage
const uploadIcons = async () => {
  const supabase = createClientComponentClient<Database>()
  
  try {
    // Check if user is authenticated
    const { data: { session }, error: authError } = await supabase.auth.getSession()
    if (authError || !session) {
      console.error('Not authenticated:', authError)
      return
    }

    // Create icons bucket if it doesn't exist
    const { data: buckets, error: bucketsError } = await supabase
      .storage
      .listBuckets()

    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError)
      return
    }

    const iconsBucket = buckets.find(b => b.name === 'icons')
    if (!iconsBucket) {
      const { error: createError } = await supabase
        .storage
        .createBucket('icons', {
          public: true,
          fileSizeLimit: 1024 * 1024, // 1MB
          allowedMimeTypes: ['image/svg+xml']
        })

      if (createError) {
        console.error('Error creating icons bucket:', createError)
        return
      }
    }

    // Upload each icon
    for (const tag of tagIcons) {
      const { error: uploadError } = await supabase
        .storage
        .from('icons')
        .upload(tag.icon, tag.icon, {
          contentType: 'image/svg+xml',
          upsert: true
        })

      if (uploadError) {
        console.error(`Error uploading ${tag.icon}:`, uploadError)
      }
    }

    console.log('Icons uploaded successfully')
  } catch (error) {
    console.error('Error in uploadIcons:', error)
  }
}

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
  const [searchInput, setSearchInput] = useState("")
  const [sortOrder, setSortOrder] = useState<"recent" | "oldest" | "az">("recent")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [availableTags, setAvailableTags] = useState<Array<{ name: string; icon: string }>>([])
  const storiesPerPage = 6
  const supabase = createClientComponentClient<Database>()
  const router = useRouter()

  useEffect(() => {
    // Upload icons when component mounts
    uploadIcons()
  }, [])

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
          setAvailableTags(tags)
        }
      } catch (error) {
        console.error('Error:', error)
      }
    }

    fetchTags()
  }, [supabase])

  useEffect(() => {
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
          // Get stories that have any of the selected tags
          const { data: storiesWithTags, error: tagError } = await supabase
            .from('stories')
            .select(`
              id,
              story_tags!inner (
                tags!inner (
                  name
                )
              )
            `)
            .in('story_tags.tags.name', selectedFilters);

          if (tagError) {
            console.error('Error fetching stories with tags:', tagError);
          } else if (storiesWithTags) {
            const storyIds = storiesWithTags.map(story => story.id);
            console.log('Found stories with selected tags:', storyIds);
            
            if (storyIds.length > 0) {
              query = query.in('id', storyIds);
            } else {
              // If no stories have the selected tags, return empty result
              query = query.eq('id', 'no-matches');
            }
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

        // Execute query
        const { data, error, count } = await query;

        if (error) {
          console.error('Error fetching stories:', error);
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
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

    fetchStories();
  }, [supabase, router, searchQuery, sortOrder, currentPage, selectedFilters]);

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
                      ? "bg-[#171415] border-[#171415] text-[#faf9f5]"
                      : "bg-white border-[#e4d9cb] text-[#171415] hover:bg-[#faf9f5]"
                  }`}
                >
                  {tag.icon && <span className="text-[#d97756]">{tag.icon}</span>}
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