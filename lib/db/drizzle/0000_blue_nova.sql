CREATE TABLE "guild_settings" (
	"guild_id" text PRIMARY KEY NOT NULL,
	"prefix" text DEFAULT '!' NOT NULL,
	"default_volume" integer DEFAULT 80 NOT NULL,
	"dj_role_id" text,
	"text_channel_id" text,
	"autoplay" boolean DEFAULT false NOT NULL,
	"announce_now_playing" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "play_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"guild_id" text NOT NULL,
	"guild_name" text,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"duration" integer NOT NULL,
	"thumbnail" text,
	"uri" text,
	"source_name" text NOT NULL,
	"requested_by" text,
	"played_at" timestamp DEFAULT now() NOT NULL
);
