"use client";

import { Loader2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { setAvatarAction } from "@/app/settings/actions";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/primitives";
import { createClient } from "@/lib/supabase/client";

const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];

/** Resizes to a 400x400 square (center crop) before uploading. */
async function resizeImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const size = Math.min(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = 400;
  canvas.height = 400;
  canvas.getContext("2d")!.drawImage(bitmap, (bitmap.width - size) / 2, (bitmap.height - size) / 2, size, size, 0, 0, 400, 400);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not process image"))), "image/webp", 0.85));
}

export function AvatarUpload({ userId, name, avatarUrl }: { userId: string; name: string; avatarUrl: string | null }) {
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!AVATAR_TYPES.includes(file.type)) return toast.error("Use a JPG, PNG or WebP image.");
    if (file.size > 8 * 1024 * 1024) return toast.error("Images must be smaller than 8 MB.");
    setBusy(true);
    try {
      const blob = await resizeImage(file);
      const path = `${userId}/avatar-${Date.now()}.webp`;
      // Storage RLS only allows writes inside the user's own folder.
      const { error } = await createClient().storage.from("avatars").upload(path, blob, { contentType: "image/webp", upsert: false });
      if (error) throw error;
      const res = await setAvatarAction(path);
      if (!res?.ok) throw new Error(res?.message);
      toast.success("Photo updated.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  async function remove() {
    setBusy(true);
    const res = await setAvatarAction(null);
    setBusy(false);
    if (res?.ok) {
      toast.success("Photo removed.");
      router.refresh();
    } else toast.error(res?.message ?? "Could not remove photo.");
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar src={avatarUrl} name={name} size={80} />
      <div className="flex flex-wrap gap-2">
        <input ref={input} id="avatar-file" type="file" accept={AVATAR_TYPES.join(",")} className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
        <Button variant="secondary" onClick={() => input.current?.click()} disabled={busy}>
          {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Upload aria-hidden="true" />} Upload photo
        </Button>
        {avatarUrl ? (
          <Button variant="ghost" onClick={remove} disabled={busy}>
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  );
}

const DOC_TYPES = ["application/pdf", "image/jpeg", "image/png"];

/** Private certificate uploads (tutor-documents bucket, readable by the tutor and admins only). */
export function TutorDocumentUpload({ userId }: { userId: string }) {
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function onFile(file: File | undefined) {
    if (!file) return;
    if (!DOC_TYPES.includes(file.type)) return toast.error("Upload a PDF, JPG or PNG file.");
    if (file.size > 5 * 1024 * 1024) return toast.error("Files must be smaller than 5 MB.");
    setBusy(true);
    const safeName = file.name.replace(/[^\w.-]+/g, "_").slice(-80);
    const { error } = await createClient().storage.from("tutor-documents").upload(`${userId}/${Date.now()}-${safeName}`, file, { contentType: file.type });
    setBusy(false);
    if (input.current) input.current.value = "";
    if (error) return toast.error(error.message || "Upload failed.");
    toast.success("Document uploaded.");
    router.refresh();
  }

  return (
    <>
      <input ref={input} type="file" accept={DOC_TYPES.join(",")} className="sr-only" id="doc-file" onChange={(e) => onFile(e.target.files?.[0])} />
      <Button variant="secondary" size="sm" onClick={() => input.current?.click()} disabled={busy}>
        {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Upload aria-hidden="true" />} Upload certificate
      </Button>
    </>
  );
}
