"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, Trash2, ImagePlus } from "lucide-react";

interface ProfileUser {
  id: string;
  name: string;
  email: string;
  role: string;
  subRole: string | null;
  department: string | null;
  avatar: string | null;
  createdAt: string;
  isActive: boolean;
}

const ACCEPTED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
]);
const MAX_BYTES = 4 * 1024 * 1024;

function getInitials(name: string | null | undefined): string {
  if (!name) return "U";
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return iso;
  }
}

function getDeptLabel(dept: string | null): string | null {
  if (!dept) return null;
  const map: Record<string, string> = {
    AUDIT: "Audit & Advisory",
    ACCOUNTING_TAX: "Accounting & Tax",
    BOOKKEEPING_PAYROLL: "Bookkeeping & Payroll",
    LEGAL: "Legal Advisory",
    ADVISORY: "Advisory Services",
    HR: "HR & Payroll",
    MARKETING: "Marketing",
    FINANCE: "Finance",
  };
  return map[dept] ?? dept;
}

export default function ProfilePage() {
  const router = useRouter();
  const { update: updateSession } = useSession();
  const [user, setUser] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchProfile() {
    try {
      const res = await fetch("/api/profile", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setUser(data.user);
    } catch {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  function validateClientSide(file: File): string | null {
    if (!ACCEPTED_TYPES.has(file.type)) {
      return "Unsupported file type. Please upload a PNG, JPG, WebP, or GIF image.";
    }
    if (file.size > MAX_BYTES) {
      return "Image is too large. Maximum size is 4 MB.";
    }
    return null;
  }

  async function uploadAvatar(file: File) {
    const clientError = validateClientSide(file);
    if (clientError) {
      toast.error(clientError);
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to upload avatar");
        return;
      }
      setUser((prev) => (prev ? { ...prev, avatar: data.avatar } : prev));
      // Refresh the JWT/session so the sidebar (and anywhere else reading
      // session.user.avatar) sees the new picture without a re-login.
      await updateSession();
      // Let any listeners know (sidebar listens for this).
      window.dispatchEvent(
        new CustomEvent("profile:avatar-updated", { detail: { avatar: data.avatar } })
      );
      toast.success("Avatar updated");
      router.refresh();
    } catch {
      toast.error("Failed to upload avatar");
    } finally {
      setUploading(false);
    }
  }

  async function removeAvatar() {
    if (!user?.avatar) return;
    setRemoving(true);
    try {
      const res = await fetch("/api/profile/avatar", { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error || "Failed to remove avatar");
        return;
      }
      setUser((prev) => (prev ? { ...prev, avatar: null } : prev));
      await updateSession();
      window.dispatchEvent(
        new CustomEvent("profile:avatar-updated", { detail: { avatar: null } })
      );
      toast.success("Avatar removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove avatar");
    } finally {
      setRemoving(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      void uploadAvatar(file);
    }
    // reset so picking the same file again re-fires
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      void uploadAvatar(file);
    }
  }

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-600 dark:text-brand-400" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <p className="text-red-500">{error || "Profile unavailable"}</p>
      </div>
    );
  }

  const initials = getInitials(user.name);
  const deptLabel = getDeptLabel(user.department);

  return (
    <div className="p-3 md:p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-lg font-semibold text-brand-700 dark:text-brand-300">
            Profile
          </h1>
          <p className="text-sm text-muted-foreground">
            Manage your account and avatar
          </p>
        </div>

        {/* Card 1 — Avatar */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile picture</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                if (!dragging) setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              className={`relative flex size-36 items-center justify-center rounded-full ring-2 transition-all ${
                dragging
                  ? "ring-brand-500 ring-offset-2 ring-offset-background scale-[1.02]"
                  : "ring-border"
              } overflow-hidden bg-brand-100 dark:bg-brand-900/40`}
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              aria-label="Upload avatar"
            >
              {user.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.avatar}
                  alt={`${user.name}'s avatar`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl font-semibold text-brand-700 dark:text-brand-300 select-none">
                  {initials}
                </span>
              )}

              {uploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/70">
                  <Loader2 className="h-6 w-6 animate-spin text-brand-600 dark:text-brand-400" />
                </div>
              )}

              {dragging && !uploading && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-brand-500/20">
                  <ImagePlus className="h-8 w-8 text-brand-700 dark:text-brand-300" />
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || removing}
                className="bg-brand-600 hover:bg-brand-700 text-white"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-1" />
                    Upload new picture
                  </>
                )}
              </Button>
              {user.avatar && (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={removeAvatar}
                  disabled={uploading || removing}
                  className="text-muted-foreground hover:text-red-600 dark:hover:text-red-400"
                >
                  {removing ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 mr-1" />
                  )}
                  Remove
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              PNG, JPG or WebP, up to 4 MB. You can also drag and drop a file
              onto the circle.
            </p>
          </CardContent>
        </Card>

        {/* Card 2 — Account info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Account information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Name
                </p>
                <p className="text-foreground font-semibold mt-1">
                  {user.name}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Email
                </p>
                <p className="text-muted-foreground mt-1 break-all">
                  {user.email}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Role
                </p>
                <div className="mt-1">
                  <Badge className="bg-brand-100/70 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 border-brand-500/20 hover:bg-brand-100/70 dark:hover:bg-brand-900/40 uppercase">
                    {user.role}
                  </Badge>
                </div>
              </div>
              {user.subRole && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Sub-role
                  </p>
                  <p className="text-foreground mt-1">{user.subRole}</p>
                </div>
              )}
              {deptLabel && (
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Department
                  </p>
                  <div className="mt-1">
                    <Badge
                      variant="outline"
                      className="bg-muted text-muted-foreground border-border"
                    >
                      {deptLabel}
                    </Badge>
                  </div>
                </div>
              )}
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Member since
                </p>
                <p className="text-foreground mt-1">
                  {formatDate(user.createdAt)}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground border-t border-border pt-3">
              To update your role or department, contact your administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
