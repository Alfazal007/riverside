#[derive(serde::Serialize, serde::Deserialize)]
pub struct LoginResponse {
    pub user_id: i32,
    pub access_token: String,
}
