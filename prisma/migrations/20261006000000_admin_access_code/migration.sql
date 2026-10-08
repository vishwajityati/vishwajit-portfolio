-- Replace the email + password credential with a single access code.
--
-- `email` becomes nullable because the access code is now the only thing required to
-- sign in, so there is no account email to collect at setup time. The unique index is
-- preserved so the column remains usable as an identifier when it is set.
ALTER TABLE "Admin" ALTER COLUMN "email" DROP NOT NULL;

-- Renamed rather than dropped and re-added so the stored bcrypt hash is preserved for
-- any account that already exists.
ALTER TABLE "Admin" RENAME COLUMN "passwordHash" TO "accessCodeHash";