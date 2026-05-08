import { Layout } from "@/components/layout";
import { VideoCard } from "@/components/video-card";
import { PinViewLogo } from "@/components/logo";
import { useGetFeed, getGetFeedQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data, isLoading } = useGetFeed({ limit: 10 }, { query: { queryKey: getGetFeedQueryKey({ limit: 10 }) } });

  if (isLoading) {
    return (
      <Layout>
        <div className="w-full h-[100dvh] bg-black flex items-center justify-center">
          <Skeleton className="w-full h-full opacity-10" />
        </div>
      </Layout>
    );
  }

  const posts = data?.posts || [];

  return (
    <Layout>
      {/* Floating logo header */}
      <div
        className="absolute top-0 left-0 right-0 z-20 flex items-center justify-center pt-4 pb-2 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.7) 0%, transparent 100%)" }}
      >
        <PinViewLogo size="sm" />
      </div>

      <div className="h-[100dvh] w-full snap-y snap-mandatory overflow-y-scroll overflow-x-hidden bg-black pb-[60px] hide-scrollbar">
        {posts.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-8">
            <div className="mb-6">
              <PinViewLogo size="lg" />
            </div>
            <div className="brand-pill mb-4">● GOLF REPLAY TECHNOLOGY</div>
            <h2 className="text-2xl font-black text-white tracking-tight mb-2">
              EVERY SHOT. CAPTURED.
            </h2>
            <p className="text-white/40 text-sm max-w-[260px] leading-relaxed">
              Follow golfers to fill your feed, or head to Discover to find the best shots.
            </p>
          </div>
        ) : (
          posts.map(post => (
            <VideoCard key={post.id} post={post} />
          ))
        )}
      </div>
    </Layout>
  );
}
