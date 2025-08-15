use actix_web::{
    Error, HttpMessage, HttpResponse,
    body::BoxBody,
    dev::{ServiceRequest, ServiceResponse},
    middleware::Next,
    web::Data,
};
use redis::Commands;

use crate::types::{main::AppState, responses::general_errors::GeneralErrorsToBeReturned};

pub struct UserData {
    pub access_token: String,
    pub user_id: i32,
    pub email: String,
}

pub async fn auth_middleware(
    req: ServiceRequest,
    next: Next<BoxBody>,
) -> Result<ServiceResponse<impl actix_web::body::MessageBody>, Error> {
    if req.cookie("accessToken").is_none() {
        let error_response = HttpResponse::Unauthorized().json(GeneralErrorsToBeReturned {
            error: "Unauthorized: Missing accessToken cookie".to_string(),
        });
        return Ok(req.into_response(error_response.map_into_boxed_body()));
    }
    if req.cookie("userId").is_none() {
        let error_response = HttpResponse::Unauthorized().json(GeneralErrorsToBeReturned {
            error: "Unauthorized: Missing userId cookie".to_string(),
        });
        return Ok(req.into_response(error_response.map_into_boxed_body()));
    }

    let state = match req.app_data::<Data<AppState>>() {
        Some(data) => data,
        None => {
            let error_response =
                HttpResponse::InternalServerError().json(GeneralErrorsToBeReturned {
                    error: "Failed to retrieve application state".to_string(),
                });
            return Ok(req.into_response(error_response.map_into_boxed_body()));
        }
    };

    let token = req.cookie("accessToken").unwrap().value().to_string();
    let user_id = req.cookie("userId").unwrap().value().to_string();

    let mut redis_conection = state.redis_client.get().unwrap();
    let key = format!("auth:{}", user_id);
    let email_key = format!("email:{}", user_id);

    let redis_values_result: Result<Vec<Option<String>>, _> =
        redis_conection.mget(&[key, email_key]);

    if redis_values_result.is_err() {
        let error_response = HttpResponse::BadRequest().json(GeneralErrorsToBeReturned {
            error: "Failed to get redis data".to_string(),
        });
        return Ok(req.into_response(error_response.map_into_boxed_body()));
    }
    let redis_values = redis_values_result.unwrap();

    let access_token = redis_values.get(0).and_then(|v| v.as_ref());
    let email = redis_values.get(1).and_then(|v| v.as_ref());

    if access_token.is_none() || email.is_none() || access_token.unwrap().to_string() != token {
        let error_response = HttpResponse::Forbidden().json(GeneralErrorsToBeReturned {
            error: "Relogin".to_string(),
        });
        return Ok(req.into_response(error_response.map_into_boxed_body()));
    }

    let user_id_int: i32 = user_id.parse().expect("Issue parsing userid");
    req.extensions_mut().insert(UserData {
        user_id: user_id_int,
        email: email.unwrap().to_string(),
        access_token: access_token.unwrap().to_string(),
    });

    next.call(req).await
}
