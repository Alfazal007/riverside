use crate::{
    helpers::generate_presigned_url::generate_presigned_url,
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
use actix_web::{HttpMessage, HttpRequest, HttpResponse, Responder, web};
use chrono::Utc;
use serde::Serialize;

#[derive(Serialize)]
struct ReturnResultPresignedUrl {
    timestamp: u64,
    signature: String,
    public_id: String,
}

pub async fn get_signature(
    req: HttpRequest,
    app_state: web::Data<AppState>,
    next_video_data: web::Json<crate::types::validator::add_video_data::AddVideo>,
) -> impl Responder {
    let validation_errors = next_video_data.check_validation();
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
    let participant = sqlx::query_as::<_, ParticipantFromDb>(
        "select * from participants where meet_id=$1 and user_id=$2",
    )
    .bind(next_video_data.0.meet_id)
    .bind(user_data.user_id)
    .fetch_optional(&app_state.db_connection_pool)
    .await;

    if participant.is_err() {
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: "Issue talking to the database".to_string(),
        });
    }
    if participant.unwrap().is_none() {
        return HttpResponse::NotFound().json(GeneralErrorsToBeReturned {
            error: "Could not find the meet".to_string(),
        });
    }

    let recording = sqlx::query_as::<_, RecordingDb>(
        "select * from recordings where meet_id=$1 order by id desc limit 1",
    )
    .bind(next_video_data.0.meet_id)
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

    let record_event = sqlx::query_as::<_, RecordEventDb>("select * from recordevents where action=$1 and user_id=$2 and meet_id=$3 and recording_id=$4 order by id desc limit 1")
        .bind(EventAction::Join)
        .bind(user_data.user_id)
        .bind(next_video_data.0.meet_id)
        .bind(recording.as_ref().unwrap().as_ref().unwrap().id)
        .fetch_optional(&app_state.db_connection_pool)
        .await;
    if record_event.is_err() {
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: "Issue talking to the database".to_string(),
        });
    }
    if record_event.as_ref().unwrap().is_none() {
        return HttpResponse::NotFound().json(GeneralErrorsToBeReturned {
            error: "User not joined".to_string(),
        });
    }

    let timestamp_now = Utc::now().timestamp_millis();
    let public_id = format!(
        "riverside/{}/{}/{}/{}/{}",
        next_video_data.0.meet_id,
        recording.unwrap().unwrap().id,
        user_data.user_id,
        record_event.unwrap().unwrap().id,
        timestamp_now
    );
    let (signature, timestamp) = generate_presigned_url(&app_state.cloudinary_secret, &public_id);
    return HttpResponse::Ok().json(ReturnResultPresignedUrl {
        timestamp: timestamp,
        signature: signature,
        public_id,
    });
}
