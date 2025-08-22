CREATE TABLE combine_video (
    recording_id INT PRIMARY KEY,

    CONSTRAINT fk_recording FOREIGN KEY (recording_id)
        REFERENCES recordings(id)
        ON DELETE CASCADE
);
