import { Layout } from "@/components/layout";
import { VideoCard } from "@/components/video-card";
import { useGetFeed, getGetFeedQueryKey } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data, isLoading } = useGetFeed({ limit: 10 }, { query: { queryKey: getGetFeedQueryKey({ limit: 10 }) } });

  if (isLoading) {
    return (
      <Layout>
        <div className="w-full h-[100dvh] bg-black animate-pulse flex items-center justify-center">
          <Skeleton className="w-full h-full opacity-10" />
        </div>
      </Layout>
    );
  }

  const posts = data?.posts || [];

  return (
    <Layout>
      <div className="h-[100dvh] w-full snap-y snap-mandatory overflow-y-scroll overflow-x-hidden bg-black pb-16 hide-scrollbar">
        {posts.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <h2 className="text-xl font-bold text-white mb-2">No shots yet.</h2>
            <p>Follow more golfers to see their shots here.</p>
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
