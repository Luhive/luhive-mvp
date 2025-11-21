import { redirect } from 'react-router'
import { Form, Link, useActionData, useNavigation, useSearchParams } from 'react-router'
import type { Route } from './+types/login'
import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { createClient } from '~/lib/supabase.server'
import LuhiveLogo from '~/assets/images/LuhiveLogo.svg'
import { Spinner } from '~/components/ui/spinner'
import { toast } from 'sonner'

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Sign In Page - Luhive" },
    { name: "description", content: "Welcome to React Router!" },
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
        redirectTo: new URL('/auth/verify', request.url).toString(),
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

  // Password login
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  });

  if (error) {
    return Response.json({ success: false, error: error.message }, { headers });
  }

  // After successful login, get user and their community
  const { data: { user } } = await supabase.auth.getUser();

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
  }

  // If no community found, redirect to home
  return redirect('/', { headers });
}

const Login = () => {
  const [searchParams] = useSearchParams();
  const actionData = useActionData<{ success: boolean; error?: string }>()
  const navigation = useNavigation()
  const isSubmitting = navigation.state === 'submitting'
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (actionData && 'error' in actionData && actionData.error) {
      toast.error(String(actionData.error))
    }
  }, [actionData])

  // Show success message when redirected after password reset
  useEffect(() => {
    if (searchParams.get('reset') === 'success') {
      toast.success('Password reset successfully!', {
        description: 'Please log in with your new password.',
      });
      // Remove the query parameter from URL without reloading
      window.history.replaceState({}, '', '/login');
    }
  }, [searchParams])

  return (
    <div className='mt-16'>
      <div className="flex flex-col items-center text-center">
        <Link to="/" className="mb-6 rounded-3xl bg-primary/10 p-4 transition-all hover:shadow-sm active:scale-95">
          <img src={LuhiveLogo} alt="Luhive logo" className="h-10 w-10" />
        </Link>
        <h1 className="text-2xl font-bold mb-2">Nice to See You!</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Welcome to Luhive. Please enter your details.
        </p>
      </div>

      <div className="mx-auto border rounded-md border-muted max-w-md px-6 py-12">
        <Form method="post" className="flex flex-col gap-4">
          <input type="hidden" name="intent" value="password" />
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="you@example.com" required />
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link className="text-xs text-muted-foreground hover:underline" to="/auth/forgot-password">
                Forgot your password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Your password"
                className="pr-10"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? <Spinner /> : 'Log in'}
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
          <Button
            disabled={isSubmitting}
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
            {isSubmitting ? <Spinner /> : 'Login with Google'}
          </Button>
        </Form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          No account?{' '}
          <Link to="/signup" className="underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login