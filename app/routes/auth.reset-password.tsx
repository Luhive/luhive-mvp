import { redirect } from 'react-router'
import { Form, Link, useActionData, useNavigation, useLoaderData } from 'react-router'
import type { Route } from './+types/auth.reset-password'
import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Label } from '~/components/ui/label'
import { createClient } from '~/lib/supabase.server'
import LuhiveLogo from '~/assets/images/LuhiveLogo.svg'
import { Spinner } from '~/components/ui/spinner'
import { toast } from 'sonner'
import { z } from 'zod'

const resetPasswordSchema = z.object({
  password: z.string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be less than 72 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string()
    .min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Reset Your Password - Luhive" },
    { name: "description", content: "Enter your new password" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const { supabase, headers } = createClient(request);
  const url = new URL(request.url);
  
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');
  
  // Verify the recovery token if present
  if (token_hash && type === 'recovery') {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash,
      type: 'recovery',
    });

    if (!error && data.session) {
      // Token verified successfully, session established
      // Return success to show the password reset form
      return Response.json({ verified: true, isLoading: false }, { headers });
    }
    
    // Token verification failed - redirect with specific error
    if (error) {
      const errorType = error.message.includes('expired') ? 'expired-token' : 'invalid-token';
      return redirect(`/auth/forgot-password?error=${errorType}`, { headers });
    }
    
    return redirect('/auth/forgot-password?error=invalid-token', { headers });
  }
  
  // No token provided, check if session exists (in case of page refresh)
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return redirect('/auth/forgot-password?error=missing-token', { headers });
  }

  return Response.json({ verified: true, isLoading: false }, { headers });
}

export async function action({ request }: Route.ActionArgs) {
  const { supabase, headers } = createClient(request);
  const formData = await request.formData();
  
  const data = {
    password: (formData.get('password') as string)?.trim() || '',
    confirmPassword: (formData.get('confirmPassword') as string)?.trim() || '',
  };

  // Check if session is still valid
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session) {
    return Response.json(
      { success: false, error: 'Your session has expired. Please request a new reset link.' },
      { headers }
    );
  }

  // Validate with Zod
  const result = resetPasswordSchema.safeParse(data);
  
  if (!result.success) {
    // Return the first validation error
    const firstError = result.error.issues[0];
    return Response.json(
      { success: false, error: firstError.message },
      { headers }
    );
  }

  const { password } = result.data;

  // Update password
  const { error: updateError } = await supabase.auth.updateUser({
    password: password,
  });

  if (updateError) {
    // Handle specific Supabase error cases
    let errorMessage = updateError.message;
    
    // Supabase returns this when trying to use the same password
    if (updateError.message.includes('same') || updateError.message.includes('current password')) {
      errorMessage = 'New password must be different from your current password.';
    } else if (updateError.message.includes('weak') || updateError.message.includes('strength')) {
      errorMessage = 'Password is too weak. Please use a stronger password.';
    }
    
    return Response.json(
      { success: false, error: errorMessage },
    );
  }

  // Sign out the user after successful password reset
  await supabase.auth.signOut();
  
  // Success! Redirect to login with success message
  return redirect('/login?reset=success', { headers });
}

const ResetPassword = () => {
  const loaderData = useLoaderData<{ verified: boolean; isLoading: boolean }>();
  const actionData = useActionData<{ success: boolean; error?: string }>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const isNavigating = navigation.state === 'loading';
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (actionData && 'error' in actionData && actionData.error) {
      toast.error(String(actionData.error));
    }
  }, [actionData]);

  // Show loading state while verifying token on initial load
  if (isNavigating) {
    return (
      <div className='mt-16'>
        <div className="flex flex-col items-center text-center">
          <Link to="/" className="mb-6 rounded-3xl bg-primary/10 p-4 transition-all hover:shadow-sm active:scale-95">
            <img src={LuhiveLogo} alt="Luhive logo" className="h-10 w-10" />
          </Link>
          <h1 className="text-2xl font-bold mb-2">Verifying Token...</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Please wait while we verify your reset link.
          </p>
        </div>
        <div className="mx-auto border rounded-md border-muted max-w-md px-6 py-12 flex justify-center">
          <Spinner className="h-8 w-8" />
        </div>
      </div>
    );
  }

  return (
    <div className='mt-16'>
      <div className="flex flex-col items-center text-center">
        <Link to="/" className="mb-6 rounded-3xl bg-primary/10 p-4 transition-all hover:shadow-sm active:scale-95">
          <img src={LuhiveLogo} alt="Luhive logo" className="h-10 w-10" />
        </Link>
        <h1 className="text-2xl font-bold mb-2">Reset Your Password</h1>
        <p className="text-sm text-muted-foreground mb-4">
          Enter your new password below.
        </p>
      </div>

      <div className="mx-auto border rounded-md border-muted max-w-md px-6 py-12">
        <Form method="post" className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">New Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter new password"
                className="pr-10"
                required
                minLength={8}
                autoFocus
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
            <p className="text-xs text-muted-foreground">
              Must be at least 8 characters with uppercase, lowercase, and number
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm new password"
                className="pr-10"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button disabled={isSubmitting} type="submit">
            {isSubmitting ? <Spinner /> : 'Reset Password'}
          </Button>
        </Form>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            Remember your password?{' '}
            <Link to="/login" className="underline hover:text-foreground">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
