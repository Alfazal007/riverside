use actix_web::{HttpMessage, HttpRequest, HttpResponse, Responder, web};

use crate::{
    middlewares::auth_middleware::UserData,
    types::{
        main::AppState, models::participant::participant_from_db::ParticipantFromDb,
        responses::general_errors::GeneralErrorsToBeReturned,
    },
};

pub async fn get_meets(req: HttpRequest, app_state: web::Data<AppState>) -> impl Responder {
    if req.extensions().get::<UserData>().is_none() {
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: "Issue talking to the database".to_string(),
        });
    }
    let extensions = req.extensions();
    let user_data = extensions.get::<UserData>().unwrap();
    let meets =
        sqlx::query_as::<_, ParticipantFromDb>("select  * from participants where user_id=$1")
            .bind(user_data.user_id)
            .fetch_all(&app_state.db_connection_pool)
            .await;
    if meets.is_err() {
        return HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
            error: "Issue talking to the database".to_string(),
        });
    }
    let meets = meets.unwrap();
    return HttpResponse::Ok().json(meets);
}
