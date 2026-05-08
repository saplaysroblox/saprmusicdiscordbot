import { Events } from "discord.js";
import type { MusicClient } from "../lib/client.js";

export const event = {
  name: Events.VoiceStateUpdate,
  async execute(oldState: { channelId: string | null; guild: { id: string } }, _newState: unknown, client: MusicClient) {
    if (!oldState.channelId) return;
    const player = client.lavalink.getPlayer(oldState.guild.id);
    if (!player) return;

    const guild = client.guilds.cache.get(oldState.guild.id);
    if (!guild) return;

    const voiceChannel = guild.channels.cache.get(player.voiceChannelId ?? "");
    if (!voiceChannel || !voiceChannel.isVoiceBased()) return;

    const members = voiceChannel.members.filter((m) => !m.user.bot);
    if (members.size === 0) {
      setTimeout(async () => {
        const p = client.lavalink.getPlayer(oldState.guild.id);
        if (p) {
          const vc = guild.channels.cache.get(p.voiceChannelId ?? "");
          if (vc && vc.isVoiceBased() && vc.members.filter((m) => !m.user.bot).size === 0) {
            await p.destroy();
          }
        }
      }, 60_000);
    }
  },
};
