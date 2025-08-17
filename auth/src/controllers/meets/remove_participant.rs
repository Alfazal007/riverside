use actix_web::{HttpMessage, HttpRequest, HttpResponse, Responder, web};

use crate::{
    middlewares::auth_middleware::UserData,
    types::{
        main::AppState,
        models::{
            meet::meet_from_db::MeetFromDb, participant::participant_from_db::ParticipantFromDb,
        },
        responses::general_errors::GeneralErrorsToBeReturned,
        shared_trait::validate_trait::ValidateTrait,
    },
};

pub async fn remove_participant(
    req: HttpRequest,
    app_state: web::Data<AppState>,
    remove_participant_data: web::Json<
        crate::types::validator::remove_participant::RemoveParticipant,
    >,
) -> impl Responder {
    let validation_errors = remove_participant_data.check_validation();
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
    let meet_data = sqlx::query_as::<_, MeetFromDb>("select * from meets where id=$1")
        .bind(remove_participant_data.0.meet_id)
        .fetch_optional(&app_state.db_connection_pool)
        .await;
    if meet_data.is_err() || meet_data.as_ref().unwrap().is_none() {
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: "Issue finding the data".to_string(),
        });
    }
    let meet_data = meet_data.unwrap().unwrap();
    if meet_data.host != user_data.user_id {
        return HttpResponse::Forbidden().json(GeneralErrorsToBeReturned {
            error: "You are not the host".to_string(),
        });
    }

    let deleted_data = sqlx::query_as::<_, ParticipantFromDb>(
        "delete from participants where meet_id=$1 and user_id=$2 returning *",
    )
    .bind(remove_participant_data.0.meet_id)
    .bind(remove_participant_data.0.participant_user_id)
    .fetch_optional(&app_state.db_connection_pool)
    .await;
    if deleted_data.is_err() {
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: "Issue deleting the data".to_string(),
        });
    }
    return HttpResponse::Ok().json({});
}
