CREATE TABLE "mod_snapshots" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"mod_id" text NOT NULL,
	"snapshot_at" timestamp with time zone NOT NULL,
	"downloads" bigint NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mods" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"author" text,
	"categories" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sent_notifications" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"mod_id" text NOT NULL,
	"flag" text NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mod_snapshots" ADD CONSTRAINT "mod_snapshots_mod_id_mods_id_fk" FOREIGN KEY ("mod_id") REFERENCES "public"."mods"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_snapshots_mod_time" ON "mod_snapshots" USING btree ("mod_id","snapshot_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_sent_mod_flag_time" ON "sent_notifications" USING btree ("mod_id","flag","sent_at" DESC NULLS LAST);