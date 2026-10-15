ALTER TABLE oauth_states ADD COLUMN link_user_id uuid REFERENCES users(id) ON DELETE CASCADE;
