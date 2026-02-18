import { Link, useSubmit } from "react-router";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "~/shared/components/ui/avatar";
import { Button } from "~/shared/components/ui/button";
import LuhiveLogo from "~/assets/images/LuhiveLogo.svg";

interface TopNavigationProps {
  user?: { id: string; avatar_url?: string | null; full_name?: string | null } | null;
}

export function TopNavigation({ user }: TopNavigationProps) {
  const submit = useSubmit();

  const getAvatarContent = () => {
    if (user?.avatar_url) return null;
    if (user?.full_name) {
      return user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return "";
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 items-center justify-between">
        <div className="flex items-center gap-0">
          <Link to="/hub" prefetch="intent" className="flex items-center gap-3" viewTransition>
            <img className="h-5 w-5" src={LuhiveLogo} alt="Luhive Logo" />
            <h1 className="font-black text-xl tracking-tight">Luhive</h1>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="default"
            size="sm"
            className="underline-offset-4 bg-transparent hover:bg-transparent hidden sm:flex"
            asChild
          >
            <a href="https://tally.so/r/NpDVoG" target="_blank" rel="noopener noreferrer">
              <span className="text-sm text-primary/60 hover:text-primary transition-colors">
                Create Community
              </span>
            </a>
          </Button>

          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/profile">
                <div className="flex gap-2 items-center cursor-pointer hover:bg-muted/50 p-2 rounded-lg">
                  <Avatar className="h-8 w-8 border-2 cursor-pointer">
                    <AvatarImage src={user?.avatar_url || undefined} alt={user?.full_name || "User"} />
                    <AvatarFallback className="bg-gradient-avatar flex items-center justify-center">
                      {getAvatarContent()}
                  </AvatarFallback>
                </Avatar>
                  <p className="text-foreground/50 text-sm hidden sm:inline">{user?.full_name}</p>
                </div>
              </Link>

              <Button
                onClick={() => submit(null, { method: "post", action: "/logout" })}
                variant="link"
                className="hover:shadow-sm hover:scale-110 hover:text-red-500 text-foreground/50 cursor-pointer"
                size="icon"
                asChild
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="py-0 px-5 h-9 bg-primary/20 rounded-xl hover:bg-primary/30 active:bg-primary/40 transition-all"
              asChild
            >
              <Link to="/login">
                <p className="text-primary text-md">Sign In</p>
              </Link>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
