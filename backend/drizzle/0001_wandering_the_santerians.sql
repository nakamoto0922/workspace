CREATE INDEX "skill_edges_skill_map_id_idx" ON "skill_edges" USING btree ("skill_map_id");--> statement-breakpoint
CREATE INDEX "skill_edges_from_node_id_idx" ON "skill_edges" USING btree ("from_node_id");--> statement-breakpoint
CREATE INDEX "skill_edges_to_node_id_idx" ON "skill_edges" USING btree ("to_node_id");--> statement-breakpoint
CREATE INDEX "skill_node_unlock_nodes_skill_node_id_idx" ON "skill_node_unlock_nodes" USING btree ("skill_node_id");--> statement-breakpoint
CREATE INDEX "skill_node_unlock_nodes_required_node_id_idx" ON "skill_node_unlock_nodes" USING btree ("required_node_id");--> statement-breakpoint
CREATE INDEX "skill_nodes_skill_map_id_idx" ON "skill_nodes" USING btree ("skill_map_id");--> statement-breakpoint
CREATE INDEX "skill_nodes_code_idx" ON "skill_nodes" USING btree ("code");--> statement-breakpoint
CREATE INDEX "user_skill_node_progress_user_id_idx" ON "user_skill_node_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_skill_node_progress_skill_map_id_idx" ON "user_skill_node_progress" USING btree ("skill_map_id");--> statement-breakpoint
CREATE INDEX "user_skill_node_progress_skill_node_id_idx" ON "user_skill_node_progress" USING btree ("skill_node_id");--> statement-breakpoint
ALTER TABLE "skill_edges" ADD CONSTRAINT "skill_edges_unique" UNIQUE("skill_map_id","from_node_id","to_node_id","kind");--> statement-breakpoint
ALTER TABLE "skill_maps" ADD CONSTRAINT "skill_maps_name_version_unique" UNIQUE("name","version");--> statement-breakpoint
ALTER TABLE "skill_node_unlock_nodes" ADD CONSTRAINT "skill_node_unlock_nodes_unique" UNIQUE("skill_node_id","required_node_id");--> statement-breakpoint
ALTER TABLE "skill_nodes" ADD CONSTRAINT "skill_nodes_skill_map_id_code_unique" UNIQUE("skill_map_id","code");--> statement-breakpoint
ALTER TABLE "user_skill_node_progress" ADD CONSTRAINT "user_skill_node_progress_unique" UNIQUE("user_id","skill_map_id","skill_node_id");