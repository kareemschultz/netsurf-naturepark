CREATE TABLE "netsurf_staff_attendance_entries" (
  "id" serial PRIMARY KEY NOT NULL,
  "staff_name" varchar(200) NOT NULL,
  "location" varchar(120) DEFAULT 'Tonga' NOT NULL,
  "event_type" varchar(20) NOT NULL,
  "event_at" timestamp NOT NULL,
  "source" varchar(20) DEFAULT 'pos' NOT NULL,
  "notes" text DEFAULT '' NOT NULL,
  "recorded_by" varchar(200) NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX "staff_attendance_event_at_idx"
  ON "netsurf_staff_attendance_entries" ("event_at");

CREATE INDEX "staff_attendance_staff_event_idx"
  ON "netsurf_staff_attendance_entries" ("staff_name", "event_at");
