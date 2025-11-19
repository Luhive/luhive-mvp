import { Link } from "react-router";
import { Card, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { CheckCircle2, Sparkles, ArrowLeft } from "lucide-react";

export function meta({}: {}) {
  return [
    { title: "Request Submitted - Luhive" },
    { name: "description", content: "Your community request has been submitted successfully" },
  ];
}

export default function CreateCommunitySuccess() {
  return (
    <div className="min-h-screen bg-background">
      <main className="w-full py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-primary/20">
            <CardContent className="p-8 sm:p-12">
              <div className="text-center space-y-6">
                {/* Success Icon */}
                <div className="flex justify-center">
                  <div className="rounded-full bg-primary/10 p-4">
                    <CheckCircle2 className="h-12 w-12 text-primary" />
                  </div>
                </div>

                {/* Header */}
                <div className="space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <Sparkles className="lg:block hidden h-6 w-6 text-primary" />
                    <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
                      Request Submitted!
                    </h1>
                  </div>
                  <p className="text-lg text-muted-foreground">
                    Thank you for your interest in creating a community on Luhive
                  </p>
                </div>

                {/* Message */}
                <div className="space-y-4 pt-4">
                  <p className="text-base leading-relaxed text-foreground">
                    We've received your community request and added it to our waitlist. 
                    Our team will review your submission carefully.
                  </p>
                  
                  <div className="rounded-lg p-4 bg-muted/50 border border-primary/10">
                    <p className="text-sm leading-relaxed text-foreground">
                      <strong className="text-foreground">What happens next?</strong>
                      <br />
                      We're currently in beta and manually reviewing each community request 
                      to ensure quality and alignment with our platform. You'll receive an 
                      email notification once your community has been reviewed.
                    </p>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    We appreciate your patience and look forward to potentially welcoming 
                    your community to Luhive!
                  </p>
                </div>

                {/* Actions */}
                <div className="pt-4">
                  <Button asChild variant="default" className="min-w-[140px]">
                    <Link to="/">
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Back to Hub
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

