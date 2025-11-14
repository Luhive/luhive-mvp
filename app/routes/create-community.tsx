import type { Route } from "./+types/create-community";
import { useLoaderData, useActionData, Form, useNavigation, redirect } from "react-router";
import { useEffect } from "react";
import { createClient } from "~/lib/supabase.server";
import { sendCommunityWaitlistNotification } from "~/lib/email.server";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import { Badge } from "~/components/ui/badge";
import { Spinner } from "~/components/ui/spinner";
import { AlertCircle, BellPlus, PersonStanding, Sparkles, UserPlus } from "lucide-react";
import { toast } from "sonner";

type LoaderData = {
  user: { id: string } | null;
};

type ActionData = {
  success?: boolean;
  error?: string;
};

export async function loader({ request }: Route.LoaderArgs): Promise<LoaderData | Response> {
  const { supabase } = createClient(request);

  // Check if user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    // Redirect to signup if not authenticated
    return redirect("/signup?redirect=/create-community");
  }

  return {
    user: { id: user.id },
  };
}

export async function action({ request }: Route.ActionArgs): Promise<ActionData | Response> {
  const { supabase } = createClient(request);

  // Verify user is authenticated
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, error: "Authentication required" };
  }

  // Get user profile for email
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  // Get user email from auth
  const userEmail = user.email || "Unknown";
  const userName = profile?.full_name || userEmail.split("@")[0] || "User";

  const formData = await request.formData();
  const name = (formData.get("name") as string)?.trim();
  const website = (formData.get("website") as string)?.trim() || null;
  const description = (formData.get("description") as string)?.trim() || null;

  // Validation
  if (!name || name.length < 2) {
    return { success: false, error: "Community name must be at least 2 characters" };
  }

  if (name.length > 100) {
    return { success: false, error: "Community name must be 100 characters or less" };
  }

  // Insert into waitlist
  const { error: waitlistError } = await supabase
    .from("community_waitlist")
    .insert({
      user_id: user.id,
      community_name: name,
      website: website,
      description: description,
      status: "pending",
    });

  if (waitlistError) {
    console.error("Error adding to waitlist:", waitlistError);
    return { success: false, error: waitlistError.message || "Failed to submit community request" };
  }

  // Send email notification (don't fail if email fails)
  try {
    await sendCommunityWaitlistNotification({
      communityName: name,
      userName: userName,
      userEmail: userEmail,
      website: website,
      description: description,
      submittedAt: new Date().toLocaleString("en-US", {
        dateStyle: "full",
        timeStyle: "short",
      }),
    });
  } catch (emailError) {
    console.error("Error sending waitlist notification email:", emailError);
    // Don't fail the submission if email fails
  }

  // Redirect to success page
  return redirect("/create-community/success");
}

export function meta() {
  return [
    { title: "Create Community - Luhive" },
    { name: "description", content: "Create your own community on Luhive" },
  ];
}

export default function CreateCommunity() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<ActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  // Show error toast if action failed
  useEffect(() => {
    if (actionData?.error) {
      toast.error(actionData.error);
    }
  }, [actionData]);

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
			  <UserPlus className="h-8 w-8 text-primary" />
              <h1 className="text-4xl font-black tracking-tight">Create Community</h1>
            </div>
            <p className="text-lg text-muted-foreground">
              Start building your community and connect with like-minded people
            </p>
          </div>

          {/* Beta Notice */}
          <Card className="mb-6 border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400">
                      Beta
                    </Badge>
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                      Verification Required
                    </p>
                  </div>
                  <p className="text-sm text-amber-800 dark:text-amber-300">
                    We're currently in beta and can't accept all community applications. 
                    Your community will be reviewed and verified before it goes live. 
                    We'll notify you once your community is approved.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <Card>
            <CardHeader>
              <CardTitle>Community Information</CardTitle>
              <CardDescription>
                Fill in the details about your community. You can always edit these later.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form method="post" className="space-y-6">
                {/* Error Message */}
                {actionData?.error && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-destructive">{actionData.error}</p>
                  </div>
                )}

                {/* Community Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Community Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="e.g., Tech Innovators, Book Club, Fitness Enthusiasts"
                    required
                    minLength={2}
                    maxLength={100}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Choose a clear, descriptive name for your community (2-100 characters)
                  </p>
                </div>

                {/* Website/Social Links */}
                <div className="space-y-2">
                  <Label htmlFor="website">Community Website or Social Links</Label>
                  <Input
                    id="website"
                    name="website"
                    type="text"
                    placeholder="https://example.com or https://instagram.com/yourcommunity"
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional: Share your website, Instagram, LinkedIn, or other social media links
                  </p>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">Community Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Tell people what your community is about, what you do, and who it's for..."
                    rows={6}
                    className="resize-none"
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground">
                    Optional: Describe your community's purpose, activities, and values (max 1000 characters)
                  </p>
                </div>

                {/* Submit Button */}
                <div className="flex items-center gap-4 pt-4">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="min-w-[140px]"
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner className="mr-2 h-4 w-4" />
                        Creating...
                      </>
                    ) : (
                      "Create Community"
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => window.history.back()}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                </div>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

