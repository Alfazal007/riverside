CREATE TYPE event_action AS ENUM ('join', 'left');

CREATE TABLE recordevents (
    id SERIAL PRIMARY KEY,
    recording_id INT NOT NULL,
    action event_action NOT NULL,
    user_id INT NOT NULL,
    meet_id INT NOT NULL,
    timestamp BIGINT NOT NULL,

    CONSTRAINT fk_meet FOREIGN KEY (meet_id)
        REFERENCES meets(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_host FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_recording FOREIGN KEY (recording_id)
        REFERENCES recordings(id)
        ON DELETE CASCADE
);

