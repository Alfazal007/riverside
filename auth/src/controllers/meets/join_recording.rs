use actix_web::{HttpMessage, HttpRequest, HttpResponse, Responder, web};

use crate::{
    middlewares::auth_middleware::UserData,
    types::{
        main::AppState,
        models::{
            participant::participant_from_db::ParticipantFromDb,
            recording::record_event_db::{EventAction, RecordEventDb, RecordingDb},
        },
        responses::general_errors::GeneralErrorsToBeReturned,
        shared_trait::validate_trait::ValidateTrait,
    },
};

pub async fn join_recording(
    req: HttpRequest,
    app_state: web::Data<AppState>,
    join_recording_data: web::Json<crate::types::validator::join_meeting::JoinMeeting>,
) -> impl Responder {
    let validation_errors = join_recording_data.check_validation();
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
    let user_belonging_to_meet = sqlx::query_as::<_, ParticipantFromDb>(
        "select * from participants where meet_id=$1 and user_id=$2",
    )
    .bind(join_recording_data.0.meet_id)
    .bind(user_data.user_id)
    .fetch_optional(&app_state.db_connection_pool)
    .await;
    if user_belonging_to_meet.is_err() {
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: "Issue talking to the database".to_string(),
        });
    }
    if user_belonging_to_meet.unwrap().is_none() {
        return HttpResponse::NotFound().json(GeneralErrorsToBeReturned {
            error: "You are not part of the meeting".to_string(),
        });
    }

    let recording = sqlx::query_as::<_, RecordingDb>(
        "select * from recordings where meet_id=$1 order by id desc limit 1",
    )
    .bind(join_recording_data.0.meet_id)
    .fetch_optional(&app_state.db_connection_pool)
    .await;
    if recording.is_err() {
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: "Issue talking to the database".to_string(),
        });
    }
    if recording.as_ref().unwrap().is_none() {
        return HttpResponse::NotFound().json(GeneralErrorsToBeReturned {
            error: "Recording not started".to_string(),
        });
    }

    let new_record_join_entry = sqlx::query_as::<_, RecordEventDb>("insert into recordevents(recording_id, action, user_id, meet_id, timestamp) values($1, $2, $3,$4,$5) returning *")
        .bind(recording.unwrap().unwrap().id)
        .bind(EventAction::Join)
        .bind(user_data.user_id)
        .bind(join_recording_data.0.meet_id)
        .bind(join_recording_data.0.join_time)
        .fetch_optional(&app_state.db_connection_pool)
        .await;
    println!("{:?}", new_record_join_entry);
    if new_record_join_entry.is_err() {
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: "Issue writing to the database".to_string(),
        });
    }
    if new_record_join_entry.as_ref().unwrap().is_none() {
        return HttpResponse::BadRequest().json(GeneralErrorsToBeReturned {
            error: "Could not write data to the database".to_string(),
        });
    }
    return HttpResponse::Ok().json({});
}
