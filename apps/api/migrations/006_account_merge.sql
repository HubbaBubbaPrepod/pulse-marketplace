ALTER TABLE oauth_states ADD COLUMN merge_requested boolean NOT NULL DEFAULT false;
CREATE TABLE account_merges (
  session_hash text PRIMARY KEY CHECK(length(session_hash)=64),
  target_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  source_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  CHECK(target_user_id<>source_user_id)
);
CREATE INDEX account_merge_expiry ON account_merges(expires_at);
