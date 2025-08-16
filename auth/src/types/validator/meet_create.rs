use validator::Validate;

#[derive(Validate, serde::Deserialize)]
pub struct MeetCreate {
    #[validate(length(min = 1, max = 255, message = "Title not provided"))]
    pub title: String,
}
