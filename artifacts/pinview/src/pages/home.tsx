import { useState } from "react";
import { Layout } from "@/components/layout";
import { VideoCard } from "@/components/video-card";
import { CommentsSheet } from "@/components/comments-sheet";
import { PinViewLogo } from "@/components/logo";
import { useGetFeed, getGetFeedQueryKey } from "@workspace/api-client-react";

export default function Home() {
  const { data, isLoading } = useGetFeed({ limit: 20 }, { query: { queryKey: getGetFeedQueryKey({ limit: 20 }) } });

  const [activeComments, setActiveComments] = useState<{ postId: string; count: number } | null>(null);

  const posts = data?.posts || [];

  return (
    <Layout noScroll>
      {/* Full-height relative container for absolute overlays (sheet, logo) */}
      <div className="relative h-full">

        {/* Floating logo — sits above the snap scroll */}
        <div
          className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center pt-3 pb-6 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)" }}
        >
          <PinViewLogo size="sm" />
        </div>

        {/* Snap scroll feed — must be 100dvh so each card snap-point resolves correctly */}
        <div className="h-[100dvh] w-full snap-y snap-mandatory overflow-y-scroll hide-scrollbar bg-black">
          {isLoading && (
            <div className="w-full h-full flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <PinViewLogo size="sm" />
                <div className="w-1 h-8 bg-primary/40 rounded-full animate-pulse" />
              </div>
            </div>
          )}

          {!isLoading && posts.length === 0 && (
            <div className="w-full h-[100dvh] flex flex-col items-center justify-center text-center px-8">
              <div className="mb-8">
                <PinViewLogo size="lg" />
              </div>
              <div className="brand-pill mb-6">● EARLY ACCESS</div>
              <h2 className="text-2xl font-black text-white tracking-tight mb-3">
                YOUR FEED STARTS HERE
              </h2>
              <p className="text-white/40 text-sm max-w-[260px] leading-relaxed mb-8">
                Follow golfers or upload your first shot to fill this feed.
              </p>
              <div className="flex flex-col gap-3 w-full max-w-[240px]">
                <a href="/discover" className="btn-brand py-3 px-6 rounded-xl text-sm font-bold text-center">
                  Find Golfers to Follow
                </a>
                <a href="/upload" className="py-3 px-6 rounded-xl text-sm font-bold text-center border border-white/15 text-white/60 hover:text-white transition-colors">
                  Upload Your First Shot
                </a>
              </div>
            </div>
          )}

          {posts.map(post => (
            <VideoCard
              key={post.id}
              post={post}
              onOpenComments={() => setActiveComments({ postId: post.id, count: post.commentsCount })}
            />
          ))}
        </div>

        {/* Comments sheet — positioned above nav, inside the relative container */}
        {activeComments && (
          <CommentsSheet
            postId={activeComments.postId}
            commentsCount={activeComments.count}
            isOpen={!!activeComments}
            onClose={() => setActiveComments(null)}
          />
        )}
      </div>
    </Layout>
  );
}
