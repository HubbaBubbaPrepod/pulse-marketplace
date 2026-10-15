CREATE TABLE email_outbox (
  id uuid PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  recipient text NOT NULL,
  purpose text NOT NULL CHECK(purpose IN ('verify','reset')),
  lang text NOT NULL CHECK(lang IN ('ru','en')),
  expires_at timestamptz NOT NULL,
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);
