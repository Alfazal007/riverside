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

#[derive(serde::Serialize)]
struct ParticipantsAndMeet {
    meet: MeetFromDb,
    participants: Vec<ParticipantFromDb>,
}

pub async fn get_meet_info(
    req: HttpRequest,
    app_state: web::Data<AppState>,
    get_meet_data: web::Json<crate::types::validator::get_meet_info::MeetInfo>,
) -> impl Responder {
    let validation_errors = get_meet_data.check_validation();
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
    let meet = sqlx::query_as::<_, MeetFromDb>("select * from meets where id=$1 and host = $2")
        .bind(get_meet_data.0.meet_id)
        .bind(user_data.user_id)
        .fetch_optional(&app_state.db_connection_pool)
        .await;

    if meet.is_err() || meet.as_ref().unwrap().is_none() {
        return HttpResponse::BadRequest().json(GeneralErrorsToBeReturned {
            error: "Issue talking to the database".to_string(),
        });
    }

    let meet = meet.unwrap().unwrap();

    let participants =
        sqlx::query_as::<_, ParticipantFromDb>("select * from participants where meet_id=$1")
            .bind(get_meet_data.0.meet_id)
            .fetch_all(&app_state.db_connection_pool)
            .await;

    if participants.is_err() {
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: "Issue talking to the database".to_string(),
        });
    }
    let participants = participants.unwrap();
    return HttpResponse::Ok().json(ParticipantsAndMeet { meet, participants });
}
