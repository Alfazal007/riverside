use actix_web::{
    HttpResponse, Responder,
    cookie::{Cookie, SameSite},
    web,
};
use bcrypt::verify;
use redis::Commands;

use crate::{
    helpers::generate_token,
    types::{
        main::AppState,
        models::user::user_from_db::GeneralUserWithPassword,
        responses::{general_errors::GeneralErrorsToBeReturned, login_response::LoginResponse},
        shared_trait::validate_trait::ValidateTrait,
    },
};

pub async fn signin(
    data: web::Data<AppState>,
    sign_in_data: web::Json<crate::types::validator::user_signin::SigninData>,
) -> impl Responder {
    let validation_errors = sign_in_data.check_validation();
    if validation_errors.is_some() {
        return HttpResponse::BadRequest().json(validation_errors.unwrap());
    }
    let existing_user =
        sqlx::query_as::<_, GeneralUserWithPassword>("select * from users where email=$1")
            .bind(&sign_in_data.0.email)
            .fetch_optional(&data.db_connection_pool)
            .await;
    if existing_user.is_err() {
        println!("{:?}", existing_user);
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: String::from("Issue talking to the database"),
        });
    }
    if existing_user.as_ref().unwrap().is_none() {
        return HttpResponse::NotFound().json(GeneralErrorsToBeReturned {
            error: String::from("Could not find the user in the database"),
        });
    }

    let valid = verify(
        &sign_in_data.0.password,
        &existing_user.as_ref().unwrap().as_ref().unwrap().password,
    );

    if valid.is_err() {
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: String::from("Issue checking password correctness"),
        });
    }

    if !valid.unwrap() {
        return HttpResponse::BadRequest().json(GeneralErrorsToBeReturned {
            error: String::from("Wrong password"),
        });
    }

    let user = existing_user.unwrap().unwrap();
    let token_res = generate_token::generate_token(&user.email, user.id, &data.access_token_secret);
    if token_res.is_err() {
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: String::from("Issue generating access token"),
        });
    }

    let redis_conn = data.redis_client.get();
    if redis_conn.is_ok() {
        let _: () = redis_conn
            .unwrap()
            .set(format!("auth:{}", user.id), token_res.as_ref().unwrap())
            .unwrap();
    }

    let cookie1 = Cookie::build("accessToken", token_res.as_ref().unwrap())
        .path("/")
        .secure(true)
        .http_only(true)
        .same_site(SameSite::None)
        .finish();

    let cookie2 = Cookie::build("userId", format!("{}", user.id))
        .path("/")
        .secure(true)
        .http_only(true)
        .same_site(SameSite::None)
        .finish();

    return HttpResponse::Ok()
        .cookie(cookie1)
        .cookie(cookie2)
        .json(LoginResponse {
            user_id: user.id,
            access_token: token_res.unwrap(),
        });
}
