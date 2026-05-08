import { Link, useLocation } from "wouter";
import { LayoutDashboard, Server, History, Settings, Music, Search } from "lucide-react";
import { cn } from "@/lib/utils";

const mainNavItems = [
  { title: "Dashboard", href: "/", icon: LayoutDashboard },
  { title: "Servers", href: "/servers", icon: Server },
  { title: "History", href: "/history", icon: History },
];

export function Sidebar({ guildId }: { guildId?: string }) {
  const [location] = useLocation();

  return (
    <aside className="w-64 border-r border-border/50 bg-card/50 flex flex-col hidden md:flex backdrop-blur-xl">
      <div className="h-16 flex items-center px-6 border-b border-border/50">
        <div className="flex items-center gap-3 text-primary font-bold text-xl tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
            <Music className="w-5 h-5 text-primary" />
          </div>
          Harmonia
        </div>
      </div>

      <div className="flex-1 py-6 px-4 space-y-8 overflow-y-auto">
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href) && !guildId);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.title}
                </div>
              </Link>
            );
          })}
        </div>

        {guildId && (
          <div className="space-y-3">
            <div className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Server Controls
            </div>
            <div className="space-y-1">
              <Link href={`/servers/${guildId}`}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group",
                    location === `/servers/${guildId}`
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <Music className={cn("w-5 h-5", location === `/servers/${guildId}` ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  Player
                </div>
              </Link>
              <Link href={`/servers/${guildId}/search`}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group",
                    location === `/servers/${guildId}/search`
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <Search className={cn("w-5 h-5", location === `/servers/${guildId}/search` ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  Search
                </div>
              </Link>
              <Link href={`/servers/${guildId}/settings`}>
                <div
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer group",
                    location === `/servers/${guildId}/settings`
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <Settings className={cn("w-5 h-5", location === `/servers/${guildId}/settings` ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  Settings
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-border/50">
        <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>
          System Online
        </div>
      </div>
    </aside>
  );
}
