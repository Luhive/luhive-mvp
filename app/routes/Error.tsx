import { Link, useNavigate } from "react-router";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";

import LuhiveLogo from '~/assets/images/LuhiveLogo.svg'

interface ErrorProps {
  message: string;
  details: string;
  stack?: string;
}

export default function ErrorComponent({ message, details, stack }: ErrorProps) {
  const is404 = message === "404";

  const navigate = useNavigate()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="text-center">
          <CardHeader className="space-y-6">
            {/* Luhive Logo */}
            <div className="flex items-center gap-6 justify-center">
              <img 
                src={LuhiveLogo}
                alt="Luhive" 
                className="h-12 w-auto"
              />
            </div>
            
            {/* Error Number/Message with gradient */}
            <div className="space-y-2">
              <h1 className="text-8xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
                {is404 ? "404" : "!"}
              </h1>
              <div className="w-24 h-1 bg-gradient-to-r from-primary to-accent mx-auto rounded-full"></div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <CardTitle className="text-2xl">
                {is404 ? "Page Not Found" : "Something Went Wrong"}
              </CardTitle>
              <CardDescription className="text-base">
                {is404 
                  ? "Oops! The page you're looking for seems to have wandered off into the digital void."
                  : details
                }
              </CardDescription>
            </div>
            
            {/* Stack trace for development */}
            {stack && import.meta.env.DEV && (
              <div className="text-left">
                <h3 className="text-sm font-semibold text-muted-foreground mb-2">Stack Trace:</h3>
                <pre className="w-full p-4 bg-muted rounded-md text-xs overflow-x-auto border">
                  <code className="text-muted-foreground">{stack}</code>
                </pre>
              </div>
            )}
            
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link to="/">
                  <svg 
                    className="w-4 h-4 mr-2" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" 
                    />
                  </svg>
                  Go Back
                </Link>
              </Button>
              
              <Button variant="outline" asChild className="w-full">
                <Link to="/login">
                  <svg 
                    className="w-4 h-4 mr-2" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" 
                    />
                  </svg>
                  Sign In
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* Decorative elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-accent/5 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}
