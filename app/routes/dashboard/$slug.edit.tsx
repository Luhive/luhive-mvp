import { useState, useEffect } from 'react';
import { Form, Link, useRouteLoaderData, useActionData, useNavigation, useLocation } from 'react-router';
import { createClient } from '~/lib/supabase.server';
import type { DashboardLoaderData } from './layout';
import { useIsMobile } from '~/hooks/use-mobile';
import { uploadCommunityLogo } from '~/services/object-storage';

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Textarea } from '~/components/ui/textarea';
import { Button } from '~/components/ui/button';
import { Spinner } from '~/components/ui/spinner';
import { ProfilePictureUpload } from '~/components/profile-picture-upload';
import { toast } from 'sonner';
import { 
  Instagram, 
  Linkedin, 
  Globe,
  Save,
  Check,
} from 'lucide-react';

import LuhiveLogo from '~/assets/images/LuhiveLogo.png';

export function meta() {
  return [
    { title: "Edit Community Profile - Luhive" },
    { name: "description", content: "Edit your community profile" },
  ];
}

export async function action({ request, params }: { request: Request; params: Record<string, string | undefined> }) {
  const { supabase } = createClient(request);
  const formData = await request.formData();

  // Get slug from params
  const slug = (params as { slug?: string }).slug;

  if (!slug) {
    return { success: false, error: 'Invalid community' };
  }

  // Verify user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return { success: false, error: 'Authentication required' };
  }

  // Verify user has permission to edit this community
  const { data: community, error: communityError } = await supabase
    .from('communities')
    .select('id, created_by, slug')
    .eq('slug', slug)
    .single();

  if (communityError || !community) {
    return { success: false, error: 'Community not found' };
  }

  if (community.created_by !== user.id) {
    return { success: false, error: 'Permission denied' };
  }

  // Get form data
  const name = formData.get('name') as string;
  const tagline = formData.get('tagline') as string;
  const description = formData.get('description') as string;
  const website = formData.get('website') as string;
  const instagram = formData.get('instagram') as string;
  const linkedin = formData.get('linkedin') as string;
  const logo_url = formData.get('logo_url') as string;

  // Word count validation helper
  const countWords = (text: string): number => {
    if (!text || text.trim() === '') return 0;
    return text.trim().split(/\s+/).length;
  };

  // Validate word limits
  const taglineWordCount = countWords(tagline);
  const descriptionWordCount = countWords(description);

  if (taglineWordCount > 25) {
    return { success: false, error: 'Tagline must be 25 words or less' };
  }

  if (descriptionWordCount > 100) {
    return { success: false, error: 'Description must be 100 words or less' };
  }

  // Prepare social links JSON
  const socialLinks = {
    website: website || null,
    instagram: instagram || null,
    linkedin: linkedin || null,
  };

  // Update community
  const { error } = await supabase
    .from('communities')
    .update({
      name,
      tagline,
      description,
      social_links: socialLinks,
      logo_url: logo_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq('slug', slug);

  if (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }

  return { success: true, message: 'Community updated successfully!' };
}

export default function CommunityEdit() {
  // Access parent layout loader data
  const data = useRouteLoaderData<DashboardLoaderData>('routes/dashboard/layout');
  const actionData = useActionData<{ success: boolean; error?: string; message?: string }>();
  const navigation = useNavigation();
  const location = useLocation();
  const isMobile = useIsMobile();
  const isSubmitting = navigation.state === 'submitting';

  if (!data) {
    return <div>Loading...</div>;
  }

  const { community, user, role } = data;

  // Parse social links
  const socialLinks = community.social_links as { website?: string; instagram?: string; linkedin?: string } | null;

  const [showSuccess, setShowSuccess] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>(community.logo_url || '');
  const [taglineWordCount, setTaglineWordCount] = useState(0);
  const [descriptionWordCount, setDescriptionWordCount] = useState(0);

  // Word counting function
  const countWords = (text: string): number => {
    if (!text || text.trim() === '') return 0;
    return text.trim().split(/\s+/).length;
  };

  // Get host from React Router location
  const host = typeof window !== 'undefined' ? window.location.host : '';

  // Initialize word counts on mount
  useEffect(() => {
    setTaglineWordCount(countWords(community.tagline || ''));
    setDescriptionWordCount(countWords(community.description || ''));
  }, [community.tagline, community.description]);

  // Show toast on action result
  useEffect(() => {
    if (actionData) {
      if (actionData.success && actionData.message) {
        toast.success(actionData.message);
        setShowSuccess(true);
        // Reset success state after animation
        setTimeout(() => setShowSuccess(false), 3000);
      } else if (actionData.error) {
        toast.error(actionData.error);
      }
    }
  }, [actionData]);

  const handleLogoUpdate = (newLogoUrl: string) => {
    setLogoUrl(newLogoUrl);
  };

  const handleTaglineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const words = countWords(e.target.value);
    setTaglineWordCount(words);
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const words = countWords(e.target.value);
    setDescriptionWordCount(words);
  };

  return (
    <div className="py-4 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Form method="post">
          {/* Hidden input for logo URL */}
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
            <Button 
              variant="outline" 
              size="default" 
              type="submit" 
              disabled={isSubmitting} 
              className="gap-2 hover:bg-primary/5 hover:text-foreground"
            >
              {isSubmitting ? (
                <>
                  <Spinner className="h-4 w-4" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          )}
        </div>

        
          {/* Bento Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Profile Card */}
            <div className="space-y-6">
              <Card className="shadow-none">
                <CardContent className="p-6">
                  {/* Profile Picture */}
                  <ProfilePictureUpload
                    communitySlug={community.slug}
                    currentLogoUrl={community.logo_url || ''}
                    communityName={community.name}
                    onLogoUpdate={handleLogoUpdate}
                  />

                  {/* Community Information */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="community-name">Community Name</Label>
                      <Input
                        id="community-name"
                        name="name"
                        defaultValue={community.name}
                        placeholder="Enter community name"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="tagline">Tagline</Label>
                      <Input
                        id="tagline"
                        name="tagline"
                        defaultValue={community.tagline || ''}
                        placeholder="A short tagline"
                        onChange={handleTaglineChange}
                        maxLength={500}
                      />
                      <p className={`text-xs ${taglineWordCount > 25 ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {taglineWordCount}/25 words
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        name="description"
                        defaultValue={community.description || ''}
                        placeholder="Tell people more about your community"
                        rows={6}
                        className="resize-none"
                        onChange={handleDescriptionChange}
                        maxLength={2000}
                      />
                      <p className={`text-xs ${descriptionWordCount > 100 ? 'text-red-500' : 'text-muted-foreground'}`}>
                        {descriptionWordCount}/100 words
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Stacked Cards */}
            <div className="space-y-6">

              {/* Website Card */}
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle>Website</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Input
                      name="website"
                      defaultValue={socialLinks?.website || ''}
                      placeholder="https://example.com"
                      className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                      type="url"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Social Media Card */}
              <Card className="shadow-none">
                <CardHeader>
                  <CardTitle>Social Media accounts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Instagram className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Input
                      name="instagram"
                      defaultValue={socialLinks?.instagram || ''}
                      placeholder="https://instagram.com/username"
                      className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                      type="url"
                    />
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                    <Linkedin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <Input
                      name="linkedin"
                      defaultValue={socialLinks?.linkedin || ''}
                      placeholder="https://www.linkedin.com/in/username/"
                      className="border-0 bg-transparent p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                      type="url"
                    />
                  </div>

                  <Button type="button" variant="ghost" className="w-full text-muted-foreground" disabled>
                    + Add more
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Mobile Save Button */}
          {isMobile && (
            <div className="sticky bottom-0 bg-background border-t p-4 mt-6">
              <Button 
                variant="outline" 
                size="lg" 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full gap-2 hover:bg-primary/5 hover:text-foreground"
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
        </Form>
      </div>
    </div>
  );
}

