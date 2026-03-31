ALTER TABLE netsurf_bookings
  ADD COLUMN IF NOT EXISTS stay_type VARCHAR(20) NOT NULL DEFAULT 'overnight';

CREATE INDEX IF NOT EXISTS idx_bookings_stay_type
  ON netsurf_bookings (stay_type);
