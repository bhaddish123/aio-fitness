-- AdminUser is an @Entity with no repository or controller anywhere in the codebase
-- (the actual admin login uses the static admin.username/admin.password properties).
-- It's effectively dead code, but Hibernate's schema validation still requires a
-- backing table for any scanned @Entity, used or not. The old a3fit_backend database
-- already had this table from back when ddl-auto:update silently created it for
-- every entity it found; this brings new/fresh databases in line.

CREATE TABLE IF NOT EXISTS admin_user (
    id       UUID PRIMARY KEY,
    username VARCHAR(255),
    password VARCHAR(255),
    role     VARCHAR(255)
);
