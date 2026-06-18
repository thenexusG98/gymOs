use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: i64,
    pub username: String,
    pub role: String,
    pub full_name: String,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginInput {
    pub username: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateUserInput {
    pub username: String,
    pub password: String,
    pub role: String,
    pub full_name: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateUserInput {
    pub id: i64,
    pub full_name: String,
    pub role: String,
    pub is_active: bool,
    pub password: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EmailSettings {
    pub id: i64,
    pub smtp_host: String,
    pub smtp_port: i64,
    pub smtp_user: String,
    pub smtp_password: String,
    pub from_name: String,
    pub from_email: String,
    pub enabled: bool,
    pub days_before_reminder: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateEmailSettingsInput {
    pub smtp_host: String,
    pub smtp_port: i64,
    pub smtp_user: String,
    pub smtp_password: String,
    pub from_name: String,
    pub from_email: String,
    pub enabled: bool,
    pub days_before_reminder: i64,
}
