import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronLeft, Camera, Lock, LogOut, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useUpdateUser, useLogout, getGetMeQueryKey, getGetUserQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

function resizeImageToDataUrl(file: File, maxPx = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const ratio = Math.min(maxPx / img.width, maxPx / img.height, 1);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function Settings() {
  const [, setLocation] = useLocation();
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [handicap, setHandicap] = useState("");
  const [homeCourse, setHomeCourse] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | undefined>();
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const updateUser = useUpdateUser();
  const logout = useLogout();

  // Pre-fill form from current user
  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName ?? "");
      setBio(user.bio ?? "");
      setHandicap(user.handicap != null ? String(user.handicap) : "");
      setHomeCourse(user.homeCourse ?? "");
      setAvatarPreview(user.avatarUrl);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated]);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await resizeImageToDataUrl(file, 400);
      setAvatarPreview(dataUrl);
      setAvatarDataUrl(dataUrl);
    } catch {
      toast({ title: "Couldn't load image", description: "Please try a different photo.", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const body: Record<string, unknown> = {
        displayName: displayName.trim() || user.displayName,
        bio: bio.trim(),
        homeCourse: homeCourse.trim() || null,
        handicap: handicap !== "" ? parseFloat(handicap) : null,
      };
      if (avatarDataUrl) body.avatarUrl = avatarDataUrl;

      await updateUser.mutateAsync({ userId: user.id, data: body as any });

      // Refresh auth + profile caches
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      await queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(user.id) });

      toast({ title: "Profile saved", description: "Your changes are live." });
      setLocation("/profile");
    } catch {
      toast({ title: "Save failed", description: "Something went wrong. Try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/login");
      },
    });
  };

  if (authLoading || !user) {
    return (
      <Layout>
        <div className="flex items-center justify-center flex-1 pb-20">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      </Layout>
    );
  }

  const isDirty =
    displayName !== (user.displayName ?? "") ||
    bio !== (user.bio ?? "") ||
    handicap !== (user.handicap != null ? String(user.handicap) : "") ||
    homeCourse !== (user.homeCourse ?? "") ||
    avatarDataUrl !== null;

  return (
    <Layout>
      <div className="flex flex-col min-h-full pb-20">
        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-[rgba(13,13,13,0.95)] backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setLocation("/profile")}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-white font-bold text-sm uppercase tracking-widest">Edit Profile</span>
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="px-4 py-1.5 rounded-full bg-primary text-black text-sm font-bold disabled:opacity-30 transition-all active:scale-95"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
          </button>
        </div>

        <div className="px-5 pt-6 pb-8 space-y-7">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative">
              <Avatar className="w-24 h-24 border-2 border-primary/40">
                <AvatarImage src={avatarPreview} />
                <AvatarFallback className="bg-primary/10 text-primary text-3xl font-black">
                  {user.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-lg border-2 border-[#0d0d0d]"
              >
                <Camera className="w-4 h-4 text-black" />
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-primary text-sm font-semibold"
            >
              Change Photo
            </button>
          </div>

          {/* Form fields */}
          <div className="space-y-4">
            {/* Display Name */}
            <div>
              <label className="block text-white/40 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Display Name
              </label>
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                maxLength={60}
                placeholder="Your name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>

            {/* Username — read-only */}
            <div>
              <label className="block text-white/40 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Username
              </label>
              <div className="relative">
                <input
                  value={`@${user.username}`}
                  readOnly
                  className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl px-4 py-3 text-white/30 text-sm cursor-not-allowed pr-10"
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
              </div>
              <p className="text-white/20 text-xs mt-1 ml-1">Username cannot be changed</p>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-white/40 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={e => setBio(e.target.value)}
                maxLength={160}
                rows={3}
                placeholder="Tell the fairway about yourself..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-primary/60 transition-colors resize-none"
              />
              <p className="text-white/20 text-xs mt-1 text-right">{bio.length}/160</p>
            </div>

            {/* Handicap */}
            <div>
              <label className="block text-white/40 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Handicap Index
              </label>
              <input
                type="number"
                value={handicap}
                onChange={e => setHandicap(e.target.value)}
                min={-10}
                max={54}
                step={0.1}
                placeholder="e.g. 6.2"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>

            {/* Home Course */}
            <div>
              <label className="block text-white/40 text-xs font-semibold uppercase tracking-wider mb-1.5">
                Home Course
              </label>
              <input
                value={homeCourse}
                onChange={e => setHomeCourse(e.target.value)}
                maxLength={80}
                placeholder="e.g. Augusta National"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-primary/60 transition-colors"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/[0.06]" />

          {/* Logout */}
          <div>
            <p className="text-white/20 text-xs font-semibold uppercase tracking-wider mb-3">Account</p>
            <button
              onClick={handleLogout}
              disabled={logout.isPending}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-all"
            >
              {logout.isPending
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <LogOut className="w-4 h-4" />
              }
              <span className="text-sm font-semibold">Log Out</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
