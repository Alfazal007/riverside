use actix_web::{HttpMessage, HttpRequest, HttpResponse, Responder, web};

use crate::{
    middlewares::auth_middleware::UserData,
    types::{
        main::AppState,
        models::{
            meet::meet_from_db::MeetFromDb, participant::participant_from_db::ParticipantFromDb,
            user::user_from_db::UserFromDBExistingCheck,
        },
        responses::general_errors::GeneralErrorsToBeReturned,
        shared_trait::validate_trait::ValidateTrait,
    },
};

pub async fn add_participant(
    req: HttpRequest,
    app_state: web::Data<AppState>,
    add_participant_data: web::Json<crate::types::validator::add_participant::AddParticipant>,
) -> impl Responder {
    let validation_errors = add_participant_data.check_validation();
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

    let existing_user =
        sqlx::query_as::<_, UserFromDBExistingCheck>("select * from users where email=$1")
            .bind(&add_participant_data.0.email)
            .fetch_optional(&app_state.db_connection_pool)
            .await;
    if existing_user.is_err() {
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: String::from("Issue talking to the database"),
        });
    }
    if existing_user.as_ref().unwrap().is_none() {
        return HttpResponse::BadRequest().json(GeneralErrorsToBeReturned {
            error: String::from("Could not find the user in the database"),
        });
    }

    let meet_from_db = sqlx::query_as::<_, MeetFromDb>("select * from meets where id=$1")
        .bind(add_participant_data.0.meet_id)
        .fetch_optional(&app_state.db_connection_pool)
        .await;
    if meet_from_db.is_err() || meet_from_db.as_ref().unwrap().is_none() {
        return HttpResponse::BadRequest().json(GeneralErrorsToBeReturned {
            error: String::from("Issue finding meet in the database, check id and try again"),
        });
    }
    let meet = meet_from_db.unwrap().unwrap();
    if meet.host != user_data.user_id {
        return HttpResponse::Forbidden().json(GeneralErrorsToBeReturned {
            error: String::from("You can add participants if you are the host"),
        });
    }
    let new_participant = sqlx::query_as::<_, ParticipantFromDb>(
        "insert into participants(meet_id,user_id) values($1, $2) returning *",
    )
    .bind(add_participant_data.0.meet_id)
    .bind(existing_user.unwrap().unwrap().id)
    .fetch_optional(&app_state.db_connection_pool)
    .await;
    if new_participant.is_err() || new_participant.as_ref().unwrap().is_none() {
        return HttpResponse::BadRequest().json(GeneralErrorsToBeReturned {
            error: String::from("Issue adding participant to the database"),
        });
    }
    return HttpResponse::Created().json(new_participant.unwrap().unwrap());
}
