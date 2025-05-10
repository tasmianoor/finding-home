# Building Modern Web Applications: A Practical Guide
## Using Finding Home as a Case Study

### Course Overview
This guide uses the Finding Home project to teach modern web development concepts. We'll explore how to build a full-featured web application from scratch using Next.js, Supabase, and TailwindCSS.

## Module 1: Project Setup & Architecture

### Lesson 1: Understanding the Tech Stack
- **Next.js**: Modern React framework for production
  - Why Next.js?
    - Server-side rendering
    - File-based routing
    - API routes built-in
    - Optimized performance
  
- **Supabase**: Open-source Firebase alternative
  - Features we use:
    - Authentication
    - Database (PostgreSQL)
    - Storage for media files
    - Real-time subscriptions

- **TailwindCSS**: Utility-first CSS framework
  - Benefits:
    - Rapid UI development
    - Consistent design system
    - Mobile-first responsive design

### Lesson 2: Project Structure
```
finding-home/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard page
│   ├── stories/          # Stories listing and viewing
│   └── layout.tsx        # Root layout
├── components/            # Reusable components
├── lib/                   # Utilities and types
└── public/               # Static assets
```

## Module 2: Building the Foundation

### Lesson 1: Authentication System
```typescript
// Example: Setting up Supabase auth
const { data: { session }, error } = await supabase.auth.signInWithPassword({
  email: email,
  password: password
})

// Protected route wrapper
function ProtectedRoute({ children }) {
  const { session } = useSession()
  if (!session) return <RedirectToLogin />
  return children
}
```

### Lesson 2: Database Design
Learn how to structure your database for scalability:

```sql
-- Example: Core tables structure
CREATE TABLE profiles (
    id UUID PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT
);

CREATE TABLE stories (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES profiles,
    title TEXT,
    description TEXT
);
```

## Module 3: Building Interactive Features

### Lesson 1: Custom Media Player
```typescript
// Basic audio player implementation
function AudioPlayer() {
  const [isPlaying, setIsPlaying] = useState(false)
  const audioRef = useRef(null)

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }

  return (
    <div>
      <audio ref={audioRef} src={audioUrl} />
      <button onClick={togglePlay}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  )
}
```

### Lesson 2: Comments System
Learn how to implement threaded comments:

```typescript
// Comment structure
interface Comment {
  id: string
  content: string
  parent_id: string | null
  replies?: Comment[]
}

// Organizing comments into a tree
function organizeComments(comments: Comment[]): Comment[] {
  const commentMap = new Map()
  const rootComments = []

  comments.forEach(comment => {
    commentMap.set(comment.id, {...comment, replies: []})
  })

  comments.forEach(comment => {
    if (comment.parent_id) {
      const parent = commentMap.get(comment.parent_id)
      parent.replies.push(commentMap.get(comment.id))
    } else {
      rootComments.push(commentMap.get(comment.id))
    }
  })

  return rootComments
}
```

## Module 4: State Management & Data Flow

### Lesson 1: React Hooks in Practice
```typescript
// Example: Managing complex state
function StoryViewer() {
  // State management
  const [story, setStory] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)

  // Side effects
  useEffect(() => {
    // Fetch story data
    async function fetchStory() {
      const { data } = await supabase
        .from('stories')
        .select('*')
        .eq('id', storyId)
        .single()
      setStory(data)
    }
    fetchStory()
  }, [storyId])

  // Event handlers
  const handleTimeUpdate = (e) => {
    setCurrentTime(e.target.currentTime)
  }
}
```

### Lesson 2: Real-time Updates
```typescript
// Implementing real-time features
useEffect(() => {
  const subscription = supabase
    .channel('comments')
    .on('INSERT', handleNewComment)
    .subscribe()

  return () => {
    subscription.unsubscribe()
  }
}, [])
```

## Module 5: Advanced Features

### Lesson 1: Search & Filtering
```typescript
// Implementing search with debounce
function useDebounce(value: string, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(timer)
    }
  }, [value, delay])

  return debouncedValue
}

// Usage in search
const debouncedSearch = useDebounce(searchTerm, 300)
```

### Lesson 2: Pagination
```typescript
function StoriesList() {
  const [page, setPage] = useState(1)
  const [stories, setStories] = useState([])

  async function fetchStories() {
    const { data } = await supabase
      .from('stories')
      .select('*')
      .range((page - 1) * 10, page * 10 - 1)
    setStories(data)
  }
}
```

## Module 6: Deployment & Best Practices

### Lesson 1: Error Handling
```typescript
// Global error handling
class ErrorBoundary extends React.Component {
  state = { hasError: false }

  static getDerivedStateFromError(error) {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return <ErrorDisplay />
    }
    return this.props.children
  }
}
```

### Lesson 2: Performance Optimization
- Image optimization
- Code splitting
- Caching strategies
- Lazy loading

## Practical Exercises

1. **Basic Setup**
   - Set up a Next.js project
   - Configure Supabase
   - Implement basic authentication

2. **Feature Implementation**
   - Build a basic media player
   - Create a comments system
   - Implement real-time updates

3. **Advanced Features**
   - Add search and filtering
   - Implement pagination
   - Add social features

## Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.io/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)

### Additional Learning
- React Hooks deep dive
- TypeScript basics
- SQL fundamentals
- Web security best practices

## Next Steps
1. Clone the repository
2. Follow the installation guide
3. Start with basic features
4. Gradually add complexity
5. Experiment with modifications

Remember: The best way to learn is by doing. Start with small features and gradually build up to more complex functionality. 