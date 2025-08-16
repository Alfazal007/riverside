use std::env;

use actix_web::{
    App, HttpServer,
    middleware::{Logger, from_fn},
    web,
};
use sqlx::postgres::PgPoolOptions;

use crate::{
    controllers::{
        meets::{add_participant, create_meet},
        users::{signin, signup, whoami},
    },
    middlewares::auth_middleware,
    types::main::AppState,
};

pub mod controllers;
pub mod helpers;
pub mod middlewares;
pub mod types;

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    dotenvy::dotenv().expect("Issue getting env files");
    env_logger::Builder::new().parse_filters("info").init();

    let database_url = env::var("DATABASE_URL").expect("Database url not found in the env file");
    let access_token_secret =
        env::var("ACCESS_SECRET").expect("Access token secret not found in the env file");
    let redis_url = env::var("REDIS_URL").expect("Redis url not found in the env file");

    let redis_client = redis::Client::open(redis_url).expect("Issue creating redis client");
    let redis_conn = r2d2::Pool::builder()
        .max_size(5)
        .build(redis_client)
        .expect("Issue connecting to redis");

    let pool = PgPoolOptions::new()
        .max_connections(5)
        .connect(&database_url)
        .await
        .expect("Issue creating connection pool");

    HttpServer::new(move || {
        App::new()
            .wrap(Logger::default())
            .app_data(web::Data::new(AppState {
                db_connection_pool: pool.clone(),
                access_token_secret: access_token_secret.clone(),
                redis_client: redis_conn.clone(),
            }))
            .service(
                web::scope("/api/auth")
                    .route("/signup", web::post().to(signup::signup))
                    .route("/signin", web::post().to(signin::signin)),
            )
            .service(
                web::scope("/api/protected")
                    .wrap(from_fn(auth_middleware::auth_middleware))
                    .route("/whoami", web::get().to(whoami::whoami)),
            )
            .service(
                web::scope("/api/meet")
                    .wrap(from_fn(auth_middleware::auth_middleware))
                    .route("/create", web::post().to(create_meet::create_meet)),
            )
            .service(
                web::scope("/api/participant")
                    .wrap(from_fn(auth_middleware::auth_middleware))
                    .route("/add", web::post().to(add_participant::add_participant)),
            )
    })
    .bind(("127.0.0.1", 8000))?
    .run()
    .await
}
