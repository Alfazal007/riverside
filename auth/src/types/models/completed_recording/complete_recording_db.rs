use sqlx::prelude::FromRow;

#[derive(FromRow, serde::Deserialize, Debug, serde::Serialize)]
pub struct CompletedRecording {
    pub recording_id: i32,
}
