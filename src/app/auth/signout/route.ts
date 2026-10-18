import { NextResponse, type NextRequest } from "next/server";

import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

// POST only, so sign-out cannot be triggered by a link or image (CSRF).
export async function POST(request: NextRequest) {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/", request.nextUrl.origin), { status: 303 });
}
