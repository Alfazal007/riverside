use validator::Validate;

#[derive(Validate, serde::Deserialize)]
pub struct AddVideo {
    pub meet_id: i32,
}
