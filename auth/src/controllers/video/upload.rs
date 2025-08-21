use crate::types::main::AppState;
use actix_multipart::Multipart;
use actix_web::{HttpRequest, HttpResponse, Responder, web};
use serde::Deserialize;

#[derive(Deserialize)]
pub struct UploadQuery {
    pub meet_id: i64,
}

pub fn upload_chunk(
    req: HttpRequest,
    app_state: web::Data<AppState>,
    query: web::Query<UploadQuery>,
    mut chunk_data: Multipart,
) -> impl Responder {
    return HttpResponse::Ok().json({});
}
