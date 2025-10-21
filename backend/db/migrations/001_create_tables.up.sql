CREATE TABLE mask_keywords (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  keyword TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mask_keywords_user_id ON mask_keywords(user_id);
