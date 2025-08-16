use sqlx::prelude::FromRow;

#[derive(FromRow, serde::Deserialize, Debug, serde::Serialize)]
pub struct ParticipantFromDb {
    pub id: i32,
    pub meet_id: i32,
    pub user_id: i32,
}
