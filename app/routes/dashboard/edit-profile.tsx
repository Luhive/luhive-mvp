export { action } from "~/modules/dashboard/server/edit-profile-action.server";

import { useState, useEffect } from "react";
import { Form, useActionData, useNavigation, useLocation } from "react-router";
import { useIsMobile } from "~/shared/hooks/use-mobile";
import { countWords } from "~/shared/lib/utils/text";
import { useWordCount } from "~/shared/hooks/use-word-count";
import { useDashboardContext } from "~/modules/dashboard/hooks/use-dashboard-context";
import { DashboardEditSkeleton } from "~/modules/dashboard/components/dashboard-edit-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "~/shared/components/ui/card";
import { Input } from "~/shared/components/ui/input";
import { Label } from "~/shared/components/ui/label";
import { Textarea } from "~/shared/components/ui/textarea";
import { Button } from "~/shared/components/ui/button";
import { Spinner } from "~/shared/components/ui/spinner";
import { ProfilePictureUpload } from "~/modules/profile/components/profile-picture-upload";
import { toast } from "sonner";
import { Instagram, Linkedin, Globe, Save, Check, MessageCircle } from "lucide-react";

export function meta() {
  return [
    { title: "Edit Community Profile - Luhive" },
    { name: "description", content: "Edit your community profile" },
  ];
}

export default function CommunityEdit() {
  const data = useDashboardContext();
  const actionData = useActionData<{ success: boolean; error?: string; message?: string }>();
  const navigation = useNavigation();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isSubmitting = navigation.state === "submitting";

  const [showSuccess, setShowSuccess] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>("");
  const { wordCount: taglineWordCount, handleChange: handleTaglineChange, setWordCount: setTaglineWordCount } = useWordCount<HTMLInputElement>();
  const { wordCount: descriptionWordCount, handleChange: handleDescriptionChange, setWordCount: setDescriptionWordCount } = useWordCount<HTMLTextAreaElement>();

  const host = typeof window !== "undefined" ? window.location.host : "";

  useEffect(() => {
    if (data?.community) {
      setLogoUrl(data.community.logo_url || "");
      setTaglineWordCount(countWords(data.community.tagline || ""));
      setDescriptionWordCount(countWords(data.community.description || ""));
    }
  }, [data?.community, setTaglineWordCount, setDescriptionWordCount]);

  useEffect(() => {
    if (actionData) {
      if (actionData.success && actionData.message) {
        toast.success(actionData.message);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else if (actionData.error) {
        toast.error(actionData.error);
      }
    }
  }, [actionData]);

  const { community } = data;
  const socialLinks = community.social_links as { website?: string; instagram?: string; linkedin?: string; whatsapp?: string } | null;

  const handleLogoUpdate = (newLogoUrl: string) => {
    setLogoUrl(newLogoUrl);
  };

  return (
    <div className="py-4 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        <Form method="post">
          <input type="hidden" name="logo_url" value={logoUrl} />

          <div className="flex items-center gap-8 justify-between mb-6">
            <div className="w-full">
              {showSuccess ? (
                <div className="flex items-center gap-2 px-3 py-2 bg-green-50 text-green-700 rounded-sm border border-green-200 animate-pulse">
                  <Check className="h-4 w-4" />
                  <span className="text-sm font-medium">Changes saved!</span>
                  <span className="text-sm text-green-600">{host}/c/{community.slug}</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-muted text-foreground rounded-sm border">
                  <Globe className="h-4 w-4" />
                  <span className="text-sm font-medium">Public Url:</span>
                  <span className="text-sm text-foreground/60">{host}/c/{community.slug}</span>
                </div>
              )}
            </div>
            {!isMobile && (
              <Button variant="outline" size="default" type="submit" disabled={isSubmitting} className="gap-2 hover:bg-primary/5 hover:text-foreground">
                {isSubmitting ? (
                  <><Spinner className="h-4 w-4" /> Saving...</>
                ) : (
                  <><Save className="h-4 w-4" /> Save Changes</>
                )}
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card className="shadow-none">
                <CardContent className="p-6">
                  <ProfilePictureUpload
                    communitySlug={community.slug}
                    currentLogoUrl={community.logo_url || ""}
                    communityName={community.name}
                    onLogoUpdate={handleLogoUpdate}
                  />
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="community-name">Community Name</Label>
                      <Input id="community-name" name="name" defaultValue={community.name} placeholder="Enter community name" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tagline">Tagline</Label>
                      <Input id="tagline" name="tagline" defaultValue={community.tagline || ""} placeholder="A short tagline" onChange={handleTaglineChange} maxLength={500} />
                      <p className={`text-xs ${taglineWordCount > 25 ? "text-red-500" : "text-muted-foreground"}`}>{taglineWordCount}/25 words</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" name="description" defaultValue={community.description || ""} placeholder="Tell people more about your community" rows={6} className="resize-none" onChange={handleDescriptionChange} maxLength={2000} />
                      <p className={`text-xs ${descriptionWordCount > 100 ? "text-red-500" : "text-muted-foreground"}`}>{descriptionWordCount}/100 words</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="shadow-none">
                <CardHeader><CardTitle>Website</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Input name="website" defaultValue={socialLinks?.website || ""} placeholder="https://example.com" className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0" type="url" />
                  </div>
                </CardContent>
              </Card>
              <Card className="shadow-none">
                <CardHeader><CardTitle>Social Media accounts</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Instagram className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Input name="instagram" defaultValue={socialLinks?.instagram || ""} placeholder="https://instagram.com/username" className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0" type="url" />
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Linkedin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Input name="linkedin" defaultValue={socialLinks?.linkedin || ""} placeholder="https://www.linkedin.com/in/username/" className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0" type="url" />
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <MessageCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Input name="whatsapp" defaultValue={socialLinks?.whatsapp || ""} placeholder="https://wa.me/1234567890" className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0" type="url" />
                  </div>
                  <Button type="button" variant="ghost" className="w-full text-muted-foreground" disabled>+ Add more</Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {isMobile && (
            <div className="sticky bottom-0 bg-background border-t p-4 mt-6">
              <Button variant="outline" size="lg" type="submit" disabled={isSubmitting} className="w-full gap-2 hover:bg-primary/5 hover:text-foreground">
                {isSubmitting ? (<><Spinner className="h-4 w-4" /> Saving...</>) : (<><Save className="h-4 w-4" /> Save Changes</>)}
              </Button>
            </div>
          )}
        </Form>
      </div>
    </div>
  );
}
