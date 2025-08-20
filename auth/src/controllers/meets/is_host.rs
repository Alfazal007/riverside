use actix_web::{HttpMessage, HttpRequest, HttpResponse, Responder, web};

use crate::{
    middlewares::auth_middleware::UserData,
    types::{
        main::AppState, models::participant::participant_from_db::ParticipantFromDb,
        responses::general_errors::GeneralErrorsToBeReturned,
        shared_trait::validate_trait::ValidateTrait,
    },
};

pub async fn is_host(
    req: HttpRequest,
    app_state: web::Data<AppState>,
    is_host: web::Json<crate::types::validator::is_host::MeetHost>,
) -> impl Responder {
    let validation_errors = is_host.check_validation();
    if validation_errors.is_some() {
        return HttpResponse::BadRequest().json(validation_errors.unwrap());
    }
    if req.extensions().get::<UserData>().is_none() {
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: "Issue talking to the database".to_string(),
        });
    }
    let extensions = req.extensions();
    let user_data = extensions.get::<UserData>().unwrap();
    let participant_from_db = sqlx::query_as::<_, ParticipantFromDb>(
        "select * from participants where meet_id=$1 and user_id=$2 and is_host=$3",
    )
    .bind(is_host.0.meet_id)
    .bind(user_data.user_id)
    .bind(true)
    .fetch_optional(&app_state.db_connection_pool)
    .await;
    if participant_from_db.is_err() {
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: "Issue talking to the database".to_string(),
        });
    }
    if participant_from_db.unwrap().is_none() {
        return HttpResponse::NotFound().json(GeneralErrorsToBeReturned {
            error: "Could not find the meet".to_string(),
        });
    }
    return HttpResponse::Ok().json("");
}
