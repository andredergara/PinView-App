import { useState, useRef } from "react";
import { Layout } from "@/components/layout";
import { useCreatePost } from "@workspace/api-client-react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetFeedQueryKey } from "@workspace/api-client-react";
import { UploadCloud, Video, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";

const CLUBS = ["Driver", "3-Wood", "5-Wood", "2-Iron", "3-Iron", "4-Iron", "5-Iron", "6-Iron", "7-Iron", "8-Iron", "9-Iron", "PW", "AW", "SW", "LW", "Putter"];
const SHOT_SHAPES = ["Straight", "Draw", "Fade", "Hook", "Slice"];
const SHOT_TYPES = ["Tee Shot", "Approach", "Chip", "Pitch", "Putt", "Bunker", "Punch", "Flop"];

export default function Upload() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createPost = useCreatePost();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    caption: "",
    course: "",
    holeNumber: "",
    club: "",
    distance: "",
    shotShape: "",
    shotType: "",
    tags: "",
    videoUrl: "",
    thumbnailUrl: "",
  });
  const [dragOver, setDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (authLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center flex-1 pb-20">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center pb-20">
          <UploadCloud className="w-12 h-12 text-white/20 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Sign in to upload</h2>
          <p className="text-white/40 text-sm mb-6">Create an account to share your golf shots.</p>
          <Button onClick={() => setLocation("/login")} className="bg-primary text-black font-bold">
            Sign In
          </Button>
        </div>
      </Layout>
    );
  }

  const handleFileSelect = (file: File) => {
    if (file && file.type.startsWith("video/")) {
      const url = URL.createObjectURL(file);
      setPreviewFile(url);
      setForm(f => ({ ...f, videoUrl: url }));
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    createPost.mutate(
      {
        data: {
          caption: form.caption || undefined,
          course: form.course || undefined,
          holeNumber: form.holeNumber ? parseInt(form.holeNumber) : undefined,
          club: form.club || undefined,
          distance: form.distance ? parseInt(form.distance) : undefined,
          shotShape: (form.shotShape as "Straight" | "Draw" | "Fade" | "Hook" | "Slice") || undefined,
          shotType: form.shotType || undefined,
          tags,
          videoUrl: form.videoUrl || undefined,
          thumbnailUrl: form.thumbnailUrl || undefined,
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetFeedQueryKey() });
          setLocation("/");
        },
        onError: () => setError("Failed to post. Please try again."),
      }
    );
  };

  return (
    <Layout>
      <div className="flex flex-col min-h-full pb-20">
        <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-border/50 px-4 py-3">
          <h1 className="text-xl font-black text-white">Post a Shot</h1>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 px-4 py-4 space-y-5">
          {/* Drop Zone */}
          <div
            data-testid="upload-dropzone"
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative w-full aspect-video rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden ${
              dragOver ? "border-primary bg-primary/10" : "border-white/10 bg-white/3 hover:border-white/20"
            }`}
          >
            {previewFile ? (
              <>
                <video src={previewFile} className="w-full h-full object-cover" muted playsInline />
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); setPreviewFile(null); setForm(f => ({ ...f, videoUrl: "" })); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </>
            ) : (
              <div className="text-center px-6">
                <Video className="w-10 h-10 text-white/20 mx-auto mb-3" />
                <p className="text-white/60 font-semibold text-sm">Drop video here or tap to browse</p>
                <p className="text-white/20 text-xs mt-1">MP4, MOV supported</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
            />
          </div>

          {/* Or enter URL */}
          <div>
            <label className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-1.5 block">Or paste video URL</label>
            <Input
              data-testid="input-video-url"
              placeholder="https://..."
              value={form.videoUrl}
              onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary"
            />
          </div>

          {/* Caption */}
          <div>
            <label className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-1.5 block">Caption</label>
            <textarea
              data-testid="input-caption"
              placeholder="Describe the shot..."
              value={form.caption}
              onChange={e => setForm(f => ({ ...f, caption: e.target.value }))}
              rows={3}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-primary/60 resize-none transition-colors"
            />
          </div>

          {/* Course + Hole */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-1.5 block">Course</label>
              <Input
                data-testid="input-course"
                placeholder="Augusta National"
                value={form.course}
                onChange={e => setForm(f => ({ ...f, course: e.target.value }))}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-1.5 block">Hole</label>
              <Input
                data-testid="input-hole"
                type="number"
                min={1}
                max={18}
                placeholder="1-18"
                value={form.holeNumber}
                onChange={e => setForm(f => ({ ...f, holeNumber: e.target.value }))}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Club + Distance */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-1.5 block">Club</label>
              <select
                data-testid="select-club"
                value={form.club}
                onChange={e => setForm(f => ({ ...f, club: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary/60 appearance-none transition-colors"
              >
                <option value="" className="bg-background">Select club</option>
                {CLUBS.map(c => <option key={c} value={c} className="bg-background">{c}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-1.5 block">Distance (yds)</label>
              <Input
                data-testid="input-distance"
                type="number"
                placeholder="285"
                value={form.distance}
                onChange={e => setForm(f => ({ ...f, distance: e.target.value }))}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary"
              />
            </div>
          </div>

          {/* Shot Shape */}
          <div>
            <label className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-2 block">Shot Shape</label>
            <div className="flex gap-2 flex-wrap">
              {SHOT_SHAPES.map(shape => (
                <button
                  key={shape}
                  type="button"
                  data-testid={`button-shape-${shape.toLowerCase()}`}
                  onClick={() => setForm(f => ({ ...f, shotShape: f.shotShape === shape ? "" : shape }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    form.shotShape === shape
                      ? "bg-primary text-black border-primary"
                      : "bg-white/5 text-white/60 border-white/10 hover:border-white/20"
                  }`}
                >
                  {shape}
                </button>
              ))}
            </div>
          </div>

          {/* Shot Type */}
          <div>
            <label className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-2 block">Shot Type</label>
            <div className="flex gap-2 flex-wrap">
              {SHOT_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  data-testid={`button-type-${type.toLowerCase().replace(" ", "-")}`}
                  onClick={() => setForm(f => ({ ...f, shotType: f.shotType === type ? "" : type }))}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                    form.shotType === type
                      ? "bg-white/20 text-white border-white/40"
                      : "bg-white/5 text-white/60 border-white/10 hover:border-white/20"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs text-white/40 font-semibold uppercase tracking-wider mb-1.5 block">Tags (comma separated)</label>
            <Input
              data-testid="input-tags"
              placeholder="hole-in-one, tracer, stinger"
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/20 focus:border-primary"
            />
          </div>

          {error && (
            <div className="px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
          )}

          <Button
            data-testid="button-submit-post"
            type="submit"
            disabled={createPost.isPending}
            className="w-full h-12 text-base font-bold bg-primary hover:bg-primary/90 text-black"
          >
            {createPost.isPending ? "Posting..." : "Post Shot"}
          </Button>
        </form>
      </div>
    </Layout>
  );
}
