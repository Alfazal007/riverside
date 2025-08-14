use sqlx::prelude::FromRow;

#[derive(FromRow, serde::Deserialize, Debug, serde::Serialize)]
pub struct UserFromDBExistingCheck {
    pub id: i32,
}

#[derive(FromRow, serde::Deserialize, Debug, serde::Serialize)]
pub struct GeneralUserWithoutPassword {
    pub id: i32,
    pub email: String,
    pub username: String,
}

#[derive(FromRow, serde::Deserialize, Debug, serde::Serialize)]
pub struct GeneralUserWithPassword {
    pub id: i32,
    pub email: String,
    pub username: String,
    pub password: String,
}
