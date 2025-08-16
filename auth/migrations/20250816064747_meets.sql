CREATE TABLE meets (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) DEFAULT 'meet',
    host INT not null,
    CONSTRAINT fk_host FOREIGN KEY (host)
        REFERENCES users(id)
        ON DELETE CASCADE
);
