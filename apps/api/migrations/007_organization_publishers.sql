ALTER TABLE repositories ADD COLUMN owner_type text NOT NULL DEFAULT 'User';
ALTER TABLE repositories ADD COLUMN publisher_ids jsonb NOT NULL DEFAULT '[]';
ALTER TABLE revisions ADD COLUMN source_publishers jsonb NOT NULL DEFAULT '[]';
