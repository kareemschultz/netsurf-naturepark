-- Netsurf Nature Park — initial schema
-- Run against kt-central-db (PostgreSQL)

CREATE TABLE IF NOT EXISTS netsurf_bookings (
  id               SERIAL PRIMARY KEY,
  cabin_slug       VARCHAR(100)  NOT NULL,
  check_in         DATE          NOT NULL,
  check_out        DATE          NOT NULL,
  guests           INTEGER       NOT NULL DEFAULT 1,
  add_on_slugs     TEXT[]        NOT NULL DEFAULT '{}',
  name             VARCHAR(200)  NOT NULL,
  contact          VARCHAR(200)  NOT NULL,
  notes            TEXT          NOT NULL DEFAULT '',
  status           VARCHAR(20)   NOT NULL DEFAULT 'pending',
  action_token     VARCHAR(128),
  estimated_total_gyd INTEGER    NOT NULL DEFAULT 0,
  admin_notes      TEXT          NOT NULL DEFAULT '',
  created_at       TIMESTAMP     NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS netsurf_blocked_dates (
  id          SERIAL PRIMARY KEY,
  cabin_slug  VARCHAR(100),          -- NULL = all cabins
  start_date  DATE        NOT NULL,
  end_date    DATE        NOT NULL,
  reason      TEXT        NOT NULL DEFAULT '',
  created_at  TIMESTAMP   NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_cabin_dates
  ON netsurf_bookings (cabin_slug, check_in, check_out);

CREATE INDEX IF NOT EXISTS idx_bookings_status
  ON netsurf_bookings (status);

CREATE INDEX IF NOT EXISTS idx_blocked_cabin
  ON netsurf_blocked_dates (cabin_slug, start_date, end_date);
