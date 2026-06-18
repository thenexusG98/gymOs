use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Student {
    pub id: i64,
    pub full_name: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub enrollment_date: String,
    pub birth_date: Option<String>,
    pub photo_path: Option<String>,
    pub observations: Option<String>,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct StudentWithPaymentStatus {
    pub id: i64,
    pub full_name: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub enrollment_date: String,
    pub birth_date: Option<String>,
    pub status: String,
    pub last_payment_date: Option<String>,
    pub last_due_date: Option<String>,
    pub last_plan_name: Option<String>,
    pub payment_status: String, // "current", "expiring", "overdue", "no_payment"
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateStudentInput {
    pub full_name: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub enrollment_date: String,
    pub birth_date: Option<String>,
    pub photo_path: Option<String>,
    pub observations: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateStudentInput {
    pub id: i64,
    pub full_name: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub birth_date: Option<String>,
    pub photo_path: Option<String>,
    pub observations: Option<String>,
    pub status: String,
}
