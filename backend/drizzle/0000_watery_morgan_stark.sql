CREATE TABLE "skill_edges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_map_id" uuid NOT NULL,
	"from_node_id" uuid NOT NULL,
	"to_node_id" uuid NOT NULL,
	"kind" varchar(32) DEFAULT 'path' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_maps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_node_unlock_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_node_id" uuid NOT NULL,
	"required_node_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_nodes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"skill_map_id" uuid NOT NULL,
	"code" varchar(120) NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"kind" varchar(32) NOT NULL,
	"layout_column" integer NOT NULL,
	"layout_row" integer NOT NULL,
	"unlock_mode" varchar(16) DEFAULT 'all' NOT NULL,
	"difficulty" integer,
	"memo" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_skill_node_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"skill_map_id" uuid NOT NULL,
	"skill_node_id" uuid NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "skill_edges" ADD CONSTRAINT "skill_edges_skill_map_id_skill_maps_id_fk" FOREIGN KEY ("skill_map_id") REFERENCES "public"."skill_maps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_edges" ADD CONSTRAINT "skill_edges_from_node_id_skill_nodes_id_fk" FOREIGN KEY ("from_node_id") REFERENCES "public"."skill_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_edges" ADD CONSTRAINT "skill_edges_to_node_id_skill_nodes_id_fk" FOREIGN KEY ("to_node_id") REFERENCES "public"."skill_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_node_unlock_nodes" ADD CONSTRAINT "skill_node_unlock_nodes_skill_node_id_skill_nodes_id_fk" FOREIGN KEY ("skill_node_id") REFERENCES "public"."skill_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_node_unlock_nodes" ADD CONSTRAINT "skill_node_unlock_nodes_required_node_id_skill_nodes_id_fk" FOREIGN KEY ("required_node_id") REFERENCES "public"."skill_nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_nodes" ADD CONSTRAINT "skill_nodes_skill_map_id_skill_maps_id_fk" FOREIGN KEY ("skill_map_id") REFERENCES "public"."skill_maps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skill_node_progress" ADD CONSTRAINT "user_skill_node_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skill_node_progress" ADD CONSTRAINT "user_skill_node_progress_skill_map_id_skill_maps_id_fk" FOREIGN KEY ("skill_map_id") REFERENCES "public"."skill_maps"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_skill_node_progress" ADD CONSTRAINT "user_skill_node_progress_skill_node_id_skill_nodes_id_fk" FOREIGN KEY ("skill_node_id") REFERENCES "public"."skill_nodes"("id") ON DELETE cascade ON UPDATE no action;