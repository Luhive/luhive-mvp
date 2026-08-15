import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLoaderData } from "react-router";
import { BrowserQRCodeReader, type IScannerControls } from "@zxing/browser";
import { Camera, CheckCircle2, AlertTriangle, StopCircle, Loader2 } from "lucide-react";
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

type ScannerPhase = "idle" | "scanning" | "processing" | "success_hold";

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
  const SUCCESS_HOLD_MS = 3000;
  const DUPLICATE_COOLDOWN_MS = 4000;

  const { event, eventId, slug, error } = useLoaderData<ScannerLoaderData>();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const readerRef = useRef<BrowserQRCodeReader | null>(null);
  const holdTimeoutRef = useRef<number | null>(null);
  const lastTokenRef = useRef<{ token: string; scannedAt: number }>({ token: "", scannedAt: 0 });
  const isProcessingRef = useRef(false);

  const [isScanning, setIsScanning] = useState(false);
  const [phase, setPhase] = useState<ScannerPhase>("idle");
  const [manualToken, setManualToken] = useState("");
  const [scanResult, setScanResult] = useState<ScanResult>({ type: "idle" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isInteractionLocked = phase === "processing" || phase === "success_hold" || isSubmitting;

  const canScan = Boolean(event && eventId);
  const statusView = useMemo(() => {
    if (phase === "processing") {
      return {
        title: "Processing check-in...",
        subtitle: "Please hold your camera steady.",
        tone: "info",
      } as const;
    }

    if (phase === "success_hold" && scanResult.type === "success") {
      return {
        title: `Checked in ${scanResult.name}`,
        subtitle: "Great. Resuming scanner in a moment...",
        tone: "success",
      } as const;
    }

    if (scanResult.type === "already_attended") {
      return {
        title: "Already checked in",
        subtitle: "This attendee has already been processed.",
        tone: "warning",
      } as const;
    }

    if (scanResult.type === "not_approved") {
      return {
        title: "Registration not approved",
        subtitle: "Only approved attendees can check in.",
        tone: "warning",
      } as const;
    }

    if (scanResult.type === "invalid_token") {
      return {
        title: "Invalid QR token",
        subtitle: "Try scanning again or use manual token input.",
        tone: "warning",
      } as const;
    }

    if (scanResult.type === "forbidden") {
      return {
        title: "Permission denied",
        subtitle: "You are not allowed to check in this event.",
        tone: "error",
      } as const;
    }

    if (scanResult.type === "error") {
      return {
        title: "Scanner error",
        subtitle: scanResult.message,
        tone: "error",
      } as const;
    }

    if (!isScanning) {
      return {
        title: "Scanner is paused",
        subtitle: "Start scanner to begin checking in attendees.",
        tone: "idle",
      } as const;
    }

    return {
      title: "Ready to scan",
      subtitle: "Point camera at attendee QR code.",
      tone: "idle",
    } as const;
  }, [isScanning, phase, scanResult]);

  const clearHoldTimeout = () => {
    if (holdTimeoutRef.current) {
      window.clearTimeout(holdTimeoutRef.current);
      holdTimeoutRef.current = null;
    }
  };

  const stopScanning = () => {
    clearHoldTimeout();
    controlsRef.current?.stop();
    controlsRef.current = null;
    readerRef.current = null;
    isProcessingRef.current = false;
    setIsSubmitting(false);
    setIsScanning(false);
    setPhase("idle");
  };

  useEffect(() => {
    return () => stopScanning();
  }, []);

  const submitToken = async (rawToken: string) => {
    if (!eventId) return;
    const token = normalizeToken(rawToken);
    if (!token) return;
    if (isProcessingRef.current) return;

    const now = Date.now();
    const sameRecentToken =
      lastTokenRef.current.token === token && now - lastTokenRef.current.scannedAt < DUPLICATE_COOLDOWN_MS;
    if (sameRecentToken) return;

    isProcessingRef.current = true;
    lastTokenRef.current = { token, scannedAt: now };

    let shouldKeepLock = false;
    setIsSubmitting(true);
    setPhase("processing");
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
        setPhase("success_hold");
        shouldKeepLock = true;
        setIsSubmitting(false);

        clearHoldTimeout();
        holdTimeoutRef.current = window.setTimeout(() => {
          isProcessingRef.current = false;
          holdTimeoutRef.current = null;
          setScanResult({ type: "idle" });
          setPhase(controlsRef.current ? "scanning" : "idle");
        }, SUCCESS_HOLD_MS);
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
      if (!shouldKeepLock) {
        isProcessingRef.current = false;
        setPhase(controlsRef.current ? "scanning" : "idle");
      }
    }
  };

  const startScanning = async () => {
    if (!canScan || !videoRef.current || isScanning || isInteractionLocked) return;

    setScanResult({ type: "idle" });
    setPhase("scanning");
    const reader = new BrowserQRCodeReader();
    readerRef.current = reader;

    try {
      const controls = await reader.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result) => {
          if (!result) return;
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
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="space-y-1 px-1">
          <h1 className="text-2xl font-semibold tracking-tight">Event Scanner</h1>
          <p className="text-sm text-muted-foreground">
            {event.title} · Check in attendees with QR
          </p>
        </div>

        <div className="rounded-xl border overflow-hidden bg-black/95 relative">
          <video ref={videoRef} className="w-full aspect-video object-cover" muted playsInline />
          <div className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs text-white">
            {isScanning ? "Live" : "Paused"}
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4 space-y-4">
          <div
            className={`rounded-lg border p-3 ${
              statusView.tone === "success"
                ? "border-green-300 bg-green-50"
                : statusView.tone === "warning"
                  ? "border-amber-300 bg-amber-50"
                  : statusView.tone === "error"
                    ? "border-red-300 bg-red-50"
                    : statusView.tone === "info"
                      ? "border-blue-300 bg-blue-50"
                      : "border-border bg-background"
            }`}
          >
            <div className="flex items-start gap-2">
              {phase === "processing" ? (
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin mt-0.5" />
              ) : statusView.tone === "success" ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 animate-pulse" />
              ) : statusView.tone === "warning" || statusView.tone === "error" ? (
                <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              ) : (
                <Camera className="h-5 w-5 text-muted-foreground mt-0.5" />
              )}
              <div>
                <p className="text-sm font-medium">{statusView.title}</p>
                <p className="text-xs text-muted-foreground">{statusView.subtitle}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={startScanning}
              disabled={isScanning || isInteractionLocked}
              className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm disabled:opacity-60"
            >
              <Camera className="h-4 w-4" />
              Start scanner
            </button>
            <button
              type="button"
              onClick={stopScanning}
              disabled={!isScanning}
              className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm disabled:opacity-60"
            >
              <StopCircle className="h-4 w-4" />
              Stop
            </button>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Manual token check-in
            </p>
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
                disabled={isInteractionLocked || manualToken.trim().length === 0}
                className="rounded-md border px-4 py-2 text-sm disabled:opacity-60"
              >
                Check in
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
