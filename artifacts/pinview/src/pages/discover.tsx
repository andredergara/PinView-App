import { useState, useRef, useEffect } from "react";
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
interface CourseSuggestion { name: string; location: string; }

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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [courseSuggestions, setCourseSuggestions] = useState<CourseSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const { user: currentUser } = useAuth();

  // Live course autocomplete via Photon (OpenStreetMap-powered, worldwide)
  useEffect(() => {
    if (query.length < 2) {
      setCourseSuggestions([]);
      setSuggestionsLoading(false);
      return;
    }
    setSuggestionsLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        // osm_tag filter restricts results to OSM leisure=golf_course features only —
        // no geographic noise, every result is a real golf course.
        const params = new URLSearchParams({
          q: query,
          limit: "10",
          osm_tag: "leisure:golf_course",
        });
        const res = await fetch(`https://photon.komoot.io/api/?${params}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        const seen = new Set<string>();
        const results: CourseSuggestion[] = [];
        for (const f of data.features ?? []) {
          const p = f.properties ?? {};
          if (!p.name) continue;
          const key = p.name.toLowerCase();
          if (seen.has(key)) continue;
          seen.add(key);
          const loc = [p.city || p.county, p.state, p.country]
            .filter(Boolean)
            .join(", ");
          results.push({ name: p.name, location: loc });
        }
        setCourseSuggestions(results);
      } catch (e) {
        if (!(e instanceof DOMException && e.name === "AbortError")) {
          setCourseSuggestions([]);
        }
      } finally {
        setSuggestionsLoading(false);
      }
    }, 380);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Close suggestions when clicking outside the search container
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

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
    { limit: 10 },
    { query: { queryKey: getGetTrendingPostsQueryKey({ limit: 10 }) } }
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
          <div className="relative" ref={searchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none z-10" />
            <input
              data-testid="input-search"
              type="search"
              placeholder="Search golfers, courses..."
              value={query}
              onChange={e => { setQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={e => { if (e.key === "Escape") { setShowSuggestions(false); } }}
              className="w-full pl-10 pr-9 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder:text-white/25 focus:outline-none focus:border-primary/60 transition-colors"
            />
            {query.length > 0 && (
              <button
                onClick={() => { setQuery(""); setShowSuggestions(false); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors z-10"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            {/* ── Live course autocomplete dropdown ── */}
            {showSuggestions && query.length >= 2 && (suggestionsLoading || courseSuggestions.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-1.5 rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden"
                style={{ background: "rgba(18,18,18,0.98)", backdropFilter: "blur(16px)" }}
              >
                <div className="px-3 pt-2.5 pb-1.5 flex items-center gap-1.5 border-b border-white/[0.06]">
                  <MapPin className="w-3 h-3 text-primary/60" />
                  <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Course suggestions</span>
                  {suggestionsLoading && (
                    <div className="ml-auto w-3 h-3 rounded-full border border-white/20 border-t-primary/60 animate-spin" />
                  )}
                </div>
                {suggestionsLoading && courseSuggestions.length === 0 ? (
                  <div className="px-3 py-4 space-y-2.5">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-6 h-6 rounded-md bg-white/[0.04] shrink-0" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 rounded bg-white/[0.05] w-3/4" />
                          <div className="h-2.5 rounded bg-white/[0.04] w-1/2" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  courseSuggestions.map(course => (
                    <button
                      key={course.name}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/[0.05] active:bg-white/[0.08] transition-colors text-left"
                      onMouseDown={e => {
                        e.preventDefault();
                        setQuery(course.name);
                        setShowSuggestions(false);
                      }}
                    >
                      <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                        <MapPin className="w-3 h-3 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-sm font-medium leading-snug truncate">{course.name}</p>
                        <p className="text-white/35 text-[11px] truncate">{course.location}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
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

                  {/* Only show DB courses that have actual shots on PinView */}
                  {(searchResults?.courses?.length ?? 0) > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">Courses on PinView</h3>
                      <div className="space-y-2">
                        {searchResults!.courses.map(course => (
                          <div key={course.name} data-testid={`card-course-${course.name}`}
                            className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]"
                          >
                            <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                              <MapPin className="w-4 h-4 text-primary" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-white font-semibold text-sm truncate">{course.name}</p>
                              <p className="text-white/40 text-xs">{course.postsCount} {course.postsCount === 1 ? "shot" : "shots"} on PinView</p>
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
                      <p className="text-sm mt-1 text-white/20">Try a golfer name, or pick a course from the suggestions above</p>
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
                  <div className="space-y-1.5">
                    {trending!.slice(0, 10).map((post, idx) => {
                      const rank = idx + 1;
                      const isTop3 = rank <= 3;
                      const rankColor = rank === 1
                        ? "text-yellow-400"
                        : rank === 2
                        ? "text-slate-300"
                        : rank === 3
                        ? "text-amber-600"
                        : "text-white/25";
                      const thumb = post.thumbnailUrl || "https://images.unsplash.com/photo-1535139262971-c51845709a48?q=80&w=200&auto=format&fit=crop";
                      const label = post.caption || [post.club, post.distance ? `${post.distance}yds` : null].filter(Boolean).join(" · ") || "Golf shot";
                      return (
                        <Link key={post.id} href={`/post/${post.id}`}>
                          <div
                            data-testid={`card-post-${post.id}`}
                            className={`flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                              isTop3
                                ? "bg-white/[0.05] border border-white/[0.08] hover:border-white/15"
                                : "hover:bg-white/[0.03]"
                            }`}
                          >
                            {/* Rank */}
                            <span className={`w-7 text-center text-base font-black tabular-nums shrink-0 ${rankColor}`}>
                              {rank}
                            </span>

                            {/* Thumbnail */}
                            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-white/5">
                              <img
                                src={thumb}
                                alt={label}
                                className="w-full h-full object-cover"
                              />
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm font-semibold leading-snug line-clamp-1">{label}</p>
                              <p className="text-white/40 text-xs mt-0.5 truncate">
                                @{post.author.username}
                                {post.club && ` · ${post.club}`}
                                {post.course && ` · ${post.course}`}
                              </p>
                            </div>

                            {/* Like count */}
                            <div className="shrink-0 flex items-center gap-1 text-white/30">
                              <span className="text-xs font-bold tabular-nums">{post.likesCount}</span>
                              <span className="text-[10px]">♥</span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
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
                  <div className="py-10 text-center">
                    <p className="text-white/50 font-semibold text-sm mb-1">No golfers yet</p>
                    <p className="text-white/20 text-xs">Be one of the first creators on PinView.</p>
                    <a href="/upload" className="inline-block mt-4 px-5 py-2 rounded-full border border-primary/40 text-primary text-xs font-bold hover:bg-primary/10 transition-colors">
                      Upload Your First Shot
                    </a>
                  </div>
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
