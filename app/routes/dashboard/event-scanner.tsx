import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLoaderData } from "react-router";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { Camera, CheckCircle2, AlertTriangle, StopCircle } from "lucide-react";
import { getCommunityBySlugClient } from "~/modules/dashboard/data/dashboard-repo.client";
import { getEventByIdClient } from "~/modules/events/data/events-repo.client";
import { createClient } from "~/shared/lib/supabase/client";
import type { Database } from "~/shared/models/database.types";

type Event = Database["public"]["Tables"]["events"]["Row"];

type ScannerLoaderData = {
  event: Event | null;
  eventId: string | null;
  slug: string | null;
  error: string | null;
};

type ScanResult =
  | { type: "idle" }
  | { type: "success"; name: string; attendedAt: string }
  | { type: "already_attended" }
  | { type: "not_approved" }
  | { type: "invalid_token" }
  | { type: "forbidden" }
  | { type: "error"; message: string };

async function clientLoader({
  params,
}: {
  params: { slug?: string; eventId?: string };
}): Promise<ScannerLoaderData> {
  const slug = params.slug ?? null;
  const eventId = params.eventId ?? null;

  if (!slug || !eventId) {
    return { event: null, eventId, slug, error: "Missing community or event id" };
  }

  const { community, error: communityError } = await getCommunityBySlugClient(slug);
  if (communityError || !community) {
    return { event: null, eventId, slug, error: "Community not found" };
  }

  const { event } = await getEventByIdClient(eventId, community.id);
  if (event) {
    return { event, eventId, slug, error: null };
  }

  try {
    const supabase = createClient();
    const { data: coHostEvent } = await supabase
      .from("events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (coHostEvent) {
      const { data: collaboration } = await supabase
        .from("event_collaborations")
        .select("id")
        .eq("event_id", eventId)
        .eq("community_id", community.id)
        .eq("status", "accepted")
        .eq("role", "co-host")
        .single();

      if (collaboration) {
        return { event: coHostEvent as Event, eventId, slug, error: null };
      }
    }
  } catch {
    // Keep the returned error below.
  }

  return {
    event: null,
    eventId,
    slug,
    error: "You do not have permission to scan for this event",
  };
}

export { clientLoader };

export function meta() {
  return [
    { title: "Event QR Scanner - Dashboard" },
    { name: "description", content: "Scan attendee QR codes for check-in" },
  ];
}

function normalizeToken(rawValue: string) {
  const value = rawValue.trim();
  if (!value) return "";

  try {
    const parsed = new URL(value);
    const tokenFromQuery = parsed.searchParams.get("token");
    return tokenFromQuery?.trim() || value;
  } catch {
    return value;
  }
}

export default function EventScannerPage() {
  const { event, eventId, slug, error } = useLoaderData<ScannerLoaderData>();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult>({ type: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canScan = Boolean(event && eventId);
  const scannerLabel = useMemo(() => {
    if (scanResult.type === "success") return `Checked in ${scanResult.name}`;
    if (scanResult.type === "already_attended") return "This attendee is already checked in";
    if (scanResult.type === "not_approved") return "Registration is not approved";
    if (scanResult.type === "invalid_token") return "Invalid QR token";
    if (scanResult.type === "forbidden") return "You are not allowed to check in this event";
    if (scanResult.type === "error") return scanResult.message;
    return "Scan a QR code to check in an attendee";
  }, [scanResult]);

  const stopScanning = () => {
    controlsRef.current?.stop();
    controlsRef.current = null;
    readerRef.current = null;
    setIsScanning(false);
  };

  useEffect(() => {
    return () => stopScanning();
  }, []);

  const submitToken = async (rawToken: string) => {
    if (!eventId) return;
    const token = normalizeToken(rawToken);
    if (!token) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/events/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, eventId }),
      });

      const payload = (await response.json()) as
        | { error?: string; success?: boolean; name?: string; attendedAt?: string }
        | undefined;

      if (response.ok && payload?.success) {
        setScanResult({
          type: "success",
          name: payload.name || "Attendee",
          attendedAt: payload.attendedAt || new Date().toISOString(),
        });
        return;
      }

      switch (payload?.error) {
        case "already_attended":
          setScanResult({ type: "already_attended" });
          break;
        case "not_approved":
          setScanResult({ type: "not_approved" });
          break;
        case "invalid_token":
          setScanResult({ type: "invalid_token" });
          break;
        case "forbidden":
          setScanResult({ type: "forbidden" });
          break;
        default:
          setScanResult({ type: "error", message: "Failed to check in attendee" });
      }
    } catch {
      setScanResult({ type: "error", message: "Scanner request failed. Please retry." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const startScanning = async () => {
    if (!canScan || !videoRef.current || isScanning) return;

    setScanResult({ type: "idle" });
    const reader = new BrowserQRCodeReader();
    readerRef.current = reader;

    try {
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result) => {
          if (!result || isSubmitting) return;
          void submitToken(result.getText());
        }
      );

      controlsRef.current = controls;
      setIsScanning(true);
    } catch {
      stopScanning();
      setScanResult({
        type: "error",
        message: "Unable to access camera. Use manual token input below.",
      });
    }
  };

  if (!canScan || !eventId || !event) {
    return (
      <div className="py-4 px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <div className="rounded-lg border bg-card p-6 text-center space-y-3">
            <h1 className="text-xl font-semibold">Scanner unavailable</h1>
            <p className="text-muted-foreground">{error || "Event not found."}</p>
            {slug ? (
              <Link
                to={`/dashboard/${slug}/events`}
                className="inline-flex text-sm underline underline-offset-4"
              >
                Back to events
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 px-4 md:px-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">QR Scanner</h1>
          <p className="text-sm text-muted-foreground">{event.title}</p>
        </div>

        <div className="rounded-xl border overflow-hidden bg-black/95">
          <video ref={videoRef} className="w-full aspect-video object-cover" muted playsInline />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={startScanning}
            disabled={isScanning}
            className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm disabled:opacity-60"
          >
            <Camera className="h-4 w-4" />
            Start Scanner
          </button>
          <button
            type="button"
            onClick={stopScanning}
            disabled={!isScanning}
            className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm disabled:opacity-60"
          >
            <StopCircle className="h-4 w-4" />
            Stop Scanner
          </button>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <p className="text-sm font-medium mb-2">Manual token check-in</p>
          <div className="flex gap-2">
            <input
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Paste token or QR URL"
              className="flex-1 rounded-md border bg-background px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void submitToken(manualToken)}
              disabled={isSubmitting || manualToken.trim().length === 0}
              className="rounded-md border px-4 py-2 text-sm disabled:opacity-60"
            >
              Check In
            </button>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2">
            {scanResult.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            ) : scanResult.type === "idle" ? (
              <Camera className="h-5 w-5 text-muted-foreground" />
            ) : (
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            )}
            <p className="text-sm">{scannerLabel}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
