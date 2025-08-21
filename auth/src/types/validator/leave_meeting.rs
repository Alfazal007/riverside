use validator::Validate;

#[derive(Validate, serde::Deserialize)]
pub struct LeaveMeeting {
    pub leave_time: i64,
    pub meet_id: i32,
}
