use validator::Validate;

#[derive(Validate, serde::Deserialize)]
pub struct MeetHost {
    pub meet_id: i32,
}
