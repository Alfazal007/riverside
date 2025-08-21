use serde::{Deserialize, Serialize};
use sqlx::FromRow;
use sqlx::Type;

#[derive(Debug, Serialize, Deserialize, Type)]
#[sqlx(type_name = "event_action", rename_all = "lowercase")]
pub enum EventAction {
    Join,
    Left,
}

#[derive(FromRow, serde::Deserialize, Debug, serde::Serialize)]
pub struct RecordingDb {
    pub id: i32,
    pub meet_id: i32,
}

#[derive(FromRow, serde::Deserialize, Debug, serde::Serialize)]
pub struct RecordEventDb {
    pub id: i32,
    pub recording_id: i32,
    pub action: EventAction,
    pub user_id: i32,
    pub meet_id: i32,
    pub timestamp: i64,
}
