import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Discover from "@/pages/discover";
import Upload from "@/pages/upload";
import Profile from "@/pages/profile";
import Notifications from "@/pages/notifications";
import PostPage from "@/pages/post";
import Login from "@/pages/login";
import Settings from "@/pages/settings";
import { AuthProvider } from "@/lib/auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 30,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/discover" component={Discover} />
      <Route path="/upload" component={Upload} />
      <Route path="/profile" component={Profile} />
      <Route path="/profile/:userId" component={Profile} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/post/:postId" component={PostPage} />
      <Route path="/login" component={Login} />
      <Route path="/settings" component={Settings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
