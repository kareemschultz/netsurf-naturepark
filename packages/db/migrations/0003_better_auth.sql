CREATE TABLE IF NOT EXISTS "user" (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email VARCHAR(320) NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  image TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  username VARCHAR(60),
  display_username VARCHAR(120),
  role VARCHAR(120) NOT NULL DEFAULT 'front_desk',
  banned BOOLEAN NOT NULL DEFAULT FALSE,
  ban_reason TEXT,
  ban_expires TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "session" (
  id TEXT PRIMARY KEY,
  expires_at TIMESTAMP NOT NULL,
  token TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  impersonated_by TEXT
);

CREATE TABLE IF NOT EXISTS "account" (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at TIMESTAMP,
  refresh_token_expires_at TIMESTAMP,
  scope TEXT,
  password TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "verification" (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS user_email_unique
  ON "user" (email);

CREATE UNIQUE INDEX IF NOT EXISTS user_username_unique
  ON "user" (username);

CREATE UNIQUE INDEX IF NOT EXISTS session_token_unique
  ON "session" (token);

CREATE INDEX IF NOT EXISTS session_user_id_idx
  ON "session" (user_id);

CREATE UNIQUE INDEX IF NOT EXISTS account_provider_account_unique
  ON "account" (provider_id, account_id);

CREATE INDEX IF NOT EXISTS account_user_id_idx
  ON "account" (user_id);

CREATE INDEX IF NOT EXISTS verification_identifier_idx
  ON "verification" (identifier);
