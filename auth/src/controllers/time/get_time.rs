use actix_web::{HttpResponse, Responder};
use chrono::Utc;

pub async fn get_time() -> impl Responder {
    let timestamp_millis = Utc::now().timestamp_millis();
    return HttpResponse::Ok().json(timestamp_millis);
}
