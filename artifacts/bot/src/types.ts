import type {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  AutocompleteInteraction,
} from "discord.js";
import type { MusicClient } from "./lib/client.js";

export interface SlashCommand {
  data: SlashCommandBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
  execute: (interaction: ChatInputCommandInteraction, client: MusicClient) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction, client: MusicClient) => Promise<void>;
}
