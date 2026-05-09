import { useParams, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { useGetPost, useGetPostComments, useCreateComment, useLikePost, useUnlikePost, useSavePost, useUnsavePost, useDeleteComment, useDeletePost, getGetPostQueryKey, getGetPostCommentsQueryKey, Comment, Post } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Heart, MessageCircle, Bookmark, ChevronLeft, Send, Trash2, MoreVertical, Pencil } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { EditPostModal } from "@/components/edit-post-modal";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  const w = Math.floor(d / 7);
  if (w < 52) return `${w}w`;
  return `${Math.floor(w / 52)}y`;
}

export default function PostPage() {
  const params = useParams<{ postId: string }>();
  const [, setLocation] = useLocation();
  const { user: currentUser, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");
  const commentsEndRef = useRef<HTMLDivElement>(null);

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
  const deletePost = useDeletePost();

  const [showMenu, setShowMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Optimistic like state
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (post) {
      setIsLiked(post.isLiked);
      setLikesCount(post.likesCount);
      setIsSaved(post.isSaved);
    }
  }, [post?.isLiked, post?.likesCount, post?.isSaved]);

  const handleLike = () => {
    if (!isAuthenticated) { setLocation("/login"); return; }
    const newIsLiked = !isLiked;
    setIsLiked(newIsLiked);
    setLikesCount(c => newIsLiked ? c + 1 : Math.max(0, c - 1));
    setLikeAnimating(true);
    setTimeout(() => setLikeAnimating(false), 350);

    if (newIsLiked) {
      likePost.mutate({ postId: params.postId }, {
        onError: () => {
          setIsLiked(!newIsLiked);
          setLikesCount(c => Math.max(0, c - 1));
        },
      });
    } else {
      unlikePost.mutate({ postId: params.postId }, {
        onError: () => {
          setIsLiked(!newIsLiked);
          setLikesCount(c => c + 1);
        },
      });
    }
  };

  const handleSave = () => {
    if (!isAuthenticated) { setLocation("/login"); return; }
    const newIsSaved = !isSaved;
    setIsSaved(newIsSaved);
    if (newIsSaved) {
      savePost.mutate({ postId: params.postId }, { onError: () => setIsSaved(!newIsSaved) });
    } else {
      unsavePost.mutate({ postId: params.postId }, { onError: () => setIsSaved(!newIsSaved) });
    }
  };

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text || !isAuthenticated || !currentUser) return;

    // Clear input immediately
    setCommentText("");

    // Optimistic insert — add comment to cache right now
    const tempId = `temp-${Date.now()}`;
    const optimisticComment: Comment = {
      id: tempId,
      text,
      createdAt: new Date().toISOString(),
      author: {
        id: currentUser.id,
        username: currentUser.username,
        displayName: currentUser.displayName,
        avatarUrl: currentUser.avatarUrl,
        followersCount: 0,
        isFollowing: false,
      },
    };
    queryClient.setQueryData<Comment[]>(
      getGetPostCommentsQueryKey(params.postId),
      (prev) => [...(prev ?? []), optimisticComment],
    );

    createComment.mutate(
      { postId: params.postId, data: { text } },
      {
        onSuccess: () => {
          // Replace temp comment with real data
          queryClient.invalidateQueries({ queryKey: getGetPostCommentsQueryKey(params.postId) });
          queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(params.postId) });
        },
        onError: () => {
          // Remove the optimistic comment on failure
          queryClient.setQueryData<Comment[]>(
            getGetPostCommentsQueryKey(params.postId),
            (prev) => (prev ?? []).filter(c => c.id !== tempId),
          );
          setCommentText(text);
        },
      }
    );
  };

  const isOwnPost = !!currentUser && !!post && currentUser.id === post.author.id;

  const handleDeletePost = () => {
    if (!window.confirm("Delete this shot? This cannot be undone.")) return;
    deletePost.mutate({ postId: params.postId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["getFeed"] });
        setLocation("/");
      },
    });
  };

  const handleEditSuccess = (updated: Post) => {
    queryClient.setQueryData(getGetPostQueryKey(params.postId), updated);
  };

  const handleDeleteComment = (commentId: string) => {
    // Optimistic remove
    queryClient.setQueryData<Comment[]>(
      getGetPostCommentsQueryKey(params.postId),
      (prev) => (prev ?? []).filter(c => c.id !== commentId),
    );
    deleteComment.mutate(
      { postId: params.postId, commentId },
      {
        onError: () => {
          queryClient.invalidateQueries({ queryKey: getGetPostCommentsQueryKey(params.postId) });
        },
        onSettled: () => {
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
          <span className="text-white font-bold flex-1">Shot</span>
          {isOwnPost && (
            <div className="relative">
              <button
                data-testid="button-post-menu"
                onClick={() => setShowMenu(v => !v)}
                className="p-1.5 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
              {showMenu && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                  <div className="absolute right-0 top-full mt-1 z-40 w-44 rounded-xl bg-[#1a1a1a] border border-white/10 shadow-2xl overflow-hidden">
                    <button
                      data-testid="button-edit-post"
                      onClick={() => { setShowMenu(false); setShowEditModal(true); }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-white hover:bg-white/5 transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-white/50" />
                      Edit shot
                    </button>
                    <div className="h-px bg-white/5" />
                    <button
                      data-testid="button-delete-post"
                      onClick={() => { setShowMenu(false); handleDeletePost(); }}
                      className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete shot
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Media — portrait crop like Reels */}
        <div className="w-full bg-black relative overflow-hidden" style={{ aspectRatio: "4/5" }}>
          {post.videoUrl ? (
            <video
              src={post.videoUrl}
              className="w-full h-full object-cover"
              controls
              playsInline
              autoPlay
              muted
            />
          ) : (
            <img
              src={post.thumbnailUrl || "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=600&h=750&auto=format&fit=crop"}
              alt={post.caption || "Golf shot"}
              className="w-full h-full object-cover"
            />
          )}
          {/* Gradient overlay at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-20 pointer-events-none"
            style={{ background: "linear-gradient(to top, rgba(13,13,13,0.9) 0%, transparent 100%)" }} />
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
                <Heart
                  className={cn(
                    "w-6 h-6 transition-all duration-150",
                    isLiked ? "text-red-500 fill-current" : "text-white/60",
                  )}
                  style={{ transform: likeAnimating ? "scale(1.35)" : "scale(1)", transition: "transform 0.15s cubic-bezier(0.34,1.56,0.64,1), color 0.15s, fill 0.15s" }}
                />
                <span className="text-white/60 text-sm tabular-nums">{likesCount}</span>
              </button>
              <button
                data-testid={`button-save-post-${post.id}`}
                onClick={handleSave}
                className="flex items-center gap-1.5"
              >
                <Bookmark className={cn("w-6 h-6 transition-all duration-150", isSaved ? "text-primary fill-current" : "text-white/60")} />
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
              const isTemp = comment.id.startsWith("temp-");
              return (
                <div
                  key={comment.id}
                  data-testid={`comment-${comment.id}`}
                  className={cn(
                    "flex gap-3 group transition-opacity duration-200",
                    isTemp && "opacity-60",
                  )}
                >
                  <Link href={`/profile/${comment.author?.id}`}>
                    <Avatar className="w-8 h-8 shrink-0">
                      <AvatarImage src={comment.author?.avatarUrl} />
                      <AvatarFallback className="bg-white/5 text-white/60 text-xs">
                        {comment.author?.username?.[0]?.toUpperCase() ?? "?"}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5 flex-wrap">
                      <span className="text-white text-sm font-semibold">@{comment.author?.username}</span>
                      <span className="text-white/25 text-xs">{timeAgo(comment.createdAt)}</span>
                    </div>
                    <p className="text-white/75 text-sm mt-0.5 leading-snug break-words">{comment.text}</p>
                  </div>
                  {isMyComment && !isTemp && (
                    <button
                      data-testid={`button-delete-comment-${comment.id}`}
                      onClick={() => handleDeleteComment(comment.id)}
                      disabled={deleteComment.isPending}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-all self-start mt-0.5 shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
            {(comments?.length ?? 0) === 0 && (
              <p className="text-white/20 text-sm text-center py-6">No comments yet. Be first.</p>
            )}
          </div>
          <div ref={commentsEndRef} />
        </div>

        {/* Comment input */}
        {isAuthenticated && (
          <div className="sticky bottom-16 bg-background/95 backdrop-blur-xl border-t border-white/5 px-4 py-3">
            <form onSubmit={handleComment} className="flex gap-2 items-center">
              <Avatar className="w-7 h-7 shrink-0">
                <AvatarImage src={currentUser?.avatarUrl} />
                <AvatarFallback className="bg-white/5 text-white/60 text-xs">
                  {currentUser?.username?.[0]?.toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
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
                className="p-2 rounded-xl bg-primary text-black disabled:opacity-30 transition-all active:scale-95"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Edit modal — only rendered when user is the author */}
      {isOwnPost && showEditModal && (
        <EditPostModal
          post={post}
          open={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSuccess={handleEditSuccess}
        />
      )}
    </Layout>
  );
}
