use validator::Validate;

#[derive(Validate, serde::Deserialize)]
pub struct GeneratedVideo {
    pub meet_id: i32,
    pub recording_id: i32,
}
