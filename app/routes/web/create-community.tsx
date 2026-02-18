export { loader } from "~/modules/community/server/create-community-loader.server";
export { action } from "~/modules/community/server/create-community-action.server";
export { meta } from "~/modules/community/model/create-community-meta";

import {
  useLoaderData,
  useActionData,
  Form,
  useNavigation,
} from "react-router";
import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "~/shared/components/ui/card";
import { Button } from "~/shared/components/ui/button";
import { Input } from "~/shared/components/ui/input";
import { Textarea } from "~/shared/components/ui/textarea";
import { Label } from "~/shared/components/ui/label";
import { Badge } from "~/shared/components/ui/badge";
import { Spinner } from "~/shared/components/ui/spinner";
import { AlertCircle, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { CreateCommunityLoaderData } from "~/modules/community/server/create-community-loader.server";
import type { CreateCommunityActionData } from "~/modules/community/server/create-community-action.server";

export default function CreateCommunityPage() {
  useLoaderData<CreateCommunityLoaderData>();
  const actionData = useActionData<CreateCommunityActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  useEffect(() => {
    if (actionData?.error) {
      toast.error(actionData.error);
    }
  }, [actionData]);

  return (
    <main className="py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <UserPlus className="h-8 w-8 text-primary" />
          <h1 className="text-4xl font-black tracking-tight">
            Create Community
          </h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Start building your community and connect with like-minded people
        </p>
      </div>

      <Card className="mb-6 border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-400"
                >
                  Beta
                </Badge>
                <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                  Verification Required
                </p>
              </div>
              <p className="text-sm text-amber-800 dark:text-amber-300">
                We're currently in beta and can't accept all community
                applications. Your community will be reviewed and verified
                before it goes live. We'll notify you once your community is
                approved.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Community Information</CardTitle>
          <CardDescription>
            Fill in the details about your community. You can always edit these
            later.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form method="post" className="space-y-6">
            {actionData?.error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                <p className="text-sm text-destructive">{actionData.error}</p>
              </div>
            )}

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
                Choose a clear, descriptive name for your community (2-100
                characters)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">
                Community Website or Social Links
              </Label>
              <Input
                id="website"
                name="website"
                type="text"
                placeholder="https://example.com or https://instagram.com/yourcommunity"
                className="w-full"
              />
              <p className="text-xs text-muted-foreground">
                Optional: Share your website, Instagram, LinkedIn, or other
                social media links
              </p>
            </div>

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
                Optional: Describe your community's purpose, activities, and
                values (max 1000 characters)
              </p>
            </div>

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
    </main>
  );
}
