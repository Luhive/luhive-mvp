import { useEffect } from "react";
import { Form, Link, useActionData, useNavigation } from "react-router";
import { toast } from "sonner";
import { Linkedin } from "lucide-react";
import { Button } from "~/shared/components/ui/button";
import { Input } from "~/shared/components/ui/input";
import { Label } from "~/shared/components/ui/label";
import { Textarea } from "~/shared/components/ui/textarea";
import { Spinner } from "~/shared/components/ui/spinner";
import type { Profile } from "~/shared/models/entity.types";
import type { SettingsActionData } from "~/modules/profile/models/settings.types";

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

interface SettingsFormProps {
  user: Profile;
  email: string | null;
}

export function SettingsForm({ user, email }: SettingsFormProps) {
  const actionData = useActionData<SettingsActionData>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  const socialLinks = (user.metadata as { twitter?: string; linkedin?: string } | null) ?? {};

  useEffect(() => {
    if (!actionData) return;
    if (actionData.success) {
      toast.success(actionData.message ?? "Profile updated!");
    } else if (actionData.error) {
      toast.error(actionData.error);
    }
  }, [actionData]);

  return (
    <div className="flex-1 space-y-1">
      <div className="mb-4">
        <h2 className="text-lg font-semibold">Edit profile</h2>
        <p className="text-sm text-muted-foreground">
          Make changes to your profile here. Click save when you're done.
        </p>
      </div>

      <Form method="post" className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            name="full_name"
            placeholder="Your full name"
            defaultValue={user.full_name ?? ""}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={email ?? ""}
            disabled
            className="cursor-not-allowed opacity-60"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            name="bio"
            placeholder="Tell us a little about yourself"
            defaultValue={user.bio ?? ""}
            rows={3}
            className="resize-none"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="twitter">X (Twitter)</Label>
          <div className="relative">
            <XIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="twitter"
              name="twitter"
              placeholder="username"
              defaultValue={socialLinks.twitter ?? ""}
              className="pl-9"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="linkedin">LinkedIn</Label>
          <div className="relative">
            <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="linkedin"
              name="linkedin"
              placeholder="username or profile URL"
              defaultValue={socialLinks.linkedin ?? ""}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="outline" asChild>
            <Link to="/profile">Cancel</Link>
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Spinner className="h-4 w-4 mr-2" />
                Saving...
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
}
