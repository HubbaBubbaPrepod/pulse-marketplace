CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  display_name text NOT NULL CHECK (octet_length(display_name) BETWEEN 1 AND 128),
  password_hash text,
  email_verified boolean NOT NULL DEFAULT false,
  role text NOT NULL DEFAULT 'author' CHECK (role IN ('author','moderator','administrator')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE identities (
  provider text NOT NULL CHECK (provider IN ('github','google')),
  provider_id text NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY(provider,provider_id),
  UNIQUE(user_id,provider)
);
CREATE TABLE sessions (
  token_hash text PRIMARY KEY CHECK (length(token_hash)=64),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX sessions_user ON sessions(user_id);
CREATE INDEX sessions_expiry ON sessions(expires_at);
CREATE TABLE email_tokens (
  token_hash text PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose text NOT NULL CHECK (purpose IN ('verify','reset')),
  expires_at timestamptz NOT NULL
);
CREATE TABLE oauth_states (
  state_hash text PRIMARY KEY,
  binding_hash text NOT NULL,
  provider text NOT NULL CHECK(provider IN ('github','google')),
  verifier text NOT NULL,
  nonce text NOT NULL,
  next_path text NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE TABLE rate_limits (
  key text PRIMARY KEY,
  count integer NOT NULL,
  expires_at timestamptz NOT NULL
);
CREATE TABLE repositories (
  id text PRIMARY KEY CHECK (id ~ '^[0-9]+$'),
  owner_id text NOT NULL CHECK (owner_id ~ '^[0-9]+$'),
  owner text NOT NULL,
  name text NOT NULL,
  module_id text NOT NULL,
  asset_name text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE packages (
  sha256 text PRIMARY KEY CHECK(sha256 ~ '^[a-f0-9]{64}$'),
  size bigint NOT NULL CHECK(size BETWEEN 1 AND 71303168),
  stored_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE revisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  repository_id text NOT NULL REFERENCES repositories(id),
  source_owner_id text NOT NULL,
  owner text NOT NULL,
  module_id text NOT NULL,
  version text NOT NULL,
  release_id text NOT NULL,
  asset_id text NOT NULL,
  tag text NOT NULL,
  commit_sha text NOT NULL,
  sha256 text NOT NULL REFERENCES packages(sha256),
  manifest jsonb NOT NULL,
  platforms jsonb NOT NULL,
  validation_passed boolean NOT NULL,
  validation_issues jsonb NOT NULL DEFAULT '[]',
  status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','withdrawn')),
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  UNIQUE(repository_id,source_owner_id,release_id,asset_id,tag,commit_sha,sha256)
);
CREATE INDEX revision_catalog ON revisions(status,owner,module_id,version);
CREATE INDEX revision_queue ON revisions(status,created_at,id);
CREATE TABLE published_versions (
  owner text NOT NULL,
  module_id text NOT NULL,
  version text NOT NULL,
  sha256 text NOT NULL REFERENCES packages(sha256),
  revision_id uuid NOT NULL REFERENCES revisions(id),
  PRIMARY KEY(owner,module_id,version)
);
CREATE TABLE audit_events (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  actor_id uuid NOT NULL REFERENCES users(id),
  revision_id uuid REFERENCES revisions(id),
  action text NOT NULL,
  comment text NOT NULL CHECK(octet_length(comment) BETWEEN 1 AND 8000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE discovery_runs (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  summary jsonb NOT NULL DEFAULT '{}'
);
