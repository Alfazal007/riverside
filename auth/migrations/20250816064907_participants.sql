CREATE TABLE participants (
    id SERIAL PRIMARY KEY,
    meet_id INT,
    user_id INT,
    CONSTRAINT fk_meet FOREIGN KEY (meet_id)
        REFERENCES meets(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_user FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE SET NULL,
    CONSTRAINT unique_meet_user UNIQUE (meet_id, user_id)
);

