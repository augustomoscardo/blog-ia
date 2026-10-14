CREATE TABLE IF NOT EXISTS posts (
	id TEXT PRIMARY KEY,
	title TEXT NOT NULL,
	content TEXT NOT NULL,
	published_at TIMESTAMPTZ,
	created_at TIMESTAMPTZ NOT NULL,
	approved_at TIMESTAMPTZ,
	rejected_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts (created_at DESC);

