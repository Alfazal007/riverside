use validator::Validate;

#[derive(Validate, serde::Deserialize)]
pub struct MeetInfo {
    pub meet_id: i32,
}
