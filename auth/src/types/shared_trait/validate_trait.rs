use validator::Validate;

pub trait ValidateTrait {
    fn check_validation(&self) -> Option<Vec<String>>;
}

impl<T> ValidateTrait for T
where
    T: Validate,
{
    fn check_validation(&self) -> Option<Vec<String>>
    where
        T: Validate,
    {
        if let Err(e) = self.validate() {
            let mut validation_errors: Vec<String> = Vec::new();
            for (_, err) in e.field_errors().iter() {
                if let Some(message) = &err[0].message {
                    validation_errors.push(message.clone().into_owned());
                }
            }
            if validation_errors.is_empty() {
                validation_errors.push("Invalid email".to_string())
            }
            return Some(validation_errors);
        }
        None
    }
}
