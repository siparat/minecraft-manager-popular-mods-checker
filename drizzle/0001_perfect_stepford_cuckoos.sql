ALTER TABLE "mods" ADD COLUMN "release_date" timestamp with time zone;--> statement-breakpoint
CREATE INDEX "idx_mods_release_date" ON "mods" USING btree ("release_date" DESC NULLS LAST);