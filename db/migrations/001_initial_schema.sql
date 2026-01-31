-- Migration: Initial schema for Redrawn
-- Users, albums, photos, themes, credits

-- Users table
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Albums with immutable versioning
CREATE TABLE albums (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'staged' CHECK (status IN ('staged', 'confirmed', 'deleted')),
    is_public BOOLEAN NOT NULL DEFAULT false,
    password_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX idx_albums_slug ON albums(slug) WHERE status != 'deleted';
CREATE INDEX idx_albums_group ON albums(group_id, confirmed_at DESC NULLS LAST);
CREATE INDEX idx_albums_user ON albums(user_id, status);

-- Album collaborators
CREATE TABLE album_users (
    id TEXT PRIMARY KEY,
    album_id TEXT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(album_id, user_id)
);

CREATE INDEX idx_album_users_album ON album_users(album_id);
CREATE INDEX idx_album_users_user ON album_users(user_id);

-- Original photos
CREATE TABLE photos (
    id TEXT PRIMARY KEY,
    album_id TEXT NOT NULL REFERENCES albums(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    storage_key TEXT NOT NULL,
    filename TEXT,
    mime_type TEXT,
    size_bytes INTEGER,
    width INTEGER,
    height INTEGER,
    status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'ready', 'error')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_photos_album ON photos(album_id, status);
CREATE INDEX idx_photos_user ON photos(user_id);

-- Themes with immutable versioning
CREATE TABLE themes (
    id TEXT PRIMARY KEY,
    group_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    css_tokens JSONB DEFAULT '{}',
    prompt_template TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'staged' CHECK (status IN ('staged', 'confirmed', 'deleted')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    confirmed_at TIMESTAMPTZ
);

CREATE INDEX idx_themes_group ON themes(group_id, confirmed_at DESC NULLS LAST);
CREATE INDEX idx_themes_user ON themes(user_id, status);

-- Generated photos (themed variants)
CREATE TABLE generated_photos (
    id TEXT PRIMARY KEY,
    original_photo_id TEXT NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    theme_id TEXT NOT NULL REFERENCES themes(id) ON DELETE CASCADE,
    storage_key TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'processing', 'completed', 'error')),
    credits_used INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_generated_photos_original ON generated_photos(original_photo_id);
CREATE INDEX idx_generated_photos_theme ON generated_photos(theme_id);
CREATE INDEX idx_generated_photos_status ON generated_photos(status);

-- Credits system
CREATE TABLE credits (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Credit transactions
CREATE TABLE credit_transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount != 0),
    type TEXT NOT NULL CHECK (type IN ('purchase', 'usage', 'refund', 'bonus')),
    description TEXT,
    related_entity_type TEXT,
    related_entity_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_user ON credit_transactions(user_id, created_at DESC);
