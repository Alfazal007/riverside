#[derive(serde::Serialize, serde::Deserialize)]
pub struct ValidationErrorsToBeReturned {
    pub errors: Vec<String>,
}
