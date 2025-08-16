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

pub async fn create_meet(
    req: HttpRequest,
    app_state: web::Data<AppState>,
    create_meet_data: web::Json<crate::types::validator::meet_create::MeetCreate>,
) -> impl Responder {
    let validation_errors = create_meet_data.check_validation();
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

    let new_meet_res = sqlx::query_as::<_, MeetFromDb>(
        "insert into meets(title, host) values($1, $2) returning *",
    )
    .bind(create_meet_data.0.title)
    .bind(user_data.user_id)
    .fetch_optional(&app_state.db_connection_pool)
    .await;
    if new_meet_res.is_err() {
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: "Issue talking to the database".to_string(),
        });
    }
    let new_meet = new_meet_res.unwrap();
    if new_meet.is_none() {
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: "Issue talking to the database".to_string(),
        });
    }
    let new_meet = new_meet.unwrap();

    let new_participant = sqlx::query_as::<_, ParticipantFromDb>(
        "insert into participants (meet_id,user_id) values($1, $2) returning *",
    )
    .bind(new_meet.id)
    .bind(user_data.user_id)
    .fetch_optional(&app_state.db_connection_pool)
    .await;
    if new_participant.is_err() {
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: "Issue talking to the database".to_string(),
        });
    }
    let new_participant = new_participant.unwrap();
    if new_participant.is_none() {
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: "Issue talking to the database".to_string(),
        });
    }
    return HttpResponse::Created().json(new_meet);
}
