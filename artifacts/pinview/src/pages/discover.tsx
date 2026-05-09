import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useSearch, useGetTrendingCreators, useGetTrendingCourses, useGetTrendingPosts,
  useFollowUser, useUnfollowUser,
  getSearchQueryKey, getGetTrendingCreatorsQueryKey, getGetTrendingCoursesQueryKey, getGetTrendingPostsQueryKey,
  UserCard,
} from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useLocation } from "wouter";
import { Search, MapPin, TrendingUp, X } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

// FollowButton with:
// - optimistic local state (no refetch flicker)
// - hidden when card belongs to the current user
// - auth guard redirects to login
function FollowButton({
  user,
  currentUserId,
  onToggled,
}: {
  user: UserCard;
  currentUserId: string | undefined;
  onToggled?: (isFollowing: boolean) => void;
}) {
  const [, setLocation] = useLocation();
  const follow = useFollowUser();
  const unfollow = useUnfollowUser();
  const [localIsFollowing, setLocalIsFollowing] = useState(user.isFollowing);

  // Don't render a follow button on your own card
  if (currentUserId && currentUserId === user.id) return null;

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault(); // prevent Link navigation
    e.stopPropagation();

    if (!currentUserId) { setLocation("/login"); return; }

    const next = !localIsFollowing;
    setLocalIsFollowing(next);
    onToggled?.(next);

    if (next) {
      follow.mutate({ userId: user.id }, {
        onError: () => { setLocalIsFollowing(!next); onToggled?.(!next); },
      });
    } else {
      unfollow.mutate({ userId: user.id }, {
        onError: () => { setLocalIsFollowing(!next); onToggled?.(!next); },
      });
    }
  };

  return (
    <button
      data-testid={`button-follow-${user.id}`}
      onClick={handleToggle}
      disabled={follow.isPending || unfollow.isPending}
      className={cn(
        "shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all border",
        localIsFollowing
          ? "border-white/20 text-white/60 hover:border-red-400/50 hover:text-red-400"
          : "border-primary text-primary hover:bg-primary hover:text-black",
      )}
    >
      {localIsFollowing ? "Following" : "Follow"}
    </button>
  );
}

