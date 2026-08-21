CREATE TYPE "public"."product_category" AS ENUM('window', 'door');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'representative');--> statement-breakpoint
CREATE TABLE "brands" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"factor" numeric(8, 4) NOT NULL,
	"par_factor" numeric(8, 4),
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	CONSTRAINT "brands_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "contract_disclaimers" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"description" text NOT NULL,
	"sort_order" integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"representative_id" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" varchar(500),
	"city" varchar(100),
	"state" varchar(50) DEFAULT 'HI',
	"zip" varchar(20),
	"email" varchar(255),
	"phone" varchar(20),
	"alt_phone" varchar(20),
	"comments" text,
	"discount_percent" numeric(5, 2) DEFAULT '0',
	"down_payment_amount" numeric(10, 2),
	"estimate_start_date" varchar(50),
	"estimate_end_date" varchar(50),
	"no_grid" boolean DEFAULT false,
	"custom_terms" text,
	"signature_svg" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "disclaimers" (
	"id" serial PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"sort_order" integer DEFAULT 0,
	"include_by_default" boolean DEFAULT true,
	"active" boolean DEFAULT true NOT NULL,
	CONSTRAINT "disclaimers_description_unique" UNIQUE("description")
);
--> statement-breakpoint
CREATE TABLE "frame_colors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"hex_color" varchar(7),
	"factor" numeric(8, 4) DEFAULT '0' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	CONSTRAINT "frame_colors_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "frame_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"factor" numeric(8, 4) DEFAULT '0' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	CONSTRAINT "frame_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "glass_types" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"factor" numeric(8, 4) DEFAULT '0' NOT NULL,
	"image_path" varchar(255),
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	CONSTRAINT "glass_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "grid_sizes" (
	"id" serial PRIMARY KEY NOT NULL,
	"size" varchar(50) NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	CONSTRAINT "grid_sizes_size_unique" UNIQUE("size")
);
--> statement-breakpoint
CREATE TABLE "grid_styles" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"factor" numeric(8, 4) DEFAULT '0' NOT NULL,
	"image_path" varchar(255),
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	CONSTRAINT "grid_styles_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "product_configs" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"category" "product_category" NOT NULL,
	"operation_type" varchar(50),
	"lite_count" integer DEFAULT 1,
	"description" text,
	"image_path" varchar(255) NOT NULL,
	"svg_template" text,
	"active" boolean DEFAULT true NOT NULL,
	"sort_order" integer DEFAULT 0,
	CONSTRAINT "product_configs_name_category" UNIQUE("name","category")
);
--> statement-breakpoint
CREATE TABLE "representatives" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"username" varchar(100) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(20),
	"role" "user_role" DEFAULT 'representative' NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "representatives_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(64) PRIMARY KEY NOT NULL,
	"representative_id" integer NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" varchar(100) PRIMARY KEY NOT NULL,
	"value" text NOT NULL,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "windows" (
	"id" serial PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"location" varchar(255) NOT NULL,
	"brand_id" integer,
	"product_config_id" integer,
	"frame_type_id" integer,
	"frame_color_id" integer,
	"glass_type_id" integer,
	"grid_style_id" integer,
	"grid_size_id" integer,
	"width" varchar(50) NOT NULL,
	"height" varchar(50) NOT NULL,
	"low_e" boolean DEFAULT true,
	"is_door" boolean DEFAULT false,
	"design" jsonb,
	"calculated_price" numeric(10, 2),
	"manual_price" numeric(10, 2),
	"apply_custom_discount" boolean DEFAULT false,
	"custom_discount_percent" numeric(5, 2) DEFAULT '0',
	"special_instructions" text,
	"sort_order" integer DEFAULT 0,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "contract_disclaimers" ADD CONSTRAINT "contract_disclaimers_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "customers" ADD CONSTRAINT "customers_representative_id_representatives_id_fk" FOREIGN KEY ("representative_id") REFERENCES "public"."representatives"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_representative_id_representatives_id_fk" FOREIGN KEY ("representative_id") REFERENCES "public"."representatives"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "windows" ADD CONSTRAINT "windows_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "windows" ADD CONSTRAINT "windows_brand_id_brands_id_fk" FOREIGN KEY ("brand_id") REFERENCES "public"."brands"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "windows" ADD CONSTRAINT "windows_product_config_id_product_configs_id_fk" FOREIGN KEY ("product_config_id") REFERENCES "public"."product_configs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "windows" ADD CONSTRAINT "windows_frame_type_id_frame_types_id_fk" FOREIGN KEY ("frame_type_id") REFERENCES "public"."frame_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "windows" ADD CONSTRAINT "windows_frame_color_id_frame_colors_id_fk" FOREIGN KEY ("frame_color_id") REFERENCES "public"."frame_colors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "windows" ADD CONSTRAINT "windows_glass_type_id_glass_types_id_fk" FOREIGN KEY ("glass_type_id") REFERENCES "public"."glass_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "windows" ADD CONSTRAINT "windows_grid_style_id_grid_styles_id_fk" FOREIGN KEY ("grid_style_id") REFERENCES "public"."grid_styles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "windows" ADD CONSTRAINT "windows_grid_size_id_grid_sizes_id_fk" FOREIGN KEY ("grid_size_id") REFERENCES "public"."grid_sizes"("id") ON DELETE no action ON UPDATE no action;