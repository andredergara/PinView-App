import { useParams, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { PinViewLogo } from "@/components/logo";
import { useGetUser, useGetUserPosts, useGetUserStats, useFollowUser, useUnfollowUser, getGetUserQueryKey, getGetUserPostsQueryKey, getGetUserStatsQueryKey } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Settings, MapPin, Target } from "lucide-react";
import { useLogout, getGetMeQueryKey } from "@workspace/api-client-react";

function StatBadge({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span className="text-white text-lg font-black">{value}</span>
      <span className="text-white/40 text-xs font-medium">{label}</span>
    </div>
  );
}

export default function Profile() {
  const params = useParams<{ userId?: string }>();
  const { user: currentUser, isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const userId = params.userId ?? currentUser?.id ?? "";
  const isOwnProfile = currentUser?.id === userId;

  const { data: user, isLoading } = useGetUser(userId, {
    query: { enabled: !!userId, queryKey: getGetUserQueryKey(userId) },
  });
  const { data: posts, isLoading: postsLoading } = useGetUserPosts(userId, { limit: 12 }, {
    query: { enabled: !!userId, queryKey: getGetUserPostsQueryKey(userId, { limit: 12 }) },
  });
  const { data: stats } = useGetUserStats(userId, {
    query: { enabled: !!userId, queryKey: getGetUserStatsQueryKey(userId) },
  });

  const follow = useFollowUser();
  const unfollow = useUnfollowUser();
  const logout = useLogout();

  const handleFollow = () => {
    if (!isAuthenticated) { setLocation("/login"); return; }
    if (user?.isFollowing) {
      unfollow.mutate({ userId }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(userId) }),
      });
    } else {
      follow.mutate({ userId }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetUserQueryKey(userId) }),
      });
    }
  };

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setLocation("/login");
      },
    });
  };

  if (authLoading && !params.userId) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center flex-1 pb-20">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated && !params.userId) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center pb-20">
          <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
            <span className="text-3xl text-white/20">?</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Your Profile</h2>
          <p className="text-white/40 text-sm mb-6">Sign in to view and manage your golfer profile.</p>
          <Button onClick={() => setLocation("/login")} className="bg-primary text-black font-bold">
            Sign In
          </Button>
        </div>
      </Layout>
    );
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="p-4 space-y-4 pb-20">
          <Skeleton className="w-full h-48 rounded-2xl" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
            <Skeleton className="h-12 rounded-xl" />
          </div>
          <div className="grid grid-cols-3 gap-1">
            {Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="aspect-square rounded-lg" />)}
          </div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center pb-20">
          <p className="text-white/40">User not found.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col min-h-full pb-20">
        {/* Header */}
        <div className="sticky top-0 z-20 backdrop-blur-xl border-b px-4 py-3" style={{ background: "rgba(13,13,13,0.95)", borderColor: "rgba(255,255,255,0.06)" }}>
          <h1 className="text-base font-black text-white uppercase tracking-widest text-center">Profile</h1>
        </div>
        <div className="relative px-4 pt-5 pb-4">
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20 border-2 border-primary/40 shrink-0">
              <AvatarImage src={user.avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-black">
                {user.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 mt-1">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h1 className="text-xl font-black text-white">{user.displayName}</h1>
                  <p className="text-white/40 text-sm">@{user.username}</p>
                </div>
                {isOwnProfile ? (
                  <button
                    data-testid="button-logout"
                    onClick={handleLogout}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/40 hover:text-white transition-colors"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                ) : (
                  <button
                    data-testid="button-follow-profile"
                    onClick={handleFollow}
                    disabled={follow.isPending || unfollow.isPending}
                    className={`px-5 py-2 rounded-full text-sm font-bold border transition-all ${
                      user.isFollowing
                        ? "border-white/20 text-white/60 hover:border-red-400/50 hover:text-red-400"
                        : "border-primary bg-primary text-black hover:bg-primary/90"
                    }`}
                  >
                    {user.isFollowing ? "Following" : "Follow"}
                  </button>
                )}
              </div>

              {user.bio && <p className="text-white/60 text-sm mt-2">{user.bio}</p>}

              <div className="flex items-center gap-3 mt-2 flex-wrap">
                {user.handicap != null && (
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-primary" />
                    <span className="text-primary text-xs font-bold font-mono">HCP {user.handicap}</span>
                  </div>
                )}
                {user.homeCourse && (
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-white/30" />
                    <span className="text-white/40 text-xs">{user.homeCourse}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats Row */}
          <div className="mt-5 flex items-center justify-around py-4 border border-white/10 rounded-2xl bg-white/3">
            <StatBadge label="Shots" value={user.postsCount} />
            <div className="w-px h-8 bg-white/10" />
            <StatBadge label="Followers" value={user.followersCount} />
            <div className="w-px h-8 bg-white/10" />
            <StatBadge label="Following" value={user.followingCount} />
          </div>

          {/* Golf Stats */}
          {stats && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {stats.avgDistance && (
                <div className="bg-primary/10 border border-primary/20 rounded-xl p-2.5 text-center">
                  <p className="text-primary font-black text-base">{Math.round(stats.avgDistance)}yd</p>
                  <p className="text-primary/60 text-xs">Avg Dist</p>
                </div>
              )}
              {stats.longestShot && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                  <p className="text-white font-black text-base">{stats.longestShot}yd</p>
                  <p className="text-white/40 text-xs">Best Shot</p>
                </div>
              )}
              {stats.topClub && (
                <div className="bg-white/5 border border-white/10 rounded-xl p-2.5 text-center">
                  <p className="text-white font-black text-sm">{stats.topClub}</p>
                  <p className="text-white/40 text-xs">Top Club</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Posts Grid */}
        <div className="px-1">
          {postsLoading ? (
            <div className="grid grid-cols-3 gap-1">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="aspect-square rounded-none" />
              ))}
            </div>
          ) : (posts?.posts?.length ?? 0) === 0 ? (
            <div className="text-center py-12 px-4 text-white/30">
              <p className="text-lg font-semibold">{isOwnProfile ? "Post your first shot" : "No shots yet"}</p>
              {isOwnProfile && (
                <Link href="/upload">
                  <Button className="mt-4 bg-primary text-black font-bold" data-testid="button-upload-first">
                    Upload Shot
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-0.5">
              {posts!.posts.map(post => (
                <Link key={post.id} href={`/post/${post.id}`}>
                  <div data-testid={`card-post-grid-${post.id}`} className="aspect-square bg-white/5 relative overflow-hidden">
                    <img
                      src={post.thumbnailUrl || "https://images.unsplash.com/photo-1535139262971-c51845709a48?q=80&w=400&auto=format&fit=crop"}
                      alt={post.caption || "Golf shot"}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
                    {post.club && (
                      <div className="absolute top-1 left-1">
                        <span className="px-1.5 py-0.5 rounded bg-primary/80 text-black text-xs font-bold">{post.club}</span>
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
