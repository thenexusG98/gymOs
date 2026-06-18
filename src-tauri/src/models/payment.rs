use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Payment {
    pub id: i64,
    pub student_id: i64,
    pub plan_id: i64,
    pub amount: f64,
    pub payment_date: String,
    pub due_date: String,
    pub payment_method: String,
    pub receipt_number: String,
    pub notes: Option<String>,
    pub created_by: Option<i64>,
    pub created_at: String,
    // Joined fields
    pub student_name: Option<String>,
    pub plan_name: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreatePaymentInput {
    pub student_id: i64,
    pub plan_id: i64,
    pub amount: f64,
    pub payment_date: String,
    pub payment_method: String,
    pub notes: Option<String>,
    pub created_by: Option<i64>,
}
