use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Plan {
    pub id: i64,
    pub name: String,
    pub price: f64,
    pub duration_days: i64,
    pub description: Option<String>,
    pub is_active: bool,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePlanInput {
    pub name: String,
    pub price: f64,
    pub duration_days: i64,
    pub description: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdatePlanInput {
    pub id: i64,
    pub name: String,
    pub price: f64,
    pub duration_days: i64,
    pub description: Option<String>,
    pub is_active: bool,
}
