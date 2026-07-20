-- SiteContent is the 6th and final @Entity in the codebase (confirmed by grepping every
-- @Entity in src/main/java) — another table the old a3fit_backend database already had
-- from ddl-auto:update, missed when baselining the fresh aio_backend database.

CREATE TABLE IF NOT EXISTS site_content (
    key        VARCHAR(255) PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TIMESTAMP NOT NULL
);
