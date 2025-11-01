import { redirect } from 'react-router'
import { Form, Link, useActionData, useNavigation } from 'react-router'
import type { Route } from './+types/login'
import { useEffect } from 'react'

import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { createClient } from '~/lib/supabase.server'
import LuhiveLogo from '~/assets/images/LuhiveLogo.svg'
import { Spinner } from '~/components/ui/spinner'
import { toast } from 'sonner'

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Sign Up - Luhive" },
    { name: "description", content: "Create your Luhive account" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase, headers } = createClient(request);

  // Check if user is already authenticated
  const { data: { user } } = await supabase.auth.getUser();

  // If user is authenticated, redirect to their community
  if (user) {
    // Fetch the user's community (where they are the creator)
    const { data: community } = await supabase
      .from('communities')
      .select('slug')
      .eq('created_by', user.id)
      .single();

    if (community) {
      return redirect(`/c/${community.slug}`, { headers });
    }

    // If no community found, redirect to home
    return redirect('/', { headers });
  }

  return Response.json({ user: null }, { headers });
}

export async function action({ request }: Route.ActionArgs) {
  const { supabase, headers } = createClient(request);
  const formData = await request.formData();
  const intent = (formData.get('intent') as string) || 'password';

  if (intent === 'oauth') {
    const provider = formData.get('provider') as 'google';
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: new URL('/login', request.url).toString(),
      },
    });

    if (error) {
      return Response.json({ success: false, error: error.message }, { headers });
    }

    // Redirect to provider auth URL
    if (data?.url) {
      return redirect(data.url, { headers });
    }

    return Response.json({ success: false, error: 'Unable to start OAuth flow.' }, { headers });
  }

  // Get form data
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const name = formData.get('name') as string;
  const surname = formData.get('surname') as string;
  const fullName = `${name} ${surname}`.trim();

  // Sign up with Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    return Response.json({ success: false, error: error.message }, { headers });
  }

  // Check if user was created successfully
  if (!data.user) {
    return Response.json({ success: false, error: 'Failed to create user account' }, { headers });
  }

  // Create profile record for the new user
  const { error: profileError } = await supabase
    .from('profiles')
    .insert({
      id: data.user.id,
      full_name: fullName,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

  if (profileError) {
    // Log the error but don't block the registration flow
    console.error('Failed to create profile:', profileError);
    // You might want to handle this differently depending on your requirements
  }

  // Check if user needs email confirmation
  if (data.session) {
    // User is automatically logged in (email confirmation disabled)
    // Redirect to onboarding or home
    return redirect('/register', { headers });
  }

  // If email confirmation is required, show a message
  return Response.json({ 
    success: true, 
    message: 'Please check your email to confirm your account' 
  }, { headers });
}

const Register = () => {
  const actionData = useActionData<{ success: boolean; error?: string; message?: string }>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'

  useEffect(() => {
    if (actionData) {
      if ('error' in actionData && actionData.error) {
        toast.error(String(actionData.error))
      } else if ('message' in actionData && actionData.message) {
        toast.success(String(actionData.message))
      }
    }
  }, [actionData])

  return (
    <div className='mt-16'>
      <div className="flex flex-col items-center text-center">
        <img src={LuhiveLogo} alt="Luhive logo" className="h-12 w-12 mb-6" />
        <h1 className="text-2xl font-bold mb-2">Welcome to Our Platform!</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Lets see who you are.
        </p>
      </div>

      <div className="mx-auto border rounded-md border-muted max-w-md px-6 py-12">
        <Form method="post" className="flex flex-col gap-4">
          <input type="hidden" name="intent" value="password" />
		  <div className="flex flex-col gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" type="text" placeholder="Elizabeth" required />
          </div>
		  <div className="flex flex-col gap-2">
            <Label htmlFor="surname">Surname</Label>
            <Input id="surname" name="surname" type="text" placeholder="Queen" required />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
            </div>
            <Input id="password" type="password" name="password" placeholder="Your password" required />
          </div>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? <Spinner /> : 'Sign Up'}
          </Button>
        </Form>

        <div className="my-6 flex items-center gap-4">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Form method="post" className="flex" replace>
          <input type="hidden" name="intent" value="oauth" />
          <input type="hidden" name="provider" value="google" />
          <div className="w-full hover:bg-muted hover:text-foreground" onClick={() => toast.info("Coming Soon 🚀", {
            description: "We are currently working on this feature",
            position: 'bottom-center'
          })}>
            <Button
              disabled
              variant="outline"
              className="w-full hover:bg-muted hover:text-foreground"
              type="submit">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 48 48"
              className="size-5 mr-1"
              aria-hidden
              focusable="false"
            >
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.843 32.658 29.29 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.676 6.053 29.629 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20c10.494 0 19.143-7.656 19.143-20 0-1.341-.147-2.652-.432-3.917z" />
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.813C14.297 16.128 18.787 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.676 6.053 29.629 4 24 4 15.316 4 7.954 8.924 6.306 14.691z" />
              <path fill="#4CAF50" d="M24 44c5.196 0 9.86-1.992 13.38-5.223l-6.173-5.234C29.093 34.484 26.682 35.5 24 35.5c-5.262 0-9.799-3.507-11.397-8.248l-6.52 5.017C8.704 39.043 15.83 44 24 44z" />
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-1.018 2.977-3.279 5.308-6.093 6.443l.001-.001 6.173 5.234C34.84 40.782 43 36 43 24c0-1.341-.147-2.652-.432-3.917z" />
            </svg>
            Continue with Google
          </Button>
          </div>
        </Form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already with us?{' '}
          <Link to="/login" className="underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register