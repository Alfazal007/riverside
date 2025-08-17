use sqlx::prelude::FromRow;

#[derive(FromRow, serde::Deserialize, Debug, serde::Serialize)]
pub struct MeetFromDb {
    pub id: i32,
    pub title: String,
    pub host: i32,
    pub is_finished: bool,
}
