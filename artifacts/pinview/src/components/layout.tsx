import { Home, Compass, PlusSquare, User, Bell } from "lucide-react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const [location] = useLocation();

  const navItems = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/discover", icon: Compass, label: "Discover" },
    { href: "/upload", icon: PlusSquare, label: "Upload" },
    { href: "/notifications", icon: Bell, label: "Notifications" },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 w-full max-w-[430px] border-t border-border bg-background/80 backdrop-blur-lg z-50">
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex-1">
              <div
                className={cn(
                  "flex flex-col items-center justify-center space-y-1 h-full",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                )}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export function Layout({ children, hideNav = false }: { children: React.ReactNode; hideNav?: boolean }) {
  return (
    <div className="min-h-[100dvh] w-full bg-black flex justify-center text-foreground dark">
      <div className="w-full max-w-[430px] bg-background min-h-[100dvh] relative overflow-hidden flex flex-col border-x border-border/10 shadow-2xl">
        <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
          {children}
        </main>
        {!hideNav && <BottomNav />}
      </div>
    </div>
  );
}
