use validator::Validate;

#[derive(Validate, serde::Deserialize)]
pub struct AddParticipant {
    #[validate(email)]
    pub email: String,
    pub meet_id: i32,
}
