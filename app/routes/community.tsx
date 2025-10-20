import type { Route } from "./+types/community";

import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar"
import { Button } from "~/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Badge } from "~/components/ui/badge"
import {
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Send,
  MessageCircle,
  Calendar,
  Users,
  BookOpen,
  Sparkles,
  ArrowRight,
  LayoutDashboard,
  BadgeCheck,
  Heart,
} from "lucide-react"

import LuhiveLogo from "~/assets/images/LuhiveLogo.png";


export function meta({}: Route.MetaArgs) {
  return [
    { title: "Community Page" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Community() {
  return (
    <div className="min-h-screen bg-background">
      <main className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-[minmax(120px,auto)]">
            {/* Profile Card - Large */}
            <Card className="md:col-span-2 lg:col-span-2 lg:row-span-2 border hover:border-primary/30 transition-colors shadow-none">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full space-y-4">
                <Avatar className="h-24 w-24 border-1">
                  <AvatarImage src={LuhiveLogo} alt="GDG Baku" className="transform scale-60" />
                  <AvatarFallback className="text-2xl bg-primary/10 text-primary">Luhive</AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h1 className="text-4xl font-black text-foreground tracking-tight">Luhive</h1>
                  <p className="text-lg text-primary font-medium">Build Communities that Matter</p>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
                    a community builder and hub platform that engages people and communities together 
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 border-primary/30 text-primary px-3 py-1.5"
                  >
                    <Heart className="h-3.5 w-3.5" />
                    First Adopter
                  </Badge>
                  <Badge
                    variant="outline"
                    className="flex items-center gap-1 border-emerald-400/40 text-emerald-600 dark:text-emerald-400 px-3 py-1.5"
                  >
                    <BadgeCheck className="h-3.5 w-3.5" />
                    Verified by Luhive
                  </Badge>
                </div>
                <div className="flex justify-center gap-2 flex-wrap pt-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                    aria-label="Twitter"
                  >
                    <Twitter className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                    aria-label="Telegram"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200"
                    aria-label="Discord"
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card 1 */}
            <Card className="border hover:border-primary/30 transition-colors shadow-none">
              <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center space-y-2">
                <Users className="h-10 w-10 text-primary" />
                <p className="text-3xl font-bold text-foreground">2.5K+</p>
                <p className="text-sm text-muted-foreground">Members</p>
              </CardContent>
            </Card>

            {/* Stats Card 2 */}
            <Card className="border hover:border-primary/30 shadow-none">
              <CardContent className="p-6 flex flex-col items-center justify-center h-full text-center space-y-2">
                <Calendar className="h-10 w-10 text-primary" />
                <p className="text-3xl font-bold text-foreground">48</p>
                <p className="text-sm text-muted-foreground">Events</p>
              </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="lg:col-span-2 lg:row-span-2 border hover:border-primary/30 transition-colors shadow-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                  <Sparkles className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <Button className="group relative overflow-hidden w-full rounded-[6px] hover:bg-primary/90 h-12 text-sm font-medium transition-all duration-200 border-primary border-solid border text-card-foreground bg-background">
                  <span className="pointer-events-none absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />
                  <span className="flex w-full items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4 opacity-90 text-primary" />
                      <span className="text-primary">Join Our Community</span>
                    </span>
                    <ArrowRight className="h-4 w-4 translate-x-0 transition-transform duration-200 group-hover:translate-x-1 text-primary" />
                  </span>
                </Button>

                <Button className="group relative overflow-hidden w-full rounded-[6px] hover:bg-primary/90 h-12 text-sm font-medium transition-all duration-200 border-primary border-solid border text-card-foreground bg-background">
                  <span className="pointer-events-none absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />
                  <span className="flex w-full items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 opacity-90 text-primary" />
                      <span className="text-primary">View Upcoming Events</span>
                    </span>
                    <ArrowRight className="h-4 w-4 translate-x-0 transition-transform duration-200 group-hover:translate-x-1 text-primary" />
                  </span>
                </Button>

                <Button className="group relative overflow-hidden w-full rounded-[6px] hover:bg-primary/90 h-12 text-sm font-medium transition-all duration-200 border-primary border-solid border text-card-foreground bg-background">
                  <span className="pointer-events-none absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />
                  <span className="flex w-full items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4 opacity-90 text-primary" />
                      <span className="text-primary">Read Latest Posts</span>
                    </span>
                    <ArrowRight className="h-4 w-4 translate-x-0 transition-transform duration-200 group-hover:translate-x-1 text-primary" />
                  </span>
                </Button>

                <Button className="group relative overflow-hidden w-full rounded-[6px] hover:bg-primary/90 h-12 text-sm font-medium transition-all duration-200 border-primary border-solid border text-card-foreground bg-background">
                  <span className="pointer-events-none absolute inset-0 -translate-x-[120%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[120%]" />
                  <span className="flex w-full items-center justify-between gap-3">
                    <span className="flex items-center gap-2">
                      <LayoutDashboard className="h-4 w-4 opacity-90 text-primary" />
                      <span className="text-primary">Access Dashboard</span>
                    </span>
                    <ArrowRight className="h-4 w-4 translate-x-0 transition-transform duration-200 group-hover:translate-x-1 text-primary" />
                  </span>
                </Button>
              </CardContent>
            </Card>

            {/* Upcoming Events Card */}
            <Card className="md:col-span-2 lg:col-span-2 lg:row-span-2 border hover:border-primary/30 transition-colors shadow-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                  <Calendar className="h-5 w-5" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="p-4 rounded-lg border bg-muted border-solid border-border">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-sm">Android Development Workshop</h3>
                        <p className="text-xs text-muted-foreground mt-1">March 15, 2025 • 6:00 PM</p>
                      </div>
                      <Badge variant="outline" className="text-secondary-foreground border-border">
                        Workshop
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted border">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-sm">Cloud Architecture Talk</h3>
                        <p className="text-xs text-muted-foreground mt-1">March 22, 2025 • 7:00 PM</p>
                      </div>
                      <Badge variant="outline" className="text-muted-foreground">
                        Talk
                      </Badge>
                    </div>
                  </div>
                  <div className="p-4 rounded-lg bg-muted border">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground text-sm">Community Networking Night</h3>
                        <p className="text-xs text-muted-foreground mt-1">March 29, 2025 • 6:30 PM</p>
                      </div>
                      <Badge variant="outline" className="text-muted-foreground">
                        Social
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Posts Card */}
            <Card className="md:col-span-2 lg:col-span-4 border hover:border-primary/30 transition-colors shadow-none">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-foreground">
                  <BookOpen className="h-5 w-5" />
                  Recent Posts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-muted border hover:border-primary/30 transition-colors">
                    <h3 className="font-semibold text-foreground text-sm mb-2">Getting Started with Flutter</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Learn the basics of Flutter development and build your first mobile app...
                    </p>
                    <p className="text-xs text-muted-foreground/70">2 days ago</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted border hover:border-primary/30 transition-colors">
                    <h3 className="font-semibold text-foreground text-sm mb-2">Firebase Best Practices</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      Discover tips and tricks for optimizing your Firebase implementation...
                    </p>
                    <p className="text-xs text-muted-foreground/70">5 days ago</p>
                  </div>
                  <div className="p-4 rounded-lg bg-muted border hover:border-primary/30 transition-colors">
                    <h3 className="font-semibold text-foreground text-sm mb-2">Community Highlights 2024</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      A look back at our amazing year of events, workshops, and growth...
                    </p>
                    <p className="text-xs text-muted-foreground/70">1 week ago</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="md:col-span-2 lg:col-span-4 text-center py-4">
              <p className="text-sm text-muted-foreground">Powered by Luhive © 2025</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
