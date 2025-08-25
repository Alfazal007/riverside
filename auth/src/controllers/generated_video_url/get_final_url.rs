use actix_web::{HttpMessage, HttpRequest, HttpResponse, Responder, web};
use serde::Serialize;

use crate::{
    helpers::cloudinary_final_url::cloudinary_url_final_video,
    middlewares::auth_middleware::UserData,
    types::{
        main::AppState,
        models::{
            completed_recording::complete_recording_db::CompletedRecording,
            meet::meet_from_db::MeetFromDb,
        },
        responses::general_errors::GeneralErrorsToBeReturned,
        shared_trait::validate_trait::ValidateTrait,
    },
};

#[derive(Serialize)]
struct ReturnUrl {
    url: String,
}

pub async fn get_final_generated_video_url(
    req: HttpRequest,
    app_state: web::Data<AppState>,
    generated_video_data: web::Json<crate::types::validator::generated_video::GeneratedVideo>,
) -> impl Responder {
    let validation_errors = generated_video_data.check_validation();
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

    let meet_from_db = sqlx::query_as::<_, MeetFromDb>("select * from meets where id=$1")
        .bind(generated_video_data.0.meet_id)
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
    let recording_from_db = sqlx::query_as::<_, CompletedRecording>(
        "select * from completed_recordings where recording_id=$1",
    )
    .bind(generated_video_data.0.recording_id)
    .fetch_optional(&app_state.db_connection_pool)
    .await;
    if recording_from_db.is_err() || recording_from_db.as_ref().unwrap().is_none() {
        return HttpResponse::BadRequest().json(GeneralErrorsToBeReturned {
            error: String::from("Video is still being processed"),
        });
    }
    let recording = recording_from_db.unwrap().unwrap();
    let public_id = format!("riverside/complete/{}/{}", meet.id, recording.recording_id);
    let url = cloudinary_url_final_video("itachivrnft", &public_id);
    return HttpResponse::Ok().json(ReturnUrl { url });
}
