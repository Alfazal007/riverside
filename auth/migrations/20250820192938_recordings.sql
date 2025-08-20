CREATE TABLE recordings (
    id SERIAL PRIMARY KEY,
    meet_id INT not null,
    CONSTRAINT fk_meet FOREIGN KEY (meet_id)
        REFERENCES meets(id)
        ON DELETE CASCADE
);
