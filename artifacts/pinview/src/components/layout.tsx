import { Home, Compass, PlusSquare, User, Bell } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/discover", icon: Compass, label: "Discover" },
    { href: "/upload", icon: PlusSquare, label: "Upload" },
    { href: "/notifications", icon: Bell, label: "Activity" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 w-full max-w-[430px] z-50 border-t border-white/[0.06]"
      style={{ background: "rgba(13,13,13,0.95)", backdropFilter: "blur(20px)" }}
    >
      <div className="flex items-center justify-around h-[60px] px-2">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-1 rounded-xl transition-all",
                  isActive ? "text-primary" : "text-white/35 hover:text-white/60"
                )}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon
                  className={cn("transition-all", isActive ? "w-[22px] h-[22px]" : "w-[20px] h-[20px]")}
                  strokeWidth={isActive ? 2.5 : 1.8}
                />
                <span className={cn(
                  "text-[10px] font-semibold tracking-wide transition-all",
                  isActive ? "text-primary" : "text-white/30"
                )}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Layout({ children, hideNav = false, noScroll = false }: { children: React.ReactNode; hideNav?: boolean; noScroll?: boolean }) {
  return (
    <div className="min-h-[100dvh] w-full bg-black flex justify-center text-foreground dark">
      <div
        className="w-full max-w-[430px] min-h-[100dvh] relative flex flex-col overflow-hidden"
        style={{ background: "#0d0d0d", borderLeft: "1px solid rgba(255,255,255,0.04)", borderRight: "1px solid rgba(255,255,255,0.04)" }}
      >
        <main className={`flex-1 flex flex-col ${noScroll ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden"}`}>
          {children}
        </main>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}
