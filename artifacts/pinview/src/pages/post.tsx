import { useParams, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useGetPost, useGetPostComments, useCreateComment, useLikePost, useUnlikePost, useSavePost, useUnsavePost, useDeleteComment, getGetPostQueryKey, getGetPostCommentsQueryKey } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Heart, MessageCircle, Bookmark, ChevronLeft, Send, Trash2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function PostPage() {
  const params = useParams<{ postId: string }>();
  const [, setLocation] = useLocation();
  const { user: currentUser, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");

  const { data: post, isLoading } = useGetPost(params.postId, {
    query: { enabled: !!params.postId, queryKey: getGetPostQueryKey(params.postId) },
  });
  const { data: comments } = useGetPostComments(params.postId, {
    query: { enabled: !!params.postId, queryKey: getGetPostCommentsQueryKey(params.postId) },
  });

  const likePost = useLikePost();
  const unlikePost = useUnlikePost();
  const savePost = useSavePost();
  const unsavePost = useUnsavePost();
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();

  const handleLike = () => {
    if (!isAuthenticated) { setLocation("/login"); return; }
    if (post?.isLiked) {
      unlikePost.mutate({ postId: params.postId }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(params.postId) }),
      });
    } else {
      likePost.mutate({ postId: params.postId }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(params.postId) }),
      });
    }
  };

  const handleSave = () => {
    if (!isAuthenticated) { setLocation("/login"); return; }
    if (post?.isSaved) {
      unsavePost.mutate({ postId: params.postId }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(params.postId) }),
      });
    } else {
      savePost.mutate({ postId: params.postId }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(params.postId) }),
      });
    }
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !isAuthenticated) return;
    createComment.mutate(
      { postId: params.postId, data: { text: commentText } },
      {
        onSuccess: () => {
          setCommentText("");
          queryClient.invalidateQueries({ queryKey: getGetPostCommentsQueryKey(params.postId) });
          queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(params.postId) });
        },
      }
    );
  };

  const handleDeleteComment = (commentId: string) => {
    deleteComment.mutate(
      { postId: params.postId, commentId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPostCommentsQueryKey(params.postId) });
          queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(params.postId) });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 space-y-4 pb-20">
          <Skeleton className="w-full aspect-video rounded-2xl" />
          <Skeleton className="h-20 rounded-xl" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
          </div>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="flex items-center justify-center flex-1 p-8 pb-20">
          <p className="text-white/40">Shot not found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col min-h-full pb-20">
        {/* Top bar */}
        <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-xl border-b border-border/50 flex items-center gap-3 px-4 py-3">
          <button
            data-testid="button-back"
            onClick={() => setLocation("/")}
            className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-white font-bold">Shot</span>
        </div>

        {/* Media */}
        <div className="w-full aspect-video bg-black relative overflow-hidden">
          {post.videoUrl ? (
            <video
              src={post.videoUrl}
              className="w-full h-full object-cover"
              controls
              playsInline
            />
          ) : (
            <img
              src={post.thumbnailUrl || "https://images.unsplash.com/photo-1535139262971-c51845709a48?q=80&w=800&auto=format&fit=crop"}
              alt={post.caption || "Golf shot"}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Info */}
        <div className="px-4 py-4 border-b border-white/5">
          <div className="flex items-center gap-3 mb-3">
            <Link href={`/profile/${post.author.id}`}>
              <Avatar className="w-10 h-10 border border-primary/30">
                <AvatarImage src={post.author.avatarUrl} />
                <AvatarFallback className="bg-primary/10 text-primary">{post.author.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1">
              <Link href={`/profile/${post.author.id}`}>
                <p className="text-white font-bold text-sm hover:text-primary transition-colors">@{post.author.username}</p>
              </Link>
              <p className="text-white/30 text-xs">{timeAgo(post.createdAt)}</p>
            </div>
            {/* Actions */}
            <div className="flex items-center gap-3">
              <button
                data-testid={`button-like-post-${post.id}`}
                onClick={handleLike}
                className="flex items-center gap-1.5"
              >
                <Heart className={cn("w-6 h-6 transition-all", post.isLiked ? "text-red-500 fill-current" : "text-white/60")} />
                <span className="text-white/60 text-sm">{post.likesCount}</span>
              </button>
              <button
                data-testid={`button-save-post-${post.id}`}
                onClick={handleSave}
                className="flex items-center gap-1.5"
              >
                <Bookmark className={cn("w-6 h-6 transition-all", post.isSaved ? "text-primary fill-current" : "text-white/60")} />
              </button>
            </div>
          </div>

          {post.caption && <p className="text-white text-sm leading-relaxed mb-3">{post.caption}</p>}

          {/* Tags row */}
          <div className="flex flex-wrap gap-1.5">
            {post.distance && (
              <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white text-xs font-mono">{post.distance}yds</span>
            )}
            {post.club && (
              <span className="px-2 py-1 rounded-lg bg-primary/10 border border-primary/30 text-primary text-xs font-mono font-bold">{post.club}</span>
            )}
            {post.shotShape && (
              <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs">{post.shotShape}</span>
            )}
            {post.shotType && (
              <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/60 text-xs">{post.shotType}</span>
            )}
            {post.course && (
              <span className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/40 text-xs">
                {post.course}{post.holeNumber ? ` · Hole ${post.holeNumber}` : ""}
              </span>
            )}
            {(post.tags || []).map(tag => (
              <span key={tag} className="px-2 py-1 rounded-lg bg-white/5 border border-white/10 text-white/40 text-xs">#{tag}</span>
            ))}
          </div>
        </div>

        {/* Comments */}
        <div className="flex-1 px-4 py-3">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className="w-4 h-4 text-white/30" />
            <span className="text-white/40 text-sm font-medium">{post.commentsCount} comments</span>
          </div>
          <div className="space-y-4">
            {(comments || []).map(comment => {
              const isMyComment = currentUser?.id === comment.author?.id;
              return (
                <div key={comment.id} data-testid={`comment-${comment.id}`} className="flex gap-3 group">
                  <Link href={`/profile/${comment.author?.id}`}>
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarImage src={comment.author?.avatarUrl} />
                      <AvatarFallback className="bg-white/5 text-white/60 text-xs">
                        {comment.author?.username?.[0]?.toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-white text-sm font-semibold">@{comment.author?.username}</span>
                      <span className="text-white/20 text-xs">{timeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-white/70 text-sm mt-0.5">{comment.text}</p>
                  </div>
                  {isMyComment && (
                    <button
                      data-testid={`button-delete-comment-${comment.id}`}
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={deleteComment.isPending}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all self-start mt-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
            {(comments?.length ?? 0) === 0 && (
              <p className="text-white/20 text-sm text-center py-4">No comments yet. Be first.</p>
            )}
          </div>
        </div>

        {/* Comment input */}
        {isAuthenticated && (
          <div className="sticky bottom-16 bg-background/95 backdrop-blur-xl border-t border-white/5 px-4 py-3">
            <form onSubmit={handleComment} className="flex gap-2">
              <input
                data-testid="input-comment"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors"
              />
              <button
                data-testid="button-submit-comment"
                type="submit"
                disabled={!commentText.trim() || createComment.isPending}
                className="p-2 rounded-xl bg-primary text-black disabled:opacity-30 transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
}
