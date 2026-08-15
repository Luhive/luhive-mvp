export { loader } from "~/modules/integrations/providers/google-forms/server/form-detail-loader.server";

import { useState } from "react";
import { useLoaderData, useNavigate, Link, useNavigation } from "react-router";
import type { FormDetailLoaderData, ParsedResponse } from "~/modules/integrations/providers/google-forms/model/google-forms-types";
import { useDashboardContext } from "~/modules/dashboard/hooks/use-dashboard-context";
import { DashboardFormDetailSkeleton } from "~/modules/dashboard/components/dashboard-form-detail-skeleton";
import { Button } from "~/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/shared/components/ui/card";
import { ResponsesTable } from "~/modules/integrations/providers/google-forms/components/responses-table";
import { ResponseDetailModal } from "~/modules/integrations/providers/google-forms/components/response-detail-modal";
import { ArrowLeft, RefreshCw, ExternalLink, FileText, Users, Calendar, AlertCircle } from "lucide-react";
import { format } from "date-fns";

export default function FormResponsesPage() {
  useDashboardContext(); // ensure we're under dashboard layout
  const { formId, formTitle, formDescription, responderUri, questions, responses, totalResponses, error, communitySlug } = useLoaderData<FormDetailLoaderData>();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const [selectedResponse, setSelectedResponse] = useState<ParsedResponse | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isLoading = navigation.state === "loading";

  const handleRefresh = () => {
    setIsRefreshing(true);
    navigate(`/dashboard/${communitySlug}/forms/${formId}`, { replace: true });
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  if (isLoading && !error) {
    return <DashboardFormDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <Button variant="ghost" size="sm" className="w-fit" asChild>
          <Link to={`/dashboard/${communitySlug}/forms`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Forms
          </Link>
        </Button>
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="flex flex-col items-center gap-4 p-12 text-center">
            <AlertCircle className="h-12 w-12 text-destructive" />
            <div>
              <h3 className="font-semibold text-lg">Error Loading Form</h3>
              <p className="text-sm text-muted-foreground mt-1">{error}</p>
            </div>
            <Button onClick={() => navigate(`/dashboard/${communitySlug}/forms`)}>Return to Forms</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link to={`/dashboard/${communitySlug}/forms`}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Forms
        </Link>
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{formTitle}</h1>
              {formDescription && <p className="text-sm text-muted-foreground line-clamp-2">{formDescription}</p>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          {responderUri && (
            <Button variant="outline" size="sm" asChild>
              <a href={responderUri} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Form
              </a>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalResponses}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Questions</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{questions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latest Response</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {responses.length > 0 ? format(new Date(responses[0].lastSubmittedTime), "MMM d") : "-"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Responses</CardTitle>
          <CardDescription>Click on a response to view all answers</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsesTable responses={responses} questions={questions} onViewResponse={setSelectedResponse} />
        </CardContent>
      </Card>

      <ResponseDetailModal
        open={!!selectedResponse}
        onOpenChange={(open) => !open && setSelectedResponse(null)}
        response={selectedResponse}
        questions={questions}
        formTitle={formTitle}
      />
    </div>
  );
}
