use validator::Validate;

#[derive(Validate, serde::Deserialize)]
pub struct RemoveParticipant {
    pub participant_user_id: i32,
    pub meet_id: i32,
}
