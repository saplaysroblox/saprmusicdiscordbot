import { useListGuilds } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Music, Server as ServerIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export default function Servers() {
  const { data: servers, isLoading } = useListGuilds();

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Servers</h1>
        <p className="text-muted-foreground mt-2">All Discord servers Harmonia is connected to.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="bg-card/50 backdrop-blur-sm border-primary/10 overflow-hidden">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : Array.isArray(servers) && servers.length > 0 ? (
          servers.map((server) => (
            <Link key={server.id} href={`/servers/${server.id}`}>
              <Card className="bg-card/50 backdrop-blur-sm border-primary/10 overflow-hidden hover:bg-card/80 hover:border-primary/30 transition-all cursor-pointer group">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden bg-muted shrink-0 flex items-center justify-center">
                      {server.icon ? (
                        <img src={server.icon} alt={server.name} className="object-cover w-full h-full" />
                      ) : (
                        <ServerIcon className="h-6 w-6 text-muted-foreground" />
                      )}
                      {server.hasActivePlayer && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity">
                          <Music className="h-5 w-5 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-base font-semibold leading-none truncate">{server.name}</p>
                      <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {server.memberCount.toLocaleString()}
                        </div>
                        {server.hasActivePlayer && (
                          <div className="flex items-center gap-1 text-primary font-medium">
                            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            Active
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <ServerIcon className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium">No servers found</h3>
            <p className="text-muted-foreground mt-1">Invite the bot to a server to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
