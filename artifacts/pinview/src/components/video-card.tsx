import { Link, useLocation } from "wouter";
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { Post, useLikePost, useUnlikePost, useSavePost, useUnsavePost } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { useState, useEffect, useRef } from "react";

interface VideoCardProps {
  post: Post;
  onOpenComments: () => void;
}

export function VideoCard({ post, onOpenComments }: VideoCardProps) {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const likePost = useLikePost();
  const unlikePost = useUnlikePost();
  const savePost = useSavePost();
  const unsavePost = useUnsavePost();

  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [isSaved, setIsSaved] = useState(post.isSaved);
  const [savesCount, setSavesCount] = useState(post.savesCount);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [centerHeart, setCenterHeart] = useState(false);

  // Double-tap tracking
  const lastTapRef = useRef(0);

  useEffect(() => {
    setIsLiked(post.isLiked);
    setLikesCount(post.likesCount);
  }, [post.isLiked, post.likesCount]);

  useEffect(() => {
    setIsSaved(post.isSaved);
    setSavesCount(post.savesCount);
  }, [post.isSaved, post.savesCount]);

  const triggerLike = (shouldLike: boolean) => {
    if (shouldLike === isLiked) return;
    setIsLiked(shouldLike);
    setLikesCount(c => shouldLike ? c + 1 : Math.max(0, c - 1));
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 400);
    if (shouldLike) {
      likePost.mutate({ postId: post.id }, {
        onError: () => { setIsLiked(!shouldLike); setLikesCount(c => Math.max(0, c - 1)); },
      });
    } else {
      unlikePost.mutate({ postId: post.id }, {
        onError: () => { setIsLiked(!shouldLike); setLikesCount(c => c + 1); },
      });
    }
  };

  const handleLike = () => {
    if (!isAuthenticated) { setLocation("/login"); return; }
    triggerLike(!isLiked);
  };

  const handleDoubleTap = () => {
    if (!isAuthenticated) return;
    // Double-tap always likes (never unlikes), matching TikTok behaviour
    if (!isLiked) triggerLike(true);
    setCenterHeart(true);
    setTimeout(() => setCenterHeart(false), 800);
  };

  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      handleDoubleTap();
    }
    lastTapRef.current = now;
  };

  const handleSave = () => {
    if (!isAuthenticated) { setLocation("/login"); return; }
    const next = !isSaved;
    setIsSaved(next);
    setSavesCount(c => next ? c + 1 : Math.max(0, c - 1));
    if (next) {
      savePost.mutate({ postId: post.id }, {
        onError: () => { setIsSaved(!next); setSavesCount(c => Math.max(0, c - 1)); },
      });
    } else {
      unsavePost.mutate({ postId: post.id }, {
        onError: () => { setIsSaved(!next); setSavesCount(c => c + 1); },
      });
    }
  };

  const fallbackImg = "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=600&h=900&auto=format&fit=crop";
  const [videoError, setVideoError] = useState(false);

  return (
    <div
      className="w-full h-[100dvh] relative bg-black snap-start snap-always shrink-0 select-none"
      onClick={handleTap}
    >
      {/* Media */}
      {post.videoUrl && !videoError ? (
        <video
          key={post.videoUrl}
          src={post.videoUrl}
          poster={post.thumbnailUrl || fallbackImg}
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          onError={() => setVideoError(true)}
        />
      ) : (
        <img
          src={post.thumbnailUrl || fallbackImg}
          alt={post.caption || "Golf shot"}
          className="w-full h-full object-cover"
          draggable={false}
        />
      )}

      {/* Cinematic gradient — top fade for logo, bottom fade for text */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 25%, transparent 55%, rgba(0,0,0,0.85) 100%)"
        }}
      />

      {/* Center double-tap heart */}
      {centerHeart && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          <Heart
            className="w-28 h-28 text-white fill-white drop-shadow-2xl animate-heart-pop"
          />
        </div>
      )}

      {/* Right action rail */}
      <div
        className="absolute right-3 flex flex-col items-center gap-5 z-10"
        style={{ bottom: 100 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Author avatar */}
        <Link href={`/profile/${post.author.id}`}>
          <Avatar className="w-11 h-11 border-2 border-white/60 shadow-lg">
            <AvatarImage src={post.author.avatarUrl} />
            <AvatarFallback className="bg-primary/20 text-primary font-bold text-sm">
              {post.author.username[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Link>

        {/* Like */}
        <button
          onClick={handleLike}
          className="flex flex-col items-center gap-1"
          data-testid={`button-like-${post.id}`}
        >
          <div
            className="p-2.5 rounded-full backdrop-blur-md"
            style={{
              background: isLiked ? "rgba(239,68,68,0.25)" : "rgba(0,0,0,0.35)",
              transform: likeAnimating ? "scale(1.32)" : "scale(1)",
              transition: "transform 0.2s cubic-bezier(0.34,1.56,0.64,1), background 0.15s",
            }}
          >
            <Heart
              className={cn("w-7 h-7 transition-colors duration-150", isLiked ? "text-red-500 fill-red-500" : "text-white")}
            />
          </div>
          <span className="text-white text-xs font-semibold tabular-nums drop-shadow">{likesCount}</span>
        </button>

        {/* Comment */}
        <button
          onClick={onOpenComments}
          className="flex flex-col items-center gap-1"
          data-testid={`button-comment-${post.id}`}
        >
          <div className="p-2.5 rounded-full backdrop-blur-md" style={{ background: "rgba(0,0,0,0.35)" }}>
            <MessageCircle className="w-7 h-7 text-white" />
          </div>
          <span className="text-white text-xs font-semibold tabular-nums drop-shadow">{post.commentsCount}</span>
        </button>

        {/* Save */}
        <button
          onClick={handleSave}
          className="flex flex-col items-center gap-1"
          data-testid={`button-save-${post.id}`}
        >
          <div
            className="p-2.5 rounded-full backdrop-blur-md"
            style={{
              background: isSaved ? "rgba(34,197,94,0.2)" : "rgba(0,0,0,0.35)",
              transition: "background 0.15s",
            }}
          >
            <Bookmark className={cn("w-7 h-7 transition-colors duration-150", isSaved ? "text-primary fill-primary" : "text-white")} />
          </div>
          <span className="text-white text-xs font-semibold tabular-nums drop-shadow">{savesCount}</span>
        </button>

        {/* Share */}
        <button
          className="flex flex-col items-center gap-1"
          data-testid={`button-share-${post.id}`}
          onClick={e => { e.stopPropagation(); }}
        >
          <div className="p-2.5 rounded-full backdrop-blur-md" style={{ background: "rgba(0,0,0,0.35)" }}>
            <Share2 className="w-7 h-7 text-white" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow">Share</span>
        </button>
      </div>

      {/* Bottom info */}
      <div
        className="absolute left-3 right-16 z-10"
        style={{ bottom: 80 }}
        onClick={e => e.stopPropagation()}
      >
        <Link href={`/profile/${post.author.id}`} className="inline-block mb-1">
          <span className="text-white font-bold text-base drop-shadow-lg hover:text-primary transition-colors">
            @{post.author.username}
          </span>
        </Link>
        {post.caption && (
          <p className="text-white/90 text-sm leading-snug drop-shadow mb-2.5 line-clamp-2">
            {post.caption}
          </p>
        )}
        <div className="flex flex-wrap gap-1.5">
          {post.distance && (
            <span className="px-2 py-0.5 rounded-md text-white text-xs font-mono"
              style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.12)" }}>
              {post.distance}yds
            </span>
          )}
          {post.club && (
            <span className="px-2 py-0.5 rounded-md text-xs font-mono font-bold text-primary"
              style={{ background: "rgba(34,197,94,0.15)", border: "1px solid rgba(34,197,94,0.4)" }}>
              {post.club}
            </span>
          )}
          {post.shotShape && (
            <span className="px-2 py-0.5 rounded-md text-white/70 text-xs"
              style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.1)" }}>
              {post.shotShape}
            </span>
          )}
          {post.course && (
            <span className="px-2 py-0.5 rounded-md text-white/50 text-xs"
              style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}>
              {post.course}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
