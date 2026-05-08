import { Layout } from "@/components/layout";
import { PinViewLogo } from "@/components/logo";
import { useGetNotifications, useGetUnreadNotificationCount, useMarkNotificationsRead, getGetNotificationsQueryKey, getGetUnreadNotificationCountQueryKey } from "@workspace/api-client-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, MessageCircle, UserPlus, Star, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

const typeIcon: Record<string, typeof Heart> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  featured: Star,
  trending: TrendingUp,
};

const typeColor: Record<string, string> = {
  like: "text-red-400",
  comment: "text-blue-400",
  follow: "text-primary",
  featured: "text-yellow-400",
  trending: "text-orange-400",
};

export default function Notifications() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data, isLoading } = useGetNotifications({ limit: 30 }, {
    query: { enabled: isAuthenticated, queryKey: getGetNotificationsQueryKey({ limit: 30 }) },
  });
  const { data: unreadData } = useGetUnreadNotificationCount({
    query: { enabled: isAuthenticated, queryKey: getGetUnreadNotificationCountQueryKey() },
  });
  const markRead = useMarkNotificationsRead();

  useEffect(() => {
    if (isAuthenticated && (unreadData?.count ?? 0) > 0) {
      markRead.mutate(undefined, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetUnreadNotificationCountQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetNotificationsQueryKey({ limit: 30 }) });
        },
      });
    }
  }, [isAuthenticated, unreadData?.count]);

  if (authLoading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center flex-1 pb-20">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center flex-1 p-8 text-center pb-20">
          <Heart className="w-12 h-12 text-white/10 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Stay in the loop</h2>
          <p className="text-white/40 text-sm mb-6">Sign in to see likes, comments, and follows.</p>
          <Button onClick={() => setLocation("/login")} className="bg-primary text-black font-bold">
            Sign In
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col min-h-full pb-20">
        {/* Header */}
        <div className="sticky top-0 z-20 backdrop-blur-xl border-b px-4 py-3.5 flex items-center justify-between" style={{ background: "rgba(13,13,13,0.95)", borderColor: "rgba(255,255,255,0.06)" }}>
          <h1 className="text-base font-black text-white uppercase tracking-widest">Activity</h1>
          {(unreadData?.count ?? 0) > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary text-black text-xs font-bold">
              {unreadData!.count} new
            </span>
          )}
        </div>

        <div className="flex-1">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          ) : (data?.notifications?.length ?? 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mb-4">
                <Bell className="w-7 h-7 text-white/20" />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">No notifications yet</h3>
              <p className="text-white/40 text-sm">When someone likes or comments on your shots, they'll show up here.</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {data!.notifications.map(notification => {
                const Icon = typeIcon[notification.type] ?? Star;
                const color = typeColor[notification.type] ?? "text-white";
                return (
                  <div
                    key={notification.id}
                    data-testid={`notification-${notification.id}`}
                    className={`flex items-center gap-3 px-4 py-4 transition-colors hover:bg-white/3 ${!notification.isRead ? "bg-primary/3" : ""}`}
                  >
                    <div className="relative shrink-0">
                      <Avatar className="w-11 h-11">
                        <AvatarImage src={notification.actor?.avatarUrl} />
                        <AvatarFallback className="bg-white/5 text-white/60 text-sm">
                          {notification.actor?.username?.[0]?.toUpperCase() ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-background border border-white/10 flex items-center justify-center`}>
                        <Icon className={`w-3 h-3 ${color}`} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-sm leading-snug">{notification.message}</p>
                      <p className="text-white/30 text-xs mt-0.5">{timeAgo(notification.createdAt)}</p>
                    </div>
                    {notification.post?.thumbnailUrl && (
                      <Link href={`/post/${notification.post.id}`}>
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 shrink-0">
                          <img
                            src={notification.post.thumbnailUrl}
                            alt="Shot"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

function Bell({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}
