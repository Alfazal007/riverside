use actix_web::{HttpMessage, HttpRequest, HttpResponse, Responder, web};

use crate::{
    middlewares::auth_middleware::UserData,
    types::{
        main::AppState, models::user::user_from_db::GeneralUserWithoutPassword,
        responses::general_errors::GeneralErrorsToBeReturned,
    },
};

pub async fn whoami(req: HttpRequest, app_state: web::Data<AppState>) -> impl Responder {
    if req.extensions().get::<UserData>().is_none() {
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: "Issue talking to the database".to_string(),
        });
    }
    let extensions = req.extensions();
    let user_data = extensions.get::<UserData>().unwrap();

    let user_from_db = sqlx::query_as::<_, GeneralUserWithoutPassword>(
        "select * from users where id=$1 and email=$2",
    )
    .bind(&user_data.user_id)
    .bind(&user_data.email)
    .fetch_optional(&app_state.db_connection_pool)
    .await;

    if user_from_db.is_err() {
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: "Issue talking to the database".to_string(),
        });
    }
    if user_from_db.as_ref().unwrap().is_none() {
        return HttpResponse::NotFound().json(GeneralErrorsToBeReturned {
            error: "Could not find the user".to_string(),
        });
    }
    return HttpResponse::Ok().json(user_from_db.unwrap().unwrap());
}