function UserRow({ user, currentUserId }: { user: UserCard; currentUserId: string | undefined }) {
  return (
    <div
      data-testid={`card-user-${user.id}`}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/10 transition-all"
    >
      <Link href={`/profile/${user.id}`} className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar className="w-10 h-10 shrink-0">
          <AvatarImage src={user.avatarUrl} />
          <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
            {user.username[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{user.displayName}</p>
          <div className="flex items-center gap-2">
            <p className="text-white/40 text-xs">@{user.username}</p>
            {user.handicap != null && (
              <span className="text-primary text-xs font-mono font-bold">HCP {user.handicap}</span>
            )}
          </div>
        </div>
      </Link>
      {currentUserId === user.id ? (
        <Link href="/settings">
          <span className="shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border border-white/20 text-white/40 hover:text-white transition-colors">
            Edit
          </span>
        </Link>
      ) : (
        <FollowButton user={user} currentUserId={currentUserId} />
      )}
    </div>
  );
}

function CreatorRow({ user, currentUserId }: { user: UserCard; currentUserId: string | undefined }) {
  return (
    <div
      data-testid={`card-creator-${user.id}`}
      className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05] hover:border-white/10 transition-all"
    >
      <Link href={`/profile/${user.id}`} className="flex items-center gap-3 flex-1 min-w-0">
        <Avatar className="w-12 h-12 shrink-0 border border-primary/20">
          <AvatarImage src={user.avatarUrl} />
          <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
            {user.username[0].toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm truncate">{user.displayName}</p>
          <p className="text-white/40 text-xs truncate">
            @{user.username}
            {user.followersCount > 0 && ` · ${user.followersCount} followers`}
          </p>
          {user.handicap != null && (
            <p className="text-primary text-xs font-mono font-bold">HCP {user.handicap}</p>
          )}
        </div>
      </Link>
      {currentUserId === user.id ? (
        <Link href="/settings">
          <span className="shrink-0 px-4 py-1.5 rounded-full text-xs font-bold border border-white/20 text-white/40 hover:text-white transition-colors">
            Edit
          </span>
        </Link>
      ) : (
        <FollowButton user={user} currentUserId={currentUserId} />
      )}
    </div>
  );
}

export default function Discover() {
  const [query, setQuery] = useState("");
  const { user: currentUser } = useAuth();

  // Show search results whenever query has 2+ chars — no blur dependency
  const isSearching = query.length > 1;

  const { data: searchResults, isLoading: searchLoading } = useSearch(
    { q: query, type: "all" },
    { query: { enabled: isSearching, queryKey: getSearchQueryKey({ q: query, type: "all" }) } }
  );
  const { data: creators, isLoading: creatorsLoading } = useGetTrendingCreators({
    query: { queryKey: getGetTrendingCreatorsQueryKey() },
  });
  const { data: courses, isLoading: coursesLoading } = useGetTrendingCourses({
    query: { queryKey: getGetTrendingCoursesQueryKey() },
  });
  const { data: trending } = useGetTrendingPosts(
    { limit: 6 },
    { query: { queryKey: getGetTrendingPostsQueryKey({ limit: 6 }) } }
  );

  return (
    <Layout>
      <div className="flex flex-col min-h-full pb-20">
        {/* Header */}
        <div
          className="sticky top-0 z-20 backdrop-blur-xl border-b px-4 py-3"
          style={{ background: "rgba(13,13,13,0.95)", borderColor: "rgba(255,255,255,0.06)" }}
        >
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-base font-black text-white uppercase tracking-widest">Discover</h1>
            <div className="brand-pill">● GOLF SHOTS</div>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
            <input
              data-testid="input-search"
              type="search"
              placeholder="Search golfers, courses..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-primary/60 transition-colors"
            />
            {query.length > 0 && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 px-4 py-4 space-y-8">
          {isSearching ? (
            /* ── Search results ── */
            <div className="space-y-6">
              {searchLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
                </div>
              ) : (
                <>
                  {(searchResults?.users?.length ?? 0) > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Golfers</h3>
                      <div className="space-y-2">
                        {searchResults!.users.map(user => (
                          <UserRow key={user.id} user={user} currentUserId={currentUser?.id} />
                        ))}
                      </div>
                    </div>
                  )}

                  {(searchResults?.courses?.length ?? 0) > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Courses</h3>
                      <div className="space-y-2">
                        {searchResults!.courses.map(course => (
                          <div key={course.name} data-testid={`card-course-${course.name}`}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]"
                          >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                              <MapPin className="w-4 h-4 text-primary" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-white font-semibold text-sm truncate">{course.name}</p>
                              <p className="text-white/40 text-xs">{course.postsCount} shots</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(searchResults?.users?.length ?? 0) === 0 &&
                   (searchResults?.courses?.length ?? 0) === 0 && (
                    <div className="text-center py-16 text-white/30">
                      <Search className="w-8 h-8 mx-auto mb-3 opacity-20" />
                      <p className="font-semibold">No results for "{query}"</p>
                      <p className="text-sm mt-1 text-white/20">Try a different name or course</p>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            /* ── Discover feed ── */
            <>
              {/* Trending Shots */}
              {(trending?.length ?? 0) > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <h2 className="text-sm font-black text-white uppercase tracking-wider">Trending Shots</h2>
                  </div>
                  <div className="grid grid-cols-3 gap-1">
                    {trending!.slice(0, 6).map(post => (
                      <Link key={post.id} href={`/post/${post.id}`}>
                        <div data-testid={`card-post-${post.id}`}
                          className="aspect-square bg-white/5 rounded-lg overflow-hidden relative"
                        >
                          <img
                            src={post.thumbnailUrl || "https://images.unsplash.com/photo-1535139262971-c51845709a48?q=80&w=400&auto=format&fit=crop"}
                            alt={post.caption || "Golf shot"}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                          <div className="absolute bottom-1.5 left-1.5 flex items-center gap-1">
                            <span className="text-white text-xs font-bold drop-shadow">{post.likesCount}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Golfers */}
              <div>
                <h2 className="text-sm font-black text-white uppercase tracking-wider mb-3">Top Golfers</h2>
                {creatorsLoading ? (
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-[72px] rounded-xl" />)}
                  </div>
                ) : (creators ?? []).length === 0 ? (
                  <p className="text-white/20 text-sm py-4 text-center">No golfers yet</p>
                ) : (
                  <div className="space-y-2">
                    {(creators ?? []).slice(0, 8).map(user => (
                      <CreatorRow key={user.id} user={user} currentUserId={currentUser?.id} />
                    ))}
                  </div>
                )}
              </div>

              {/* Trending Courses */}
              {!coursesLoading && (courses ?? []).length > 0 && (
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider mb-3">Trending Courses</h2>
                  <div className="space-y-2">
                    {(courses ?? []).slice(0, 5).map(course => (
                      <div key={course.name} data-testid={`card-course-discover-${course.name}`}
                        className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]"
                      >
                        <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                          <MapPin className="w-4 h-4 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{course.name}</p>
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
