-- Migration: Add pending_partner_npm column to mahasiswa table
-- Purpose: Store the NPM of the partner a student wants to form a group with
-- When two students each have each other as pending_partner_npm, they are auto-matched into a kelompok

-- Add column for storing pending partner NPM
ALTER TABLE mahasiswa ADD COLUMN pending_partner_npm VARCHAR(20) DEFAULT NULL;

-- Add index for faster lookup when matching partners
CREATE INDEX idx_pending_partner ON mahasiswa(pending_partner_npm);

-- Optional: Add index on npm for faster partner search
CREATE INDEX idx_mahasiswa_npm ON mahasiswa(npm);
