import { useState, useEffect, Activity } from "react";
import { Link, useLocation, useSubmit } from "react-router";
import { Search, Bell, Calendar, LayoutGrid, Compass, Sparkle, LogOut, LogIn } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import LuhiveLogo from '~/assets/images/LuhiveLogo.svg'

interface TopNavigationProps {
  user?: { id: string; avatar_url?: string | null; full_name?: string | null } | null;
}

export function TopNavigation({ user }: TopNavigationProps) {

  const submit = useSubmit()
  // const location = useLocation();
  // const [currentTime, setCurrentTime] = useState<string>("");
  // const [notificationCount, setNotificationCount] = useState(0);

  // useEffect(() => {
  //   const updateTime = () => {
  //     const now = new Date();
  //     const timeStr = now.toLocaleTimeString("en-US", {
  //       hour: "numeric",
  //       minute: "2-digit",
  //       hour12: true,
  //     }); 
  //     const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  //     setCurrentTime(`${timeStr} ${timezone}`);
  //   };

  //   updateTime();
  //   const interval = setInterval(updateTime, 1000 * 60); // Update every minute

  //   return () => clearInterval(interval);
  // }, []);

  // const navigationItems = [
  //   { path: "/events", label: "Events", icon: Calendar },
  //   { path: "/calendars", label: "Calendars", icon: LayoutGrid },
  //   { path: "/discover", label: "Discover", icon: Compass },
  // ];

  const getAvatarContent = () => {
    // If user has avatar, show it, otherwise show initials or smiley
    if (user?.avatar_url) {
      return null; // Avatar image will be shown
    }

    if (user?.full_name) {
      const initials = user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      return initials;
    }

    // Show smiley face as fallback
    return "";
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="px-4 lg:container lg:px-0 mx-auto flex h-16 items-center justify-between">
        {/* Left: Logo/Navigation */}
        <div className="flex items-center gap-0">
          <Link to="/" className="flex items-center gap-3">
            <img className="h-5 w-5" src={LuhiveLogo} alt="Luhive Logo" />
            <h1 className="font-black text-xl tracking-tight">Luhive</h1>
          </Link>

          {/* <div className="hidden md:flex items-center gap-6">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname.startsWith(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-2 text-sm font-medium transition-colors hover:text-primary",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </div> */}
        </div>

        {/* Right: Time, Actions, User */}
        <Activity mode={user ? 'visible' : "hidden"}>
          <div className="flex items-center gap-2">
            {/* Time Display */}
            {/* <div className="hidden lg:block text-sm text-muted-foreground">
            {currentTime}
          </div> */}

            {/* Create Event Button */}
            {/* <Button variant="default" size="sm" asChild>
            <Link to="/events/create">Create Event</Link>
          </Button> */}

            {/* Search Icon */}
            {/* <Button variant="ghost" size="icon" asChild>
            <Link to="#">
              <Search className="h-5 w-5" />
            </Link>
          </Button> */}


            {/* Notifications with badge */}
            {/* <Button variant="ghost" size="icon" className="relative" asChild>
            <Link to="/notifications">
              <Bell className="h-5 w-5" />
              {0 > 0 && (
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500" />
              )}
            </Link>
          </Button> */}

            {/* User Avatar */}



            <Link to="/profile">
              <div className="flex gap-2 items-center cursor-pointer hover:bg-muted/50 p-2 rounded-lg">
                <Avatar className="h-8 w-8 border-2 cursor-pointer">
                  <AvatarImage src={user?.avatar_url || undefined} alt={user?.full_name || "User"} />
                  <AvatarFallback className="bg-gradient-avatar flex items-center justify-center">
                    {getAvatarContent()}
                  </AvatarFallback>
                </Avatar>
                <p className="text-foreground/50 text-sm">{user?.full_name}</p>
              </div>
            </Link>

            <Button onClick={() => {
              submit(null, {
                method: "post",
                action: "/logout"
              })
            }} variant="link" className="hover:shadow-sm hover:scale-110 hover:text-red-500 text-foreground/50 cursor-pointer" size="icon" asChild>

              <LogOut className="h-4 w-4" />

            </Button>
          </div>
        </Activity>
        <Activity mode={user ? 'hidden' : 'visible'}>
          <Button variant="ghost" className="hover:opacity-45 hover:bg-transparent transition-all" asChild>
            <Link to="/login">
              <LogIn className="h-5 w-5 text-primary" />
              <p className="text-primary">Sign In</p> 
            </Link>
          </Button>
        </Activity>
      </div>
    </nav>
  );
}

