use redis::Client;
use sqlx::{Pool, Postgres};

pub struct AppState {
    pub db_connection_pool: Pool<Postgres>,
    pub access_token_secret: String,
    pub redis_client: r2d2::Pool<Client>,
    pub cloudinary_secret: String,
}
