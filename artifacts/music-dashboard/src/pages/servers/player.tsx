import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { 
  useGetPlayer, 
  useGetQueue,
  usePlayTrack,
  usePausePlayer,
  useSkipTrack,
  useStopPlayer,
  useSetVolume,
  useSeekTrack,
  useShuffleQueue,
  useSetLoopMode,
  useRemoveFromQueue,
  getGetPlayerQueryKey,
  getGetQueueQueryKey
} from "@workspace/api-client-react";
import { PlayerStateLoopMode } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Play, Pause, SkipForward, Square, Volume2, VolumeX, 
  Repeat, Repeat1, Shuffle, Music, GripVertical, Trash2,
  Search, Settings as SettingsIcon
} from "lucide-react";
import { formatDuration } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

export default function ServerPlayer() {
  const params = useParams();
  const guildId = params.guildId as string;
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: player, isLoading: playerLoading } = useGetPlayer(guildId, {
    query: { 
      enabled: !!guildId,
      refetchInterval: 3000
    }
  });

  const { data: queue, isLoading: queueLoading } = useGetQueue(guildId, {
    query: {
      enabled: !!guildId,
      refetchInterval: 3000
    }
  });

  const pauseMutation = usePausePlayer();
  const skipMutation = useSkipTrack();
  const stopMutation = useStopPlayer();
  const volumeMutation = useSetVolume();
  const seekMutation = useSeekTrack();
  const shuffleMutation = useShuffleQueue();
  const loopMutation = useSetLoopMode();
  const removeMutation = useRemoveFromQueue();

  const [localVolume, setLocalVolume] = useState<number>(100);
  const [localPosition, setLocalPosition] = useState<number>(0);
  const [isDraggingSeek, setIsDraggingSeek] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);

  // Sync local state with server state when not dragging
  useEffect(() => {
    if (player && !isDraggingVolume) {
      setLocalVolume(player.volume);
    }
    if (player && !isDraggingSeek) {
      setLocalPosition(player.position);
    }
  }, [player, isDraggingVolume, isDraggingSeek]);

  // Simulate progress locally between polls
  useEffect(() => {
    if (!player || player.isPaused || !player.isPlaying || isDraggingSeek) return;
    
    const interval = setInterval(() => {
      setLocalPosition(prev => {
        if (player.currentTrack && prev >= player.currentTrack.duration) return prev;
        return prev + 1000;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [player, isDraggingSeek]);

  const handlePlayPause = () => {
    if (!guildId) return;
    pauseMutation.mutate({ guildId }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey(guildId) })
    });
  };

  const handleSkip = () => {
    if (!guildId) return;
    skipMutation.mutate({ guildId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey(guildId) });
        queryClient.invalidateQueries({ queryKey: getGetQueueQueryKey(guildId) });
      }
    });
  };

  const handleStop = () => {
    if (!guildId) return;
    stopMutation.mutate({ guildId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey(guildId) });
        queryClient.invalidateQueries({ queryKey: getGetQueueQueryKey(guildId) });
      }
    });
  };

  const handleVolumeCommit = (val: number[]) => {
    if (!guildId) return;
    setIsDraggingVolume(false);
    volumeMutation.mutate({ guildId, data: { volume: val[0] } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey(guildId) })
    });
  };

  const handleSeekCommit = (val: number[]) => {
    if (!guildId) return;
    setIsDraggingSeek(false);
    seekMutation.mutate({ guildId, data: { position: val[0] } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey(guildId) })
    });
  };

  const handleShuffle = () => {
    if (!guildId) return;
    shuffleMutation.mutate({ guildId }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetQueueQueryKey(guildId) });
        toast({ title: "Queue shuffled" });
      }
    });
  };

  const handleLoopToggle = () => {
    if (!guildId || !player) return;
    const modes: PlayerStateLoopMode[] = [PlayerStateLoopMode.none, PlayerStateLoopMode.track, PlayerStateLoopMode.queue];
    const nextMode = modes[(modes.indexOf(player.loopMode) + 1) % modes.length];
    
    loopMutation.mutate({ guildId, data: { mode: nextMode } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey(guildId) })
    });
  };

  const handleRemoveTrack = (index: number) => {
    if (!guildId) return;
    removeMutation.mutate({ guildId, index }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetQueueQueryKey(guildId) })
    });
  };

  const isPlaying = player?.isPlaying && !player?.isPaused;
  const currentTrack = player?.currentTrack;
  const duration = currentTrack?.duration || 0;
  const progressPercent = duration > 0 ? (localPosition / duration) * 100 : 0;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8">
        
        {/* Header Actions */}
        <div className="flex justify-between items-center max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold tracking-tight">Player</h1>
          <div className="flex gap-2">
            <Link href={`/servers/${guildId}/search`}>
              <Button variant="outline" size="sm" className="bg-card/50">
                <Search className="w-4 h-4 mr-2" />
                Add Music
              </Button>
            </Link>
          </div>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Player Area */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-6">
            <Card className="bg-card/50 backdrop-blur-xl border-primary/20 shadow-2xl overflow-hidden relative">
              {/* Background blurred artwork */}
              {currentTrack?.thumbnail && (
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-10 blur-3xl scale-110"
                  style={{ backgroundImage: `url(${currentTrack.thumbnail})` }}
                />
              )}
              
              <CardContent className="p-8 relative z-10">
                {playerLoading ? (
                  <div className="space-y-8">
                    <Skeleton className="w-full aspect-video rounded-xl" />
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ) : !currentTrack ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                      <Music className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-xl font-medium text-foreground mb-2">Nothing is playing</h2>
                    <p>Add some tracks to get started</p>
                    <Link href={`/servers/${guildId}/search`}>
                      <Button className="mt-6">Search Tracks</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-8">
                    {/* Artwork */}
                    <motion.div 
                      key={currentTrack.identifier}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="aspect-video w-full rounded-2xl overflow-hidden shadow-2xl relative bg-black/50"
                    >
                      {currentTrack.thumbnail ? (
                        <img 
                          src={currentTrack.thumbnail} 
                          alt={currentTrack.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-16 h-16 text-muted-foreground opacity-50" />
                        </div>
                      )}
                    </motion.div>

                    {/* Track Info */}
                    <div className="space-y-2">
                      <h2 className="text-2xl md:text-3xl font-bold leading-tight line-clamp-2 text-foreground">
                        {currentTrack.title}
                      </h2>
                      <p className="text-lg text-primary font-medium truncate">
                        {currentTrack.author}
                      </p>
                    </div>

                    {/* Progress */}
                    <div className="space-y-3">
                      <Slider
                        value={[localPosition]}
                        min={0}
                        max={duration}
                        step={1000}
                        onValueChange={(val) => {
                          setIsDraggingSeek(true);
                          setLocalPosition(val[0]);
                        }}
                        onValueCommit={handleSeekCommit}
                        className="py-2"
                        disabled={currentTrack.isStream}
                      />
                      <div className="flex justify-between text-sm text-muted-foreground font-medium tabular-nums">
                        <span>{currentTrack.isStream ? "LIVE" : formatDuration(localPosition)}</span>
                        <span>{currentTrack.isStream ? "" : formatDuration(duration)}</span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between pt-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleShuffle}
                          disabled={!queue || queue.tracks.length < 2}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <Shuffle className="w-5 h-5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleLoopToggle}
                          className={player.loopMode !== PlayerStateLoopMode.none ? "text-primary" : "text-muted-foreground hover:text-foreground"}
                        >
                          {player.loopMode === PlayerStateLoopMode.track ? (
                            <Repeat1 className="w-5 h-5" />
                          ) : (
                            <Repeat className="w-5 h-5" />
                          )}
                        </Button>
                      </div>

                      <div className="flex items-center gap-4">
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-12 h-12 rounded-full bg-background/50 border-border/50"
                          onClick={handleStop}
                        >
                          <Square className="w-5 h-5" />
                        </Button>
                        
                        <Button
                          size="icon"
                          className="w-16 h-16 rounded-full shadow-lg hover:scale-105 transition-transform"
                          onClick={handlePlayPause}
                        >
                          {isPlaying ? (
                            <Pause className="w-7 h-7 fill-current" />
                          ) : (
                            <Play className="w-7 h-7 fill-current ml-1" />
                          )}
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          className="w-12 h-12 rounded-full bg-background/50 border-border/50"
                          onClick={handleSkip}
                        >
                          <SkipForward className="w-5 h-5 fill-current" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-2 w-32">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-muted-foreground h-8 w-8 shrink-0"
                          onClick={() => handleVolumeCommit([localVolume === 0 ? 100 : 0])}
                        >
                          {localVolume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </Button>
                        <Slider
                          value={[localVolume]}
                          min={0}
                          max={150}
                          step={1}
                          onValueChange={(val) => {
                            setIsDraggingVolume(true);
                            setLocalVolume(val[0]);
                          }}
                          onValueCommit={handleVolumeCommit}
                          className="py-2"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Queue Sidebar */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col min-h-[500px] lg:h-[calc(100vh-10rem)]">
            <Card className="flex-1 flex flex-col bg-card/30 backdrop-blur-md border-border/50 overflow-hidden">
              <div className="p-4 border-b border-border/50 flex items-center justify-between bg-card/50">
                <div className="font-semibold flex items-center gap-2">
                  Up Next
                  {queue && queue.tracks.length > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs">
                      {queue.tracks.length}
                    </span>
                  )}
                </div>
                {queue && queue.tracks.length > 0 && (
                  <div className="text-xs text-muted-foreground font-medium tabular-nums">
                    {formatDuration(queue.totalDuration)}
                  </div>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto p-2">
                {queueLoading ? (
                  <div className="space-y-2 p-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full rounded-md" />
                    ))}
                  </div>
                ) : queue?.tracks && queue.tracks.length > 0 ? (
                  <div className="space-y-1">
                    <AnimatePresence>
                      {queue.tracks.map((track, i) => (
                        <motion.div
                          key={`${track.identifier}-${i}`}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 group transition-colors"
                        >
                          <div className="text-muted-foreground opacity-50 group-hover:opacity-100 cursor-grab px-1">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          
                          <div className="w-10 h-10 rounded overflow-hidden bg-muted shrink-0 relative">
                            {track.thumbnail ? (
                              <img src={track.thumbnail} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <Music className="w-5 h-5 m-2.5 text-muted-foreground" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-tight truncate">{track.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{track.author}</p>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <span className="text-xs text-muted-foreground tabular-nums">
                              {formatDuration(track.duration)}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => handleRemoveTrack(i)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-60">
                    <Music className="w-12 h-12 mb-3" />
                    <p className="text-sm font-medium">Queue is empty</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
