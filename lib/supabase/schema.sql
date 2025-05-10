-- Finding Home - Family-exclusive website database schema
-- Created for: Tasmia Noor's family stories project
-- Deadline: May 3, 2025
-- Timezone: Central Time (US & Canada) (UTC-05:00)

-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- REQUIREMENT: Sign up and sign in to gain exclusive access to all the story content
-- Note: Authentication is handled by Supabase Auth, this profiles table extends it
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    username text unique not null,
    full_name text not null,
    avatar_url text,
    bio text,
    -- Family member verification status
    is_family_verified boolean default false,
    -- Family relationship to Tasmia's father
    relationship_to_author text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- REQUIREMENT: Upload stories and manage story content
create table public.stories (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    title text not null,
    description text,
    episode_number integer,
    audio_url text,
    thumbnail_url text,
    transcript_question text,
    transcript_answer text,
    duration interval, -- For tracking progress
    is_published boolean default false,
    view_count integer default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- REQUIREMENT: Filter stories by tags
create table public.tags (
    id uuid default uuid_generate_v4() primary key,
    name text unique not null,
    icon text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Junction table for story tags
create table public.story_tags (
    story_id uuid references public.stories(id) on delete cascade,
    tag_id uuid references public.tags(id) on delete cascade,
    primary key (story_id, tag_id)
);

-- REQUIREMENT: Track story progress for "in-progress" status on dashboard
create table public.story_progress (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.profiles(id) on delete cascade not null,
    story_id uuid references public.stories(id) on delete cascade not null,
    progress_seconds integer not null default 0,
    is_completed boolean default false,
    last_played_at timestamp with time zone default timezone('utc'::text, now()) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(user_id, story_id)
);

-- REQUIREMENT: Comment on stories with correct profile display
create table public.comments (
    id uuid default uuid_generate_v4() primary key,
    story_id uuid references public.stories(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    parent_id uuid references public.comments(id) on delete cascade,
    content text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- REQUIREMENT: Save (bookmark) stories
create table public.bookmarks (
    user_id uuid references public.profiles(id) on delete cascade,
    story_id uuid references public.stories(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (user_id, story_id)
);

-- Table for story reactions/likes
create table public.likes (
    user_id uuid references public.profiles(id) on delete cascade,
    story_id uuid references public.stories(id) on delete cascade,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (user_id, story_id)
);

-- Create story visibility table
create table public.story_visibility (
    story_id uuid references public.stories(id) on delete cascade,
    visibility_type text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    primary key (story_id, visibility_type)
);

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.stories enable row level security;
alter table public.tags enable row level security;
alter table public.story_tags enable row level security;
alter table public.story_progress enable row level security;
alter table public.comments enable row level security;
alter table public.bookmarks enable row level security;
alter table public.likes enable row level security;
alter table public.story_visibility enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Profiles are viewable by verified family members only" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update own profile" on public.profiles;

-- Create new policies for profiles table
create policy "Profiles are viewable by anyone"
on public.profiles for select
using (true);

create policy "Users can insert their own profile"
on public.profiles for insert
with check (auth.uid() = id);

create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- Stories policies
create policy "Stories are viewable by verified family members only"
on public.stories for select
using (exists (
    select 1 from public.profiles
    where id = auth.uid() and is_family_verified = true
));

create policy "Users can create stories"
on public.stories for insert
with check (auth.uid() = user_id);

create policy "Users can update own stories"
on public.stories for update
using (auth.uid() = user_id);

create policy "Users can delete own stories"
on public.stories for delete
using (auth.uid() = user_id);

-- Story progress policies
create policy "Users can view own progress"
on public.story_progress for select
using (auth.uid() = user_id);

create policy "Users can insert progress"
on public.story_progress for insert
with check (auth.uid() = user_id);

create policy "Users can update own progress"
on public.story_progress for update
using (auth.uid() = user_id);

-- Comments policies
drop policy if exists "Comments are viewable by verified family members" on public.comments;
drop policy if exists "Verified family members can insert comments" on public.comments;
drop policy if exists "Users can update own comments" on public.comments;
drop policy if exists "Users can delete own comments" on public.comments;

create policy "Comments are viewable by anyone"
on public.comments for select
using (true);

create policy "Authenticated users can insert comments"
on public.comments for insert
with check (auth.role() = 'authenticated');

create policy "Users can update own comments"
on public.comments for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete own comments"
on public.comments for delete
using (auth.uid() = user_id);

-- Bookmarks policies
create policy "Users can view own bookmarks"
on public.bookmarks for select
using (auth.uid() = user_id);

create policy "Users can insert bookmarks"
on public.bookmarks for insert
with check (auth.uid() = user_id);

create policy "Users can delete own bookmarks"
on public.bookmarks for delete
using (auth.uid() = user_id);

-- Create policy for story_visibility
create policy "Users can manage their story visibility"
on public.story_visibility
for all
using (exists (
    select 1 from public.stories
    where id = story_id and user_id = auth.uid()
));

-- Insert default tags
insert into public.tags (name, icon) values
    ('Childhood', '👶'),
    ('Sports', '🏆'),
    ('Hobbies & Interests', '🎨'),
    ('Liberation war', '🏳️'),
    ('Proud moments', '🌟'),
    ('Travel', '✈️'),
    ('Grief', '💔'),
    ('Family', '👨‍👩‍👧‍👦'),
    ('Health', '❤️'),
    ('Pride', '🌈');

-- Create indexes for better query performance
create index idx_story_progress_user_id on public.story_progress(user_id);
create index idx_story_progress_story_id on public.story_progress(story_id);
create index idx_comments_story_id on public.comments(story_id);
create index idx_story_tags_story_id on public.story_tags(story_id);
create index idx_story_tags_tag_id on public.story_tags(tag_id);

-- Functions

-- Function to check if a story is in progress for a user
create or replace function is_story_in_progress(story_id uuid, user_id uuid)
returns boolean as $$
begin
    return exists (
        select 1
        from public.story_progress
        where story_id = $1
        and user_id = $2
        and is_completed = false
        and progress_seconds > 0
    );
end;
$$ language plpgsql security definer; 