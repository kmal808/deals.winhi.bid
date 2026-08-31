CREATE TABLE "feedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"representative_id" integer,
	"message" text NOT NULL,
	"path" varchar(500),
	"customer_id" integer,
	"user_agent" varchar(500),
	"app_version" varchar(100),
	"resolved_at" timestamp,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_representative_id_representatives_id_fk" FOREIGN KEY ("representative_id") REFERENCES "public"."representatives"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE set null ON UPDATE no action;