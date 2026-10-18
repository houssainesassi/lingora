import "server-only";

import { AccessToken } from "livekit-server-sdk";

/** Server-only LiveKit configuration. The API secret never reaches the browser. */
export function liveKitConfig() {
  const url = process.env.LIVEKIT_URL ?? "";
  const apiKey = process.env.LIVEKIT_API_KEY ?? "";
  const apiSecret = process.env.LIVEKIT_API_SECRET ?? "";
  return { url, apiKey, apiSecret, configured: Boolean(url && apiKey && apiSecret) };
}

export function lessonRoomName(bookingId: string) {
  return `lesson-${bookingId}`;
}

export async function createLessonToken(opts: { bookingId: string; userId: string; name: string; expiresAt: Date }) {
  const { apiKey, apiSecret } = liveKitConfig();
  const ttlSeconds = Math.max(60, Math.floor((opts.expiresAt.getTime() - Date.now()) / 1000));
  const token = new AccessToken(apiKey, apiSecret, { identity: opts.userId, name: opts.name || "Participant", ttl: ttlSeconds });
  token.addGrant({
    room: lessonRoomName(opts.bookingId),
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: false,
    // No recording/egress or admin rights are granted.
    roomRecord: false,
    roomAdmin: false,
  });
  return token.toJwt();
}
