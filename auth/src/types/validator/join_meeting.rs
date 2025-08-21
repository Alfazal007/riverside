use validator::Validate;

#[derive(Validate, serde::Deserialize)]
pub struct JoinMeeting {
    pub join_time: i64,
    pub meet_id: i32,
}
