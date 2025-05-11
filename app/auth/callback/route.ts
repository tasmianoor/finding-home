import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Exchange the code for a session
    const { data: { user }, error: authError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!authError && user) {
      // Get user metadata
      const { data: { user: userData }, error: userError } = await supabase.auth.getUser()
      
      if (!userError && userData?.user_metadata) {
        // Create profile after successful authentication
        const { error: profileError } = await supabase.from('profiles').insert([
          {
            id: user.id,
            username: user.email?.split('@')[0] || '',
            full_name: userData.user_metadata.full_name || '',
            relation: userData.user_metadata.relation || '',
            is_family_verified: false,
          }
        ])

        if (profileError) {
          console.error('Profile creation error:', profileError)
        }
      }
    }
  }

  // Redirect to signin page after verification
  return NextResponse.redirect(new URL('/signin', request.url))
} 