import type { ActionFunctionArgs } from 'react-router'
import { redirect } from 'react-router'
import { createClient } from '~/lib/supabase.server'
import { clearUser } from '~/services/sentry'

export async function action({ request }: ActionFunctionArgs) {
  const { supabase, headers } = createClient(request)

  const { error } = await supabase.auth.signOut()

  if (error) {
    console.error(error)
    return { success: false, error: error.message }
  }

  // Clear Sentry user context on logout
  clearUser()

  // Redirect to dashboard or home page after successful sign-in
  return redirect('/hub', { headers })
}