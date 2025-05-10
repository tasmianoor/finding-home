# Finding Home

A beautiful, modern web application for sharing and preserving family stories through multimedia content. Built with Next.js, Supabase, and TailwindCSS.

## Overview

Finding Home is a platform designed to help families preserve and share their stories across generations. It allows family members to upload, view, and interact with stories in various media formats (audio, video, or images), complete with transcripts, comments, and social features.

## Features

### Authentication & User Management
- Secure authentication using Supabase Auth
- User profiles with avatars and family relationship information
- Family member verification system

### Story Management
1. **Story Creation**
   - Support for multiple media types:
     - Audio stories with custom player
     - Video stories with native player
     - Image-based stories
   - Rich text transcripts
   - Tagging system for categorization
   - Episode numbering for sequential storytelling

2. **Story Viewing**
   - Responsive media player with:
     - Play/pause controls
     - 10-second forward/rewind
     - Progress bar with seek functionality
     - Duration display
   - Transcript display
   - Dynamic episode navigation

### Interactive Features

1. **Comments System**
   - Threaded comments with replies
   - Real-time updates
   - Delete functionality for own comments
   - Rich text formatting
   - User avatars and timestamps

2. **Social Features**
   - Story bookmarking
   - Like/unlike functionality
   - Share functionality
   - View counts
   - "New Story" badges for recent content

3. **Navigation**
   - "Up Next" feature showing the next episode
   - Chronological story ordering
   - Easy navigation between episodes
   - Breadcrumb navigation

### User Interface
- Responsive design for all screen sizes
- Beautiful, modern UI with TailwindCSS
- Smooth animations and transitions
- Loading states and error handling
- Accessibility features

## Technical Architecture

### Frontend
- **Framework**: Next.js 13+ with App Router
- **Styling**: TailwindCSS
- **State Management**: React Hooks
- **Components**: Custom-built React components

### Backend (Supabase)
1. **Database Tables**:
   - `profiles`: User information and family relationships
   - `stories`: Story content and metadata
   - `comments`: Threaded comment system
   - `bookmarks`: User story bookmarks
   - `likes`: Story likes tracking
   - `story_tags`: Story categorization
   - `tags`: Available story categories

2. **Security**:
   - Row Level Security (RLS) policies
   - Protected routes
   - Secure file storage
   - User authentication

### Media Handling
- Supports multiple media formats
- Efficient media loading
- Custom audio player implementation
- Responsive image handling

## Component Structure

### Key Components

1. **StoryContent**
   - Main story viewing component
   - Handles media playback
   - Manages comments and interactions
   - Features:
     - Media player controls
     - Comment system
     - Social interactions
     - Next story navigation

2. **NewStoryCard**
   - Displays next episode preview
   - Features:
     - Episode number
     - Title and description
     - Thumbnail image
     - Smooth hover effects

3. **Dashboard**
   - Home page layout
   - Story organization
   - Featured content
   - Recent activity

## Database Schema

### Core Tables

```sql
-- User Profiles
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    is_family_verified BOOLEAN,
    relationship_to_author TEXT
);

-- Stories
CREATE TABLE stories (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES profiles,
    title TEXT,
    description TEXT,
    episode_number INTEGER,
    audio_url TEXT,
    video_url TEXT,
    thumbnail_url TEXT,
    transcript_question TEXT,
    transcript_answer TEXT,
    duration INTEGER,
    is_published BOOLEAN,
    view_count INTEGER
);

-- Comments
CREATE TABLE comments (
    id UUID PRIMARY KEY,
    story_id UUID REFERENCES stories,
    user_id UUID REFERENCES profiles,
    parent_id UUID REFERENCES comments,
    content TEXT,
    created_at TIMESTAMP
);
```

## Detailed Implementation

### Pages Structure

1. **Dashboard (`app/dashboard/page.tsx`)**
   ```typescript
   // Key features:
   - Displays stories in categories: Featured, Latest Buzz, Recent
   - Implements bookmarking functionality
   - Dynamic episode numbering based on creation order
   - Real-time story filtering and sorting
   ```
   
   **Key Functions:**
   - `fetchStories()`: Retrieves stories with proper ordering and filtering
   - `toggleBookmark()`: Handles story bookmarking
   - `useEffect`: Manages real-time updates and data fetching

2. **Story View (`app/stories/[id]/page.tsx` & `StoryContent.tsx`)**
   ```typescript
   // Core functionality:
   - Media playback (audio/video/image)
   - Comments and replies
   - Social interactions (likes, bookmarks)
   - Next story navigation
   ```

   **Key Components:**
   - `MediaPlayer`: Handles different media types
   - `CommentSection`: Manages threaded comments
   - `SocialInteractions`: Handles likes and bookmarks
   - `NextStory`: Shows the next episode

3. **Stories List (`app/stories/page.tsx`)**
   ```typescript
   // Features:
   - Story grid with filtering
   - Search functionality
   - Tag-based filtering
   - Pagination
   ```

   **Key Functions:**
   - `fetchStories()`: Gets filtered stories
   - `handleSearch()`: Real-time search with debounce
   - `handleFilter()`: Applies tag and date filters
   - `handlePagination()`: Manages page navigation

### Component Details

1. **StoryContent Component**
   ```typescript
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
     profiles?: {
       username: string
       full_name: string
       avatar_url: string | null
     }
   }

   // Key features:
   - Media playback controls
   - Progress tracking
   - Comment management
   - Social interactions
   ```

   **Functions:**
   ```typescript
   // Media Control
   handleTimeUpdate(): void
   handleLoadedMetadata(): void
   handleProgressClick(e: React.MouseEvent): void
   togglePlay(): void
   forward(): void
   rewind(): void

   // Social Interactions
   toggleBookmark(): Promise<void>
   toggleLike(): Promise<void>
   handleCommentSubmit(e: React.FormEvent): Promise<void>
   handleReplySubmit(parentId: string): Promise<void>
   handleDeleteComment(commentId: string): Promise<void>
   ```

2. **NewStoryCard Component**
   ```typescript
   interface NewStoryCardProps {
     episodeNumber: number
     title: string
     description: string
     imageSrc: string
     storyId: string
   }

   // Features:
   - Dynamic episode display
   - Responsive image handling
   - Interactive hover effects
   - Navigation to next story
   ```

3. **CommentSection Component**
   ```typescript
   interface Comment {
     id: string
     content: string
     user_id: string
     parent_id: string | null
     created_at: string
     profiles: {
       username: string
       full_name: string
       avatar_url: string | null
     }
     replies?: Comment[]
   }

   // Features:
   - Threaded comments
   - Reply functionality
   - Delete options
   - Real-time updates
   ```

### Database Operations

1. **Story Operations**
   ```sql
   -- Fetch stories with filters
   SELECT s.*, 
          array_agg(t.*) as tags,
          count(b.*) as bookmark_count
   FROM stories s
   LEFT JOIN story_tags st ON s.id = st.story_id
   LEFT JOIN tags t ON st.tag_id = t.id
   LEFT JOIN bookmarks b ON s.id = b.story_id
   WHERE s.is_published = true
   GROUP BY s.id
   ORDER BY s.created_at DESC;

   -- Update story view count
   UPDATE stories 
   SET view_count = view_count + 1 
   WHERE id = :story_id;
   ```

2. **Comment Operations**
   ```sql
   -- Fetch threaded comments
   WITH RECURSIVE comment_tree AS (
     SELECT c.*, 1 as level
     FROM comments c
     WHERE parent_id IS NULL
     
     UNION ALL
     
     SELECT c.*, ct.level + 1
     FROM comments c
     JOIN comment_tree ct ON c.parent_id = ct.id
   )
   SELECT * FROM comment_tree
   ORDER BY level, created_at;
   ```

3. **Social Interactions**
   ```sql
   -- Toggle bookmark
   INSERT INTO bookmarks (user_id, story_id)
   VALUES (:user_id, :story_id)
   ON CONFLICT (user_id, story_id)
   DO DELETE;

   -- Toggle like
   INSERT INTO likes (user_id, story_id)
   VALUES (:user_id, :story_id)
   ON CONFLICT (user_id, story_id)
   DO DELETE;
   ```

### State Management

1. **Global State**
   ```typescript
   // User authentication state
   const [session, setSession] = useState<Session | null>(null)
   
   // Story viewing state
   const [currentStory, setCurrentStory] = useState<Story | null>(null)
   const [isPlaying, setIsPlaying] = useState(false)
   const [currentTime, setCurrentTime] = useState(0)
   ```

2. **Local Component State**
   ```typescript
   // Comment state
   const [comments, setComments] = useState<Comment[]>([])
   const [replyingTo, setReplyingTo] = useState<string | null>(null)
   
   // Filter state
   const [activeFilters, setActiveFilters] = useState<string[]>([])
   const [searchQuery, setSearchQuery] = useState("")
   ```

### Security Implementation

1. **Row Level Security (RLS)**
   ```sql
   -- Story access policy
   CREATE POLICY "Stories are viewable by verified family members"
   ON stories FOR SELECT
   USING (EXISTS (
       SELECT 1 FROM profiles
       WHERE id = auth.uid() AND is_family_verified = true
   ));

   -- Comment management policy
   CREATE POLICY "Users can manage own comments"
   ON comments
   USING (auth.uid() = user_id);
   ```

2. **Authentication Flow**
   ```typescript
   // Sign in with email
   const { data, error } = await supabase.auth.signInWithPassword({
     email: email,
     password: password,
   })

   // Protected route wrapper
   const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
     const { session } = useSession()
     if (!session) return <RedirectToLogin />
     return <>{children}</>
   }
   ```

### Media Handling

1. **Upload Process**
   ```typescript
   // File upload to Supabase storage
   const uploadMedia = async (file: File) => {
     const fileExt = file.name.split('.').pop()
     const fileName = `${Math.random()}.${fileExt}`
     const filePath = `${user.id}/${fileName}`
     
     const { data, error } = await supabase.storage
       .from('media')
       .upload(filePath, file)
   }
   ```

2. **Media Player Implementation**
   ```typescript
   // Custom audio player controls
   const audioRef = useRef<HTMLAudioElement>(null)
   const progressRef = useRef<HTMLDivElement>(null)

   const handleTimeUpdate = () => {
     if (audioRef.current) {
       setCurrentTime(audioRef.current.currentTime)
     }
   }

   const handleProgressClick = (e: React.MouseEvent) => {
     const rect = progressRef.current?.getBoundingClientRect()
     const percent = (e.clientX - rect!.left) / rect!.width
     if (audioRef.current) {
       audioRef.current.currentTime = percent * audioRef.current.duration
     }
   }
   ```

### Error Handling

1. **Global Error Boundary**
   ```typescript
   class ErrorBoundary extends React.Component {
     state = { hasError: false, error: null }
     
     static getDerivedStateFromError(error) {
       return { hasError: true, error }
     }
     
     render() {
       if (this.state.hasError) {
         return <ErrorDisplay error={this.state.error} />
       }
       return this.props.children
     }
   }
   ```

2. **API Error Handling**
   ```typescript
   const handleApiError = (error: any) => {
     if (error.code === 'PGRST301') {
       // Handle authentication error
       router.push('/signin')
     } else if (error.code === 'PGRST404') {
       // Handle not found error
       setNotFound(true)
     } else {
       // Handle general errors
       console.error('API Error:', error)
       toast.error('An unexpected error occurred')
     }
   }
   ```

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/finding-home.git
cd finding-home
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```
Edit `.env.local` with your Supabase credentials.

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

### Environment Variables
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Usage

### Adding Stories
1. Navigate to "Add your own memories"
2. Upload media (audio, video, or image)
3. Add title, description, and transcript
4. Select relevant tags
5. Publish the story

### Interacting with Stories
1. Play/pause media using the custom controls
2. Leave comments and replies
3. Bookmark stories for later
4. Like stories to show appreciation
5. Share stories with family members

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Design and concept by T. Noor
- Built with love for preserving family histories
- Special thanks to all contributors and family members who shared their stories 