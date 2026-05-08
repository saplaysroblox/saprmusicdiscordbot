import { useGetPlayHistory } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Music, History as HistoryIcon, Server } from "lucide-react";
import { formatDuration, formatRelativeTime } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

export default function History() {
  const { data: history, isLoading } = useGetPlayHistory({ limit: 50 });

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Play History</h1>
        <p className="text-muted-foreground mt-2">Recently played tracks across all servers.</p>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
        <CardContent className="p-0">
          <div className="divide-y border-border/50">
            {isLoading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="p-4 flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-md" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))
            ) : Array.isArray(history) && history.length > 0 ? (
              history.map((entry) => (
                <div key={entry.id} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors group">
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
                    <p className="text-sm font-medium leading-none truncate group-hover:text-primary transition-colors">{entry.title}</p>
                    <p className="text-xs text-muted-foreground mt-1.5 truncate">{entry.author}</p>
                  </div>
                  <div className="hidden md:flex flex-col items-end gap-1.5 shrink-0">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-md">
                      <Server className="w-3 h-3" />
                      <span className="truncate max-w-[150px]">{entry.guildName || "Unknown Server"}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 min-w-[80px] shrink-0 text-right">
                    <span className="text-sm font-medium tabular-nums">{formatDuration(entry.duration)}</span>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(entry.playedAt)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <HistoryIcon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium">No history yet</h3>
                <p className="text-muted-foreground mt-1">Tracks played by the bot will appear here.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
