import { useState } from "react";
import { Layout } from "@/components/layout";
import { PinViewLogo } from "@/components/logo";
import { useSearch, useGetTrendingCreators, useGetTrendingCourses, useGetTrendingPosts, getSearchQueryKey, getGetTrendingCreatorsQueryKey, getGetTrendingCoursesQueryKey, getGetTrendingPostsQueryKey, useFollowUser, useUnfollowUser } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Search, MapPin, TrendingUp } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

function FollowButton({ userId, isFollowing }: { userId: string; isFollowing: boolean }) {
  const queryClient = useQueryClient();
  const follow = useFollowUser();
  const unfollow = useUnfollowUser();

  const handleToggle = () => {
    if (isFollowing) {
      unfollow.mutate({ userId }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetTrendingCreatorsQueryKey() }),
      });
    } else {
      follow.mutate({ userId }, {
        onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetTrendingCreatorsQueryKey() }),
      });
    }
  };

  return (
    <button
      data-testid={`button-follow-${userId}`}
      onClick={handleToggle}
      disabled={follow.isPending || unfollow.isPending}
      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
        isFollowing
          ? "border-white/20 text-white/60 hover:border-red-400/50 hover:text-red-400"
          : "border-primary text-primary hover:bg-primary hover:text-black"
      }`}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}

export default function Discover() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  const { data: searchResults, isLoading: searchLoading } = useSearch(
    { q: query, type: "all" },
    { query: { enabled: query.length > 1, queryKey: getSearchQueryKey({ q: query, type: "all" }) } }
  );
  const { data: creators, isLoading: creatorsLoading } = useGetTrendingCreators({ query: { queryKey: getGetTrendingCreatorsQueryKey() } });
  const { data: courses, isLoading: coursesLoading } = useGetTrendingCourses({ query: { queryKey: getGetTrendingCoursesQueryKey() } });
  const { data: trending } = useGetTrendingPosts({ limit: 6 }, { query: { queryKey: getGetTrendingPostsQueryKey({ limit: 6 }) } });

  const showSearch = searching && query.length > 1;

  return (
    <Layout>
      <div className="flex flex-col min-h-full pb-20">
        {/* Header */}
        <div className="sticky top-0 z-20 backdrop-blur-xl border-b px-4 py-3" style={{ background: "rgba(13,13,13,0.95)", borderColor: "rgba(255,255,255,0.06)" }}>
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-base font-black text-white uppercase tracking-widest">Discover</h1>
            <div className="brand-pill">● GOLF SHOTS</div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              data-testid="input-search"
              type="search"
              placeholder="Search golfers, courses..."
              value={query}
              onFocus={() => setSearching(true)}
              onBlur={() => setTimeout(() => setSearching(false), 200)}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-primary/60 transition-colors"
            />
          </div>
        </div>

        <div className="flex-1 px-4 py-4 space-y-8">
          {showSearch ? (
            <div className="space-y-6">
              {searchLoading ? (
                <div className="space-y-3">
                  {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
                </div>
              ) : (
                <>
                  {(searchResults?.users?.length ?? 0) > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Golfers</h3>
                      <div className="space-y-2">
                        {searchResults!.users.map(user => (
                          <Link key={user.id} href={`/profile/${user.id}`}>
                            <div data-testid={`card-user-${user.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5 hover:border-white/10 transition-all">
                              <Avatar className="w-10 h-10">
                                <AvatarImage src={user.avatarUrl} />
                                <AvatarFallback className="bg-primary/20 text-primary">{user.username[0].toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-white font-semibold text-sm">{user.displayName}</p>
                                <p className="text-white/40 text-xs">@{user.username}</p>
                              </div>
                              <FollowButton userId={user.id} isFollowing={user.isFollowing} />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                  {(searchResults?.courses?.length ?? 0) > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Courses</h3>
                      <div className="space-y-2">
                        {searchResults!.courses.map(course => (
                          <div key={course.name} data-testid={`card-course-${course.name}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <MapPin className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-white font-semibold text-sm">{course.name}</p>
                              <p className="text-white/40 text-xs">{course.postsCount} shots</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {(searchResults?.users?.length === 0 && searchResults?.courses?.length === 0) && (
                    <div className="text-center py-12 text-white/30">
                      <p className="text-lg font-semibold">No results found</p>
                      <p className="text-sm">Try a different search</p>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <>
              {/* Trending Shots Grid */}
              {(trending?.length ?? 0) > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-black text-white uppercase tracking-wider">Trending Shots</h2>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {trending!.slice(0, 6).map(post => (
                      <Link key={post.id} href={`/post/${post.id}`}>
                        <div data-testid={`card-post-${post.id}`} className="aspect-square bg-white/5 rounded-lg overflow-hidden relative">
                          <img
                            src={post.thumbnailUrl || `https://images.unsplash.com/photo-1535139262971-c51845709a48?q=80&w=400&auto=format&fit=crop`}
                            alt={post.caption || "Golf shot"}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-1 left-1 flex items-center gap-1">
                            <span className="text-white text-xs font-bold">{post.likesCount}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Trending Creators */}
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider mb-3">Top Golfers</h2>
                {creatorsLoading ? (
                  <div className="space-y-3">
                    {[1,2,3,4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {(creators || []).slice(0, 8).map(user => (
                      <div key={user.id} data-testid={`card-creator-${user.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                        <Link href={`/profile/${user.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={user.avatarUrl} />
                            <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">{user.username[0].toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-white font-semibold text-sm truncate">{user.displayName}</p>
                            <p className="text-white/40 text-xs">@{user.username} · {user.followersCount} followers</p>
                            {user.handicap != null && (
                              <p className="text-primary text-xs font-mono font-bold">HCP {user.handicap}</p>
                            )}
                          </div>
                        </Link>
                        <FollowButton userId={user.id} isFollowing={user.isFollowing} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Trending Courses */}
              {!coursesLoading && (courses || []).length > 0 && (
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider mb-3">Trending Courses</h2>
                  <div className="space-y-2">
                    {(courses || []).slice(0, 5).map(course => (
                      <div key={course.name} data-testid={`card-course-discover-${course.name}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">{course.name}</p>
                          <p className="text-white/40 text-xs">{course.postsCount} shots posted</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
