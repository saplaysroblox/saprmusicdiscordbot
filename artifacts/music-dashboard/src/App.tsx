import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MainLayout } from "@/components/layout/main-layout";
import NotFound from "@/pages/not-found";

import Dashboard from "@/pages/dashboard";
import Servers from "@/pages/servers";
import ServerPlayer from "@/pages/servers/player";
import ServerSearch from "@/pages/servers/search";
import ServerSettings from "@/pages/servers/settings";
import History from "@/pages/history";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <MainLayout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/servers" component={Servers} />
        <Route path="/servers/:guildId" component={ServerPlayer} />
        <Route path="/servers/:guildId/search" component={ServerSearch} />
        <Route path="/servers/:guildId/settings" component={ServerSettings} />
        <Route path="/history" component={History} />
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL?.replace(/\/$/, "") || ""}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
