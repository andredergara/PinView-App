import { Link } from "wouter";
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { Post, useLikePost, useUnlikePost, useSavePost, useUnsavePost } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import { getGetFeedQueryKey } from "@workspace/api-client-react";

export function VideoCard({ post }: { post: Post }) {
  const queryClient = useQueryClient();
  const likePost = useLikePost();
  const unlikePost = useUnlikePost();
  const savePost = useSavePost();
  const unsavePost = useUnsavePost();

  const handleLike = () => {
    if (post.isLiked) {
      unlikePost.mutate({ postId: post.id });
    } else {
      likePost.mutate({ postId: post.id });
    }
  };

  const handleSave = () => {
    if (post.isSaved) {
      unsavePost.mutate({ postId: post.id });
    } else {
      savePost.mutate({ postId: post.id });
    }
  };

  return (
    <div className="w-full h-[100dvh] relative bg-black snap-start snap-always shrink-0 flex items-center justify-center group overflow-hidden">
      {/* Video Placeholder */}
      <img src={post.thumbnailUrl || "https://images.unsplash.com/photo-1535139262971-c51845709a48?q=80&w=2070&auto=format&fit=crop"} className="w-full h-full object-cover opacity-80" alt={post.caption || "Golf shot"} />
      
      {/* Overlay controls */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/80 pointer-events-none" />

      {/* Right Actions */}
      <div className="absolute right-4 bottom-24 flex flex-col items-center space-y-6 z-10">
        <Link href={`/profile/${post.author.id}`} className="relative">
          <Avatar className="w-12 h-12 border-2 border-white/50">
            <AvatarImage src={post.author.avatarUrl} />
            <AvatarFallback>{post.author.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
        </Link>
        <button onClick={handleLike} className="flex flex-col items-center space-y-1 group" data-testid={`button-like-${post.id}`}>
          <div className={cn("p-2 rounded-full backdrop-blur-md", post.isLiked ? "bg-red-500/20 text-red-500" : "bg-white/10 text-white")}>
            <Heart className={cn("w-7 h-7", post.isLiked && "fill-current")} />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-md">{post.likesCount}</span>
        </button>
        <Link href={`/post/${post.id}`} className="flex flex-col items-center space-y-1">
          <div className="p-2 rounded-full backdrop-blur-md bg-white/10 text-white">
            <MessageCircle className="w-7 h-7" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-md">{post.commentsCount}</span>
        </Link>
        <button onClick={handleSave} className="flex flex-col items-center space-y-1" data-testid={`button-save-${post.id}`}>
          <div className={cn("p-2 rounded-full backdrop-blur-md", post.isSaved ? "bg-primary/20 text-primary" : "bg-white/10 text-white")}>
            <Bookmark className={cn("w-7 h-7", post.isSaved && "fill-current")} />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-md">{post.savesCount}</span>
        </button>
        <button className="flex flex-col items-center space-y-1" data-testid={`button-share-${post.id}`}>
          <div className="p-2 rounded-full backdrop-blur-md bg-white/10 text-white">
            <Share2 className="w-7 h-7" />
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-md">Share</span>
        </button>
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-16 left-4 right-20 z-10">
        <Link href={`/profile/${post.author.id}`} className="text-white font-bold text-lg mb-1 drop-shadow-md hover:underline">
          @{post.author.username}
        </Link>
        <p className="text-white text-sm line-clamp-2 drop-shadow-md mb-2">{post.caption}</p>
        
        <div className="flex flex-wrap gap-2">
          {post.distance && (
            <span className="px-2 py-1 bg-black/40 backdrop-blur-md rounded border border-white/10 text-white text-xs font-mono">
              {post.distance}yds
            </span>
          )}
          {post.club && (
            <span className="px-2 py-1 bg-primary/20 backdrop-blur-md rounded border border-primary/50 text-primary text-xs font-mono font-bold">
              {post.club}
            </span>
          )}
          {post.shotShape && (
            <span className="px-2 py-1 bg-white/20 backdrop-blur-md rounded border border-white/10 text-white text-xs font-mono">
              {post.shotShape}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
