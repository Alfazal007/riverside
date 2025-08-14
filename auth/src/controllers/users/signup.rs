use actix_web::{HttpResponse, Responder, web};
use bcrypt::hash;

use crate::types::{
    main::AppState,
    models::user::user_from_db::{GeneralUserWithoutPassword, UserFromDBExistingCheck},
    responses::general_errors::GeneralErrorsToBeReturned,
    shared_trait::validate_trait::ValidateTrait,
};

pub async fn signup(
    data: web::Data<AppState>,
    sign_up_data: web::Json<crate::types::validator::user_signup::SignupData>,
) -> impl Responder {
    let validation_errors = sign_up_data.check_validation();
    if validation_errors.is_some() {
        return HttpResponse::BadRequest().json(validation_errors.unwrap());
    }
    let existing_user =
        sqlx::query_as::<_, UserFromDBExistingCheck>("select * from users where email=$1")
            .bind(&sign_up_data.0.email)
            .fetch_optional(&data.db_connection_pool)
            .await;
    if existing_user.is_err() {
        println!("{:?}", existing_user);
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: String::from("Issue talking to the database"),
        });
    }
    if existing_user.unwrap().is_some() {
        return HttpResponse::BadRequest().json(GeneralErrorsToBeReturned {
            error: String::from("Choose a different email"),
        });
    }
    let password = &sign_up_data.0.password;
    let hashed = hash(password, 12);
    if hashed.is_err() {
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: String::from("Issue hashing the password"),
        });
    }

    let new_user = sqlx::query_as::<_, GeneralUserWithoutPassword>(
        "insert into users (username, email, password) values($1, $2, $3) returning *",
    )
    .bind(sign_up_data.0.username)
    .bind(sign_up_data.0.email)
    .bind(hashed.unwrap())
    .fetch_optional(&data.db_connection_pool)
    .await;

    if new_user.is_err() {
        println!("{:?}", new_user);
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: String::from("Issue talking to the database"),
        });
    }
    if new_user.as_ref().unwrap().is_none() {
        return HttpResponse::BadRequest().json(GeneralErrorsToBeReturned {
            error: String::from("Issue writing to the database"),
        });
    }
    return HttpResponse::Created().json(new_user.unwrap().unwrap());
}
