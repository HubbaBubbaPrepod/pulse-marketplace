CREATE TABLE discovery_jobs (
  repository_id text PRIMARY KEY,
  payload jsonb NOT NULL,
  next_check_at timestamptz NOT NULL DEFAULT now(),
  last_error text
);
ALTER TABLE revisions ADD COLUMN source_url text NOT NULL DEFAULT '';
