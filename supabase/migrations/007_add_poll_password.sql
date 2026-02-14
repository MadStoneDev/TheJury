-- Migration: Add password protection to polls

ALTER TABLE polls ADD COLUMN IF NOT EXISTS password_hash TEXT DEFAULT NULL;
