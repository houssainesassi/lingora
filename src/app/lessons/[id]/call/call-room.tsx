"use client";

import "@livekit/components-styles";

import {
  ControlBar,
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useConnectionState,
  useParticipants,
  useTracks,
} from "@livekit/components-react";
import { ConnectionState, MediaDeviceFailure, Track, type DisconnectReason } from "livekit-client";
import { Loader2, Mic, PhoneOff, Video } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Button, ButtonLink } from "@/components/ui/button";
import { Alert, Card } from "@/components/ui/primitives";

type Mode = "video" | "audio";
type Phase = { kind: "prejoin" } | { kind: "connecting"; mode: Mode } | { kind: "live"; mode: Mode; token: string; url: string } | { kind: "ended"; reason?: string } | { kind: "error"; message: string };

export function CallRoom({ bookingId, title, startsAt, endsAt, closesAt }: { bookingId: string; title: string; startsAt: string; endsAt: string; closesAt: string }) {
  const [phase, setPhase] = useState<Phase>({ kind: "prejoin" });

  async function join(mode: Mode) {
    setPhase({ kind: "connecting", mode });
    try {
      const res = await fetch("/api/livekit/token", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bookingId }) });
      const json = (await res.json()) as { token?: string; url?: string; error?: string };
      if (!res.ok || !json.token || !json.url) throw new Error(json.error ?? "Could not join the lesson.");
      setPhase({ kind: "live", mode, token: json.token, url: json.url });
    } catch (e) {
      setPhase({ kind: "error", message: e instanceof Error ? e.message : "Could not join the lesson." });
    }
  }

  if (phase.kind === "live") {
    return (
      <div className="flex flex-1 flex-col bg-[#0f1117]" data-lk-theme="default">
        <LiveKitRoom
          serverUrl={phase.url}
          token={phase.token}
          connect
          audio
          video={phase.mode === "video"}
          className="flex flex-1 flex-col"
          onDisconnected={(reason?: DisconnectReason) => setPhase({ kind: "ended", reason: reason !== undefined ? String(reason) : undefined })}
          onError={(err) => toast.error(`Call error: ${err.message}`)}
          onMediaDeviceFailure={(failure, kind) => {
            const device = kind === "videoinput" ? "camera" : kind === "audioinput" ? "microphone" : "device";
            if (failure === MediaDeviceFailure.PermissionDenied) toast.error(`Permission to use your ${device} was denied. Allow access in your browser settings, then turn it on again.`);
            else if (failure === MediaDeviceFailure.NotFound) toast.error(`No ${device} was found.`);
            else if (failure === MediaDeviceFailure.DeviceInUse) toast.error(`Your ${device} is being used by another application.`);
            else toast.error(`Your ${device} could not be started.`);
          }}
        >
          <CallHeader title={title} startsAt={startsAt} endsAt={endsAt} closesAt={closesAt} />
          <Stage />
          <ControlBar controls={{ microphone: true, camera: true, screenShare: true, chat: false, leave: true }} variation="minimal" />
          <RoomAudioRenderer />
        </LiveKitRoom>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-gradient-to-b from-primary-soft/50 to-background px-4 py-12">
      <Card className="w-full max-w-md p-6 text-center">
        <h1 className="text-xl font-semibold">{title}</h1>
        {phase.kind === "prejoin" || phase.kind === "connecting" ? (
          <>
            <p className="mt-2 text-sm text-muted-foreground">Your browser will ask for microphone (and camera) access. Lessons are not recorded.</p>
            <div className="mt-6 grid gap-2">
              <Button size="lg" onClick={() => join("video")} disabled={phase.kind === "connecting"}>
                {phase.kind === "connecting" && phase.mode === "video" ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Video aria-hidden="true" />}
                Join with video
              </Button>
              <Button size="lg" variant="secondary" onClick={() => join("audio")} disabled={phase.kind === "connecting"}>
                {phase.kind === "connecting" && phase.mode === "audio" ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Mic aria-hidden="true" />}
                Join with audio only
              </Button>
            </div>
          </>
        ) : null}
        {phase.kind === "error" ? (
          <div className="mt-4 space-y-4 text-left">
            <Alert tone="danger" title="Could not join">
              {phase.message}
            </Alert>
            <Button className="w-full" onClick={() => setPhase({ kind: "prejoin" })}>
              Try again
            </Button>
          </div>
        ) : null}
        {phase.kind === "ended" ? (
          <div className="mt-4 space-y-4">
            <p className="flex items-center justify-center gap-2 text-muted-foreground">
              <PhoneOff className="size-4" aria-hidden="true" /> You left the lesson.
            </p>
            <Button className="w-full" onClick={() => setPhase({ kind: "prejoin" })}>
              Rejoin
            </Button>
          </div>
        ) : null}
        <ButtonLink href={`/bookings/${bookingId}`} variant="ghost" className="mt-3 w-full">
          Back to lesson details
        </ButtonLink>
      </Card>
    </div>
  );
}

function Stage() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );
  const participants = useParticipants();
  return (
    <div className="relative min-h-0 flex-1">
      <GridLayout tracks={tracks} style={{ height: "calc(100dvh - 12rem)" }}>
        <ParticipantTile />
      </GridLayout>
      {participants.length < 2 ? (
        <p role="status" className="absolute inset-x-0 top-4 mx-auto w-fit rounded-full bg-black/60 px-4 py-1.5 text-sm text-white">
          Waiting for the other participant to join…
        </p>
      ) : null}
    </div>
  );
}

function CallHeader({ title, startsAt, endsAt, closesAt }: { title: string; startsAt: string; endsAt: string; closesAt: string }) {
  const state = useConnectionState();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const start = new Date(startsAt).getTime();
  const elapsed = Math.max(0, Math.floor((now - start) / 1000));
  const remaining = Math.floor((new Date(endsAt).getTime() - now) / 1000);
  const fmt = (s: number) => `${String(Math.floor(Math.abs(s) / 60)).padStart(2, "0")}:${String(Math.abs(s) % 60).padStart(2, "0")}`;
  const closingSoon = new Date(closesAt).getTime() - now < 5 * 60_000;

  const label: Record<ConnectionState, string> = {
    [ConnectionState.Connected]: "Connected",
    [ConnectionState.Connecting]: "Connecting…",
    [ConnectionState.Reconnecting]: "Reconnecting…",
    [ConnectionState.SignalReconnecting]: "Reconnecting…",
    [ConnectionState.Disconnected]: "Disconnected",
  };
  const color = state === ConnectionState.Connected ? "bg-emerald-400" : state === ConnectionState.Disconnected ? "bg-red-400" : "bg-amber-400";

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm text-white">
      <div className="flex items-center gap-3">
        <Link href="/bookings" className="text-white/70 hover:text-white">
          Lessons
        </Link>
        <span className="font-medium">{title}</span>
      </div>
      <div className="flex items-center gap-4 tabular-nums">
        <span className="flex items-center gap-2" role="status" aria-live="polite">
          <span className={`size-2 rounded-full ${color}`} aria-hidden="true" />
          {label[state]}
        </span>
        <span aria-label="Lesson time">{now < start ? `Starts in ${fmt(Math.floor((start - now) / 1000))}` : remaining >= 0 ? `${fmt(elapsed)} · ${fmt(remaining)} left` : `${fmt(elapsed)} · overtime`}</span>
        {closingSoon ? <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-amber-200">Room closes soon</span> : null}
      </div>
    </div>
  );
}
