use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Expense {
    pub id: i64,
    pub date: String,
    pub concept: String,
    pub category: String,
    pub amount: f64,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct CreateExpenseInput {
    pub date: String,
    pub concept: String,
    pub category: String,
    pub amount: f64,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UpdateExpenseInput {
    pub id: i64,
    pub date: String,
    pub concept: String,
    pub category: String,
    pub amount: f64,
    pub notes: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExpenseByCategory {
    pub category: String,
    pub total: f64,
}
