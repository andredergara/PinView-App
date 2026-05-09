import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useUpdatePost, Post } from "@workspace/api-client-react";

interface EditPostModalProps {
  post: Post;
  open: boolean;
  onClose: () => void;
  onSuccess?: (updated: Post) => void;
}

const SHOT_SHAPES = ["Straight", "Draw", "Fade", "Hook", "Slice"] as const;

export function EditPostModal({ post, open, onClose, onSuccess }: EditPostModalProps) {
  const updatePost = useUpdatePost();

  const [caption, setCaption] = useState("");
  const [club, setClub] = useState("");
  const [distance, setDistance] = useState("");
  const [shotShape, setShotShape] = useState("");
  const [shotType, setShotType] = useState("");
  const [course, setCourse] = useState("");
  const [holeNumber, setHoleNumber] = useState("");
  const [tags, setTags] = useState("");

  useEffect(() => {
    if (open && post) {
      setCaption(post.caption ?? "");
      setClub(post.club ?? "");
      setDistance(post.distance != null ? String(post.distance) : "");
      setShotShape(post.shotShape ?? "");
      setShotType(post.shotType ?? "");
      setCourse(post.course ?? "");
      setHoleNumber(post.holeNumber != null ? String(post.holeNumber) : "");
      setTags((post.tags ?? []).join(", "));
    }
  }, [open, post?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePost.mutate(
      {
        postId: post.id,
        data: {
          caption: caption.trim() || null,
          club: club.trim() || null,
          distance: distance ? parseInt(distance, 10) : null,
          shotShape: (shotShape as typeof SHOT_SHAPES[number]) || null,
          shotType: shotType.trim() || null,
          course: course.trim() || null,
          holeNumber: holeNumber ? parseInt(holeNumber, 10) : null,
          tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : [],
        },
      },
      {
        onSuccess: (updated) => {
          onSuccess?.(updated);
          onClose();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="bg-[#111] border border-white/10 text-white max-h-[90dvh] overflow-y-auto rounded-2xl w-[calc(100%-2rem)] max-w-[400px] p-0">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-white/10">
          <DialogTitle className="text-white font-bold">Edit Shot</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          {/* Caption */}
          <div className="space-y-1.5">
            <label className="text-white/50 text-xs font-semibold uppercase tracking-wide">Caption</label>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Describe the shot..."
              rows={2}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-primary/50 resize-none transition-colors"
            />
          </div>

          {/* Club + Distance */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-white/50 text-xs font-semibold uppercase tracking-wide">Club</label>
              <input
                value={club}
                onChange={e => setClub(e.target.value)}
                placeholder="e.g. 7 Iron"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-white/50 text-xs font-semibold uppercase tracking-wide">Distance (yds)</label>
              <input
                type="number"
                value={distance}
                onChange={e => setDistance(e.target.value)}
                placeholder="e.g. 165"
                min={0}
                max={999}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Shot shape + Shot type */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-white/50 text-xs font-semibold uppercase tracking-wide">Shot Shape</label>
              <select
                value={shotShape}
                onChange={e => setShotShape(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors appearance-none"
              >
                <option value="">—</option>
                {SHOT_SHAPES.map(s => (
                  <option key={s} value={s} className="bg-[#111]">{s}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-white/50 text-xs font-semibold uppercase tracking-wide">Shot Type</label>
              <input
                value={shotType}
                onChange={e => setShotType(e.target.value)}
                placeholder="e.g. Approach"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Course + Hole */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-white/50 text-xs font-semibold uppercase tracking-wide">Course</label>
              <input
                value={course}
                onChange={e => setCourse(e.target.value)}
                placeholder="Course name"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-white/50 text-xs font-semibold uppercase tracking-wide">Hole #</label>
              <input
                type="number"
                value={holeNumber}
                onChange={e => setHoleNumber(e.target.value)}
                placeholder="e.g. 7"
                min={1}
                max={18}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-white/50 text-xs font-semibold uppercase tracking-wide">Tags <span className="normal-case text-white/20 font-normal">(comma separated)</span></label>
            <input
              value={tags}
              onChange={e => setTags(e.target.value)}
              placeholder="e.g. birdie, par3, wind"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              onClick={onClose}
              className="flex-1 bg-white/5 hover:bg-white/10 text-white border-0"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updatePost.isPending}
              className="flex-1 bg-primary hover:bg-primary/90 text-black font-bold"
            >
              {updatePost.isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
