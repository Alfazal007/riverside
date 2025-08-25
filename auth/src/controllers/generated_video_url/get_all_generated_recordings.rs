use actix_web::{HttpMessage, HttpRequest, HttpResponse, Responder, web};
use serde::Serialize;
use sqlx::prelude::FromRow;

use crate::{
    middlewares::auth_middleware::UserData,
    types::{
        main::AppState, models::meet::meet_from_db::MeetFromDb,
        responses::general_errors::GeneralErrorsToBeReturned,
    },
};

#[derive(Serialize, FromRow)]
struct ReturnRecordings {
    recording: i32,
    ready: bool,
}

pub async fn get_all_generated_recordings(
    req: HttpRequest,
    app_state: web::Data<AppState>,
    path: web::Path<i32>,
) -> impl Responder {
    if req.extensions().get::<UserData>().is_none() {
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: "Issue talking to the database".to_string(),
        });
    }
    let extensions = req.extensions();
    let user_data = extensions.get::<UserData>().unwrap();
    let meeting = sqlx::query_as::<_, MeetFromDb>("select * from meets where host=$1 and id=$2")
        .bind(user_data.user_id)
        .bind(path.into_inner())
        .fetch_optional(&app_state.db_connection_pool)
        .await;
    if meeting.is_err() || meeting.as_ref().unwrap().is_none() {
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: "Issue talking to the database".to_string(),
        });
    }
    let meeting = meeting.unwrap().unwrap();

    let recordings = sqlx::query_as::<_, ReturnRecordings>(
        r#"
        SELECT
            r.id AS recording,
            (cr.recording_id IS NOT NULL) AS ready
        FROM recordings r
        LEFT JOIN completed_recordings cr 
            ON r.id = cr.recording_id
        WHERE r.meet_id = $1
        "#,
    )
    .bind(&meeting.id)
    .fetch_all(&app_state.db_connection_pool)
    .await;
    if recordings.is_err() {
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: "Issue talking to the database".to_string(),
        });
    };
    let recordings = recordings.unwrap();
    return HttpResponse::Ok().json(recordings);
}
