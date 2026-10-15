CREATE INDEX revisions_status_id ON revisions(status,id);
CREATE INDEX revisions_module_publication ON revisions(lower(owner),module_id,reviewed_at DESC,id DESC) WHERE status='approved';
CREATE INDEX repositories_owner ON repositories(owner_id);
CREATE INDEX email_tokens_expiry ON email_tokens(expires_at);
CREATE INDEX oauth_states_expiry ON oauth_states(expires_at);
CREATE INDEX rate_limits_expiry ON rate_limits(expires_at);
CREATE INDEX email_outbox_expiry ON email_outbox(expires_at);
