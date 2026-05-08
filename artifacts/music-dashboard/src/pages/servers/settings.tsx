import { useEffect } from "react";
import { useParams } from "wouter";
import { useGetGuildSettings, useUpdateGuildSettings, getGetGuildSettingsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const settingsSchema = z.object({
  prefix: z.string().min(1, "Prefix is required").max(5, "Prefix too long"),
  defaultVolume: z.number().min(1).max(200),
  djRoleId: z.string().optional(),
  textChannelId: z.string().optional(),
  autoplay: z.boolean(),
  announceNowPlaying: z.boolean(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export default function ServerSettings() {
  const params = useParams();
  const guildId = params.guildId as string;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useGetGuildSettings(guildId, {
    query: { enabled: !!guildId }
  });

  const updateMutation = useUpdateGuildSettings();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      prefix: "!",
      defaultVolume: 100,
      djRoleId: "",
      textChannelId: "",
      autoplay: false,
      announceNowPlaying: true,
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        prefix: settings.prefix,
        defaultVolume: settings.defaultVolume,
        djRoleId: settings.djRoleId || "",
        textChannelId: settings.textChannelId || "",
        autoplay: settings.autoplay,
        announceNowPlaying: settings.announceNowPlaying,
      });
    }
  }, [settings, form]);

  const onSubmit = (data: SettingsFormValues) => {
    if (!guildId) return;

    updateMutation.mutate({
      guildId,
      data: {
        prefix: data.prefix,
        defaultVolume: data.defaultVolume,
        djRoleId: data.djRoleId || null,
        textChannelId: data.textChannelId || null,
        autoplay: data.autoplay,
        announceNowPlaying: data.announceNowPlaying,
      }
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetGuildSettingsQueryKey(guildId) });
        toast({
          title: "Settings updated",
          description: "Server settings have been saved successfully.",
        });
      },
      onError: (err: any) => {
        toast({
          title: "Failed to update settings",
          description: err.message || "An unknown error occurred",
          variant: "destructive",
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-8 max-w-3xl mx-auto space-y-8">
        <div>
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
          <CardContent className="p-6 space-y-6">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Server Settings</h1>
        <p className="text-muted-foreground mt-2">Configure how Harmonia behaves in this server.</p>
      </div>

      <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Update general playback and behavior settings.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="prefix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Command Prefix</FormLabel>
                      <FormControl>
                        <Input {...field} className="bg-background/50" />
                      </FormControl>
                      <FormDescription>The character used to trigger bot commands.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="defaultVolume"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Volume ({field.value}%)</FormLabel>
                      <FormControl>
                        <Slider
                          min={1}
                          max={200}
                          step={1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                          className="py-4"
                        />
                      </FormControl>
                      <FormDescription>Initial volume when the bot joins a voice channel.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="djRoleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>DJ Role ID (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. 123456789012345678" className="bg-background/50" />
                      </FormControl>
                      <FormDescription>Restrict music controls to a specific role.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="textChannelId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bound Text Channel ID (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g. 123456789012345678" className="bg-background/50" />
                      </FormControl>
                      <FormDescription>Restrict commands and announcements to one channel.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-border/50">
                <FormField
                  control={form.control}
                  name="autoplay"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Autoplay</FormLabel>
                        <FormDescription>
                          Automatically queue related tracks when the queue ends.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="announceNowPlaying"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/50 bg-background/50 p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Announce Now Playing</FormLabel>
                        <FormDescription>
                          Send a message when a new track starts playing.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={updateMutation.isPending || !form.formState.isDirty}>
                  {updateMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 h-4 w-4" />
                  )}
                  Save Settings
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
