import { useGetBotStats, useGetPlayHistory, useGetNodeStatus } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Server, Music, Activity, Cpu, HardDrive, Clock, History } from "lucide-react";
import { formatDuration, formatRelativeTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetBotStats();
  const { data: nodeStatus, isLoading: nodeLoading } = useGetNodeStatus();
  const { data: history, isLoading: historyLoading } = useGetPlayHistory({ limit: 5 });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview of Harmonia's current status across all servers.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Servers</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-2xl font-bold">{stats?.guildCount || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Players</CardTitle>
            <Music className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-2xl font-bold text-primary">{stats?.activePlayers || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tracks Played</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-2xl font-bold">{(stats?.totalTracksPlayed || 0).toLocaleString()}</div>
            )}
          </CardContent>
        </Card>
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {statsLoading ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-2xl font-bold">{stats?.uptimeMs ? formatDuration(stats.uptimeMs) : "00:00"}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-primary" />
              <CardTitle>Recent History</CardTitle>
            </div>
            <CardDescription>Recently played tracks across all servers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {historyLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))
              ) : Array.isArray(history) && history.length > 0 ? (
                history.map((entry) => (
                  <div key={entry.id} className="flex items-center gap-4 group">
                    <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted shrink-0">
                      {entry.thumbnail ? (
                        <img src={entry.thumbnail} alt={entry.title} className="object-cover w-full h-full transition-transform group-hover:scale-110" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/20">
                          <Music className="w-6 h-6 text-primary" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">{entry.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 truncate">{entry.author} • {entry.guildName}</p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
                      {formatRelativeTime(entry.playedAt)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  No recent history
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-card/50 backdrop-blur-sm border-primary/10">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-primary" />
              <CardTitle>Node Status</CardTitle>
            </div>
            <CardDescription>Lavalink node performance</CardDescription>
          </CardHeader>
          <CardContent>
            {nodeLoading ? (
              <div className="space-y-6">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
              </div>
            ) : nodeStatus ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className={`w-2 h-2 rounded-full ${nodeStatus.connected ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}></div>
                    Status
                  </div>
                  <div className="text-sm font-medium">{nodeStatus.connected ? 'Connected' : 'Disconnected'}</div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <HardDrive className="w-4 h-4" />
                      Memory
                    </div>
                    <span className="font-medium">
                      {Math.round((nodeStatus.memoryUsed || 0) / 1024 / 1024)}MB / {Math.round(((nodeStatus.memoryUsed || 0) + (nodeStatus.memoryFree || 0)) / 1024 / 1024)}MB
                    </span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all" 
                      style={{ width: `${Math.min(100, ((nodeStatus.memoryUsed || 0) / ((nodeStatus.memoryUsed || 0) + (nodeStatus.memoryFree || 1))) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Cpu className="w-4 h-4" />
                      CPU Load
                    </div>
                    <span className="font-medium">{Math.round((nodeStatus.cpuLoad || 0) * 100)}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all" 
                      style={{ width: `${Math.min(100, (nodeStatus.cpuLoad || 0) * 100)}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm pt-2 border-t border-border/50">
                  <span className="text-muted-foreground">Active Players</span>
                  <span className="font-medium text-primary">{nodeStatus.playingPlayers} / {nodeStatus.players}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Node status unavailable
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
