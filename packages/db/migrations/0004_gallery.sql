CREATE TABLE "netsurf_gallery_photos" (
  "id" serial PRIMARY KEY NOT NULL,
  "filename" text NOT NULL,
  "original_name" text NOT NULL,
  "alt_text" text DEFAULT '' NOT NULL,
  "caption" text DEFAULT '' NOT NULL,
  "category" text DEFAULT 'visitor' NOT NULL,
  "uploader_name" text DEFAULT '' NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE "netsurf_promo_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "title" text NOT NULL,
  "subtitle" text DEFAULT '' NOT NULL,
  "image_filename" text DEFAULT '' NOT NULL,
  "cta_text" text DEFAULT '' NOT NULL,
  "cta_url" text DEFAULT '' NOT NULL,
  "is_active" boolean DEFAULT true NOT NULL,
  "sort_order" integer DEFAULT 0 NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
