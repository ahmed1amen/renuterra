-- Reviewers can attach one screenshot per comment. Prototype-grade storage:
-- the image is a base64 data URL in the row itself (no bucket, no upload flow).
-- The client downscales/compresses before insert (see src/features/comments/image.ts)
-- so rows stay well under Postgres' and Realtime's payload limits.

alter table page_comments add column image text;
