CREATE TABLE participants (
    id SERIAL PRIMARY KEY,
    meet_id INT not null,
    user_id INT not null,
    is_host BOOLEAN default(false),
    CONSTRAINT fk_meet FOREIGN KEY (meet_id)
        REFERENCES meets(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_user FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT unique_meet_user UNIQUE (meet_id, user_id)
);

