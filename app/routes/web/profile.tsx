import type { Route } from "./+types/profile";
import { useLoaderData, Form, redirect, useNavigation, useActionData } from "react-router";
import { useState, useEffect } from "react";
import { createClient } from "~/lib/supabase.server";
import type { Database } from "~/models/database.types";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { User, Mail, Calendar, Save } from "lucide-react";
import { toast } from "sonner";
import { createClient as createBrowserClient } from "~/lib/supabase.client";
import MaleFace from "~/assets/images/characters/male-face.png";
import WomanFace from "~/assets/images/characters/woman-face.png";
import { Activity } from "react";
import { Spinner } from "~/components/ui/spinner";

type Profile = Database['public']['Tables']['profiles']['Row'];

type LoaderData = {
  user: Profile | null;
  email: string | null;
};

export function meta({ data }: { data?: LoaderData }) {
  const user = data?.user;
  return [
    { title: user?.full_name ? `${user.full_name} - Profile` : "Profile - Luhive" },
    { name: "description", content: "User Profile in Luhive" },
  ];
}

export async function loader({ request }: Route.LoaderArgs): Promise<LoaderData> {
  const { supabase } = createClient(request);

  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

  if (authError || !authUser) {
    return { user: null, email: null };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();

  return {
    user: profile || null,
    email: authUser.email || null,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const { supabase } = createClient(request);

  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return redirect('/login');
  }

  const formData = await request.formData();
  const fullName = formData.get('full_name') as string;
  const bio = formData.get('bio') as string;

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: fullName,
      bio: bio || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id);

  if (error) {
    console.error('Error updating profile:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }

  return { 
    success: true,
    message: 'Profile updated successfully!' 
  };
}

export default function Profile() {
  const { user, email } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const actionData = useActionData<typeof action>();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(user?.avatar_url || null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const isSubmitting = navigation.state === 'submitting';
  
  // Update local state when user data changes after save
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setBio(user.bio || '');
      setSelectedAvatar(user.avatar_url || null);
    }
  }, [user]);
  
  // React to action responses - the React Router V7 way!
  useEffect(() => {
    if (actionData?.success) {
      setIsEditing(false);
      toast.success(actionData.message);
    } else if (actionData?.error) {
      toast.error(actionData.error);
    }
  }, [actionData]);

  const avatarOptions = [
    { id: 'male', label: 'Male', url: MaleFace },
    { id: 'woman', label: 'Woman', url: WomanFace },
  ];

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "😊";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const handleAvatarSelect = async (avatarType: string) => {
    const avatar = avatarOptions.find(a => a.id === avatarType);
    if (!avatar) return;

    setIsUploading(true);
    try {
      const supabase = createBrowserClient();
      
      // Update database with the avatar URL
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatar.url })
        .eq('id', user!.id);

      if (dbError) {
        toast.error('Failed to save avatar');
      } else {
        setSelectedAvatar(avatar.url);
        toast.success('Avatar updated successfully!');
      }
    } catch (error) {
      toast.error('Failed to update avatar');
    } finally {
      setIsUploading(false);
    }
  };

  if (!user) {
    return (
      <div className="py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Please log in to view your profile.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mx-auto space-y-6">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-3xl font-bold">Profile</CardTitle>
                <p className="text-muted-foreground mt-1">Manage your account settings</p>
              </div>
              <Activity mode={!isEditing ? "visible" : "hidden"}>
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  Edit Profile
                </Button>
              </Activity>
            </div>
          </CardHeader>
        </Card>

        {/* Profile Info */}
        <Card>
          
          <CardContent className="py-8">
            
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
              {/* Avatar Section */}
              <div className="flex flex-col items-center gap-4">
                <Avatar className="h-32 w-32 border-4 border-background shadow-lg">
                  <AvatarImage src={selectedAvatar || undefined} alt={user?.full_name || "User"} />
                  <AvatarFallback className="bg-gradient-avatar text-white text-3xl">
                    {getInitials(user?.full_name)}
                  </AvatarFallback>
                </Avatar>
                
                <Activity mode={isEditing ? "visible" : "hidden"}>
                  <div className="flex flex-col gap-3 items-center">
                    <p className="text-sm font-medium text-foreground">Choose Avatar</p>
                    <div className="flex gap-3">
                      {avatarOptions.map((avatar) => (
                        <button
                          key={avatar.id}
                          onClick={() => handleAvatarSelect(avatar.id)}
                          disabled={isUploading}
                          className={`relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all hover:scale-105 ${
                            selectedAvatar === avatar.url
                              ? 'border-primary shadow-lg'
                              : 'border-border hover:border-primary/50'
                          }`}
                        >
                          <img
                            src={avatar.url}
                            alt={avatar.label}
                            className="w-full h-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </Activity>
              </div>

              {/* Profile Details */}
              <div className="flex-1 w-full space-y-6">
                <Form method="post" className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-sm font-medium flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Full Name
                    </Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      disabled={!isEditing || isSubmitting}
                      placeholder="Enter your full name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email Address
                    </Label>
                    <Input
                      id="email"
                      value={email || ''}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed from here
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Bio
                    </Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      disabled={!isEditing || isSubmitting}
                      placeholder="Tell us about yourself..."
                      rows={4}
                    />
                  </div>

                  <Activity mode={isEditing ? "visible" : "hidden"}>
                    <div className="flex gap-3">
                      <Button 
                        type="submit" 
                        className="flex-1"
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <Spinner className="h-4 w-4 mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => {
                          setIsEditing(false);
                          setFullName(user?.full_name || '');
                          setBio(user?.bio || '');
                        }}
                        disabled={isSubmitting}
                      >
                        Cancel
                      </Button>
                    </div>
                  </Activity>
                </Form>

                {/* Account Info */}
                <Activity mode={!isEditing ? "visible" : "hidden"}>
                  <div className="pt-4 border-t space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Joined:</span>
                      <span className="font-medium">
                        {user?.created_at 
                          ? new Date(user.created_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })
                          : 'Unknown'
                        }
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span className="font-medium">
                        {user?.updated_at 
                          ? new Date(user.updated_at).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })
                          : 'Never'
                        }
                      </span>
                    </div>
                  </div>
                </Activity>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
