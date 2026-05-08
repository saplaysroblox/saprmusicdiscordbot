import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useSearchTracks, usePlayTrack, getGetQueueQueryKey, getGetPlayerQueryKey } from "@workspace/api-client-react";
import { SearchTracksSource } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Music, Plus, Play, Loader2 } from "lucide-react";
import { SiYoutube, SiSoundcloud, SiSpotify } from "react-icons/si";
import { formatDuration } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function ServerSearch() {
  const params = useParams();
  const guildId = params.guildId as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [source, setSource] = useState<SearchTracksSource>(SearchTracksSource.youtube);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);
    return () => clearTimeout(timer);
  }, [query]);

  const { data: searchResults, isLoading: searchLoading } = useSearchTracks(
    { q: debouncedQuery, source },
    { query: { enabled: debouncedQuery.length > 0 } }
  );

  const playMutation = usePlayTrack();

  const handlePlay = (trackUrl: string) => {
    if (!guildId) return;
    
    playMutation.mutate({
      guildId,
      data: { query: trackUrl, source }
    }, {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: getGetQueueQueryKey(guildId) });
        queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey(guildId) });
        toast({
          title: res.success ? "Added to queue" : "Error",
          description: res.message,
          variant: res.success ? "default" : "destructive",
        });
      },
      onError: (err: any) => {
        toast({
          title: "Failed to add track",
          description: err.message || "An unknown error occurred",
          variant: "destructive",
        });
      }
    });
  };

  const sources = [
    { id: SearchTracksSource.youtube, name: "YouTube", icon: SiYoutube, color: "text-[#FF0000]" },
    { id: SearchTracksSource.soundcloud, name: "SoundCloud", icon: SiSoundcloud, color: "text-[#FF5500]" },
    { id: SearchTracksSource.spotify, name: "Spotify", icon: SiSpotify, color: "text-[#1DB954]" },
  ];

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Search Tracks</h1>
        <p className="text-muted-foreground mt-2">Find and add music to the server queue.</p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input 
              placeholder="Search for a song, artist, or paste a URL..." 
              className="pl-10 h-12 bg-card/50 backdrop-blur-sm border-primary/20 focus-visible:ring-primary text-lg"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            {sources.map((s) => (
              <Button
                key={s.id}
                variant={source === s.id ? "default" : "outline"}
                className={`h-12 w-12 sm:w-auto px-0 sm:px-4 ${source === s.id ? "" : "bg-card/50"}`}
                onClick={() => setSource(s.id)}
                title={s.name}
              >
                <s.icon className={`h-5 w-5 ${source !== s.id ? s.color : ""}`} />
                <span className="hidden sm:inline ml-2">{s.name}</span>
              </Button>
            ))}
          </div>
        </div>

        <Card className="bg-card/50 backdrop-blur-sm border-primary/10 min-h-[400px]">
          <CardContent className="p-0">
            {searchLoading ? (
              <div className="divide-y border-border/50">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-md" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                  </div>
                ))}
              </div>
            ) : debouncedQuery.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <Search className="h-12 w-12 mb-4 opacity-20" />
                <p>Start typing to search for music</p>
              </div>
            ) : searchResults && searchResults.tracks.length > 0 ? (
              <div className="divide-y border-border/50">
                {searchResults.tracks.map((track, i) => (
                  <div key={i} className="p-4 flex items-center gap-4 hover:bg-white/5 transition-colors group">
                    <div className="relative h-12 w-12 rounded-md overflow-hidden bg-muted shrink-0">
                      {track.thumbnail ? (
                        <img src={track.thumbnail} alt={track.title} className="object-cover w-full h-full" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/20">
                          <Music className="w-6 h-6 text-primary" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 text-white hover:text-primary hover:bg-transparent"
                          onClick={() => handlePlay(track.uri || track.identifier)}
                          disabled={playMutation.isPending}
                        >
                          <Play className="h-5 w-5 fill-current" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">{track.title}</p>
                      <p className="text-xs text-muted-foreground mt-1.5 truncate">{track.author}</p>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <span className="text-sm text-muted-foreground tabular-nums hidden sm:block">
                        {formatDuration(track.duration)}
                      </span>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handlePlay(track.uri || track.identifier)}
                        disabled={playMutation.isPending}
                      >
                        {playMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
                        Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
                <Music className="h-12 w-12 mb-4 opacity-20" />
                <p>No tracks found for "{debouncedQuery}"</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
