-- BrandPulse AI - Database Initialization
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Role Enum
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Users Table (Sign In & Sign Up)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    avatar_url VARCHAR(500),
    role user_role DEFAULT 'USER',
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- User Sessions Table (Authentication & Token Tracking)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) UNIQUE NOT NULL,
    user_agent VARCHAR(500),
    ip_address VARCHAR(45),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);

-- Brands Table
CREATE TABLE IF NOT EXISTS brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    industry VARCHAR(100),
    website VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Sentiment Analysis Records
CREATE TABLE IF NOT EXISTS sentiments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    source VARCHAR(50) NOT NULL, -- e.g., twitter, reddit, news, review
    content TEXT NOT NULL,
    sentiment_label VARCHAR(20) NOT NULL, -- POSITIVE, NEGATIVE, NEUTRAL
    sentiment_score NUMERIC(5, 4) NOT NULL, -- Confidence score between 0.0000 and 1.0000
    model_version VARCHAR(50),
    aspects JSONB DEFAULT '[]'::jsonb, -- Aspect-based sentiment targets and polarities
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sentiments_brand_id ON sentiments(brand_id);
CREATE INDEX IF NOT EXISTS idx_sentiments_user_id ON sentiments(user_id);

-- Aspect Aggregations Table
CREATE TABLE IF NOT EXISTS aspect_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
    aspect_name VARCHAR(100) NOT NULL, -- e.g., "customer support", "pricing", "performance"
    positive_count INT DEFAULT 0,
    negative_count INT DEFAULT 0,
    neutral_count INT DEFAULT 0,
    average_score NUMERIC(5, 4) DEFAULT 0.0000,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (brand_id, aspect_name)
);

-- Sample Initial Data
INSERT INTO brands (name, industry, website) 
VALUES ('Acme Corp', 'Technology', 'https://acme.example.com')
ON CONFLICT DO NOTHING;
