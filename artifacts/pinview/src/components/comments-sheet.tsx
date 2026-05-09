import { useRef, useState, useEffect } from "react";
import { X, Send, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  useGetPostComments, useCreateComment, useDeleteComment,
  Comment, getGetPostCommentsQueryKey, getGetPostQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";

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

interface CommentsSheetProps {
  postId: string;
  commentsCount: number;
  isOpen: boolean;
  onClose: () => void;
}

export function CommentsSheet({ postId, commentsCount, isOpen, onClose }: CommentsSheetProps) {
  const [commentText, setCommentText] = useState("");
  const { user: currentUser, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: comments } = useGetPostComments(postId, {
    query: { enabled: isOpen, queryKey: getGetPostCommentsQueryKey(postId) },
  });

  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();

  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => inputRef.current?.focus(), 350);
    return () => clearTimeout(t);
  }, [isOpen]);

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault();
    const text = commentText.trim();
    if (!text) return;
    if (!isAuthenticated || !currentUser) { setLocation("/login"); return; }

    setCommentText("");

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
      getGetPostCommentsQueryKey(postId),
      (prev) => [...(prev ?? []), optimisticComment],
    );

    createComment.mutate({ postId, data: { text } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPostCommentsQueryKey(postId) });
        queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(postId) });
      },
      onError: () => {
        queryClient.setQueryData<Comment[]>(
          getGetPostCommentsQueryKey(postId),
          (prev) => (prev ?? []).filter(c => c.id !== tempId),
        );
        setCommentText(text);
      },
    });
  };

  const handleDeleteComment = (commentId: string) => {
    queryClient.setQueryData<Comment[]>(
      getGetPostCommentsQueryKey(postId),
      (prev) => (prev ?? []).filter(c => c.id !== commentId),
    );
    deleteComment.mutate({ postId, commentId }, {
      onError: () => queryClient.invalidateQueries({ queryKey: getGetPostCommentsQueryKey(postId) }),
      onSettled: () => queryClient.invalidateQueries({ queryKey: getGetPostQueryKey(postId) }),
    });
  };

  const displayCount = comments?.length ?? commentsCount;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 z-30 transition-opacity duration-300",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        style={{ background: "rgba(0,0,0,0.65)" }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className={cn(
          "absolute left-0 right-0 z-40 flex flex-col rounded-t-2xl transition-transform duration-300 ease-out",
          isOpen ? "translate-y-0" : "translate-y-full"
        )}
        style={{
          bottom: 60, // sit above nav bar
          maxHeight: "65%",
          minHeight: "42%",
          background: "rgba(17,17,17,0.98)",
          backdropFilter: "blur(20px)",
          borderTop: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Drag handle */}
        <div className="flex items-center justify-center pt-3 pb-1 shrink-0">
          <div className="w-9 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 shrink-0 border-b border-white/[0.06]">
          <span className="text-white font-semibold text-sm">
            {displayCount} {displayCount === 1 ? "comment" : "comments"}
          </span>
          <button onClick={onClose} className="p-1 text-white/30 hover:text-white/70 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Comments list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 overscroll-contain">
          {(comments ?? []).length === 0 && (
            <p className="text-white/20 text-sm text-center py-10">
              No comments yet. Be first.
            </p>
          )}
          {(comments ?? []).map(comment => {
            const isMyComment = currentUser?.id === comment.author?.id;
            const isTemp = comment.id.startsWith("temp-");
            return (
              <div
                key={comment.id}
                className={cn("flex gap-3 group transition-opacity", isTemp && "opacity-50")}
              >
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={comment.author?.avatarUrl} />
                  <AvatarFallback className="bg-white/5 text-white/60 text-xs">
                    {comment.author?.username?.[0]?.toUpperCase() ?? "?"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-white text-sm font-semibold">
                      @{comment.author?.username}
                    </span>
                    <span className="text-white/25 text-xs">{timeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="text-white/80 text-sm mt-0.5 leading-snug break-words">
                    {comment.text}
                  </p>
                </div>
                {isMyComment && !isTemp && (
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={deleteComment.isPending}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-white/20 hover:text-red-400 transition-all self-start shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Comment input */}
        <div className="shrink-0 border-t border-white/[0.06] px-4 py-3">
          <form onSubmit={handleComment} className="flex gap-2 items-center">
            <Avatar className="w-7 h-7 shrink-0">
              <AvatarImage src={currentUser?.avatarUrl} />
              <AvatarFallback className="bg-white/5 text-white/60 text-xs">
                {currentUser?.username?.[0]?.toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
            <input
              ref={inputRef}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder={isAuthenticated ? "Add a comment…" : "Log in to comment"}
              disabled={!isAuthenticated}
              className="flex-1 bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-40"
            />
            {isAuthenticated && (
              <button
                type="submit"
                disabled={!commentText.trim() || createComment.isPending}
                className="p-2 rounded-xl bg-primary text-black disabled:opacity-30 transition-all active:scale-95"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
