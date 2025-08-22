use std::env;

use actix_cors::Cors;
use actix_web::{
    App, HttpServer, http,
    middleware::{Logger, from_fn},
    web,
};
use sqlx::postgres::PgPoolOptions;

use crate::{
    controllers::{
        meets::{
            add_participant, create_meet, get_meet_info, get_meets, is_host, join_recording,
            leave_recording, remove_participant,
        },
        time::get_time,
        users::{signin, signup, whoami},
        video::upload,
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

    let cloudinary_secret =
        env::var("CLOUDINARY_SECRET").expect("Access token secret not found in the env file");
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
            .wrap(
                Cors::default()
                    .allowed_origin("http://localhost:3000")
                    .allowed_methods(vec!["GET", "POST", "OPTIONS", "DELETE"])
                    .allowed_headers(vec![
                        http::header::CONTENT_TYPE,
                        http::header::AUTHORIZATION,
                    ])
                    .supports_credentials(),
            )
            .wrap(Logger::default())
            .app_data(web::Data::new(AppState {
                db_connection_pool: pool.clone(),
                access_token_secret: access_token_secret.clone(),
                redis_client: redis_conn.clone(),
                cloudinary_secret: cloudinary_secret.clone(),
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
                    .route("/create", web::post().to(create_meet::create_meet))
                    .route("/get-meet", web::post().to(get_meet_info::get_meet_info))
                    .route("/all-meets", web::get().to(get_meets::get_meets))
                    .route(
                        "/join-recording",
                        web::post().to(join_recording::join_recording),
                    )
                    .route(
                        "/leave-recording",
                        web::post().to(leave_recording::leave_recording),
                    )
                    .route("/is-host", web::post().to(is_host::is_host)),
            )
            .service(
                web::scope("/api/participant")
                    .wrap(from_fn(auth_middleware::auth_middleware))
                    .route("/add", web::post().to(add_participant::add_participant))
                    .route(
                        "/remove",
                        web::post().to(remove_participant::remove_participant),
                    ),
            )
            .service(
                web::scope("/video")
                    .wrap(from_fn(auth_middleware::auth_middleware))
                    .route("/upload", web::post().to(upload::get_signature)),
            )
            .service(web::scope("/api").route("/time", web::get().to(get_time::get_time)))
    })
    .bind(("127.0.0.1", 8000))?
    .run()
    .await
}
