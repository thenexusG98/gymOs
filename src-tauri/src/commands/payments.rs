use crate::database::DbState;
use crate::models::payment::{CreatePaymentInput, Payment};
use tauri::State;
use uuid::Uuid;

fn map_payment(row: &rusqlite::Row) -> rusqlite::Result<Payment> {
    Ok(Payment {
        id: row.get(0)?,
        student_id: row.get(1)?,
        plan_id: row.get(2)?,
        amount: row.get(3)?,
        payment_date: row.get(4)?,
        due_date: row.get(5)?,
        payment_method: row.get(6)?,
        receipt_number: row.get(7)?,
        notes: row.get(8)?,
        created_by: row.get(9)?,
        created_at: row.get(10)?,
        student_name: row.get(11)?,
        plan_name: row.get(12)?,
    })
}

#[tauri::command]
pub fn get_payments(
    state: State<DbState>,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<Payment>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let limit_val = limit.unwrap_or(50);
    let offset_val = offset.unwrap_or(0);

    let mut stmt = conn.prepare("
        SELECT p.id,p.student_id,p.plan_id,p.amount,p.payment_date,p.due_date,
               p.payment_method,p.receipt_number,p.notes,p.created_by,p.created_at,
               s.full_name,pl.name
        FROM payments p
        JOIN students s ON s.id = p.student_id
        JOIN plans pl ON pl.id = p.plan_id
        ORDER BY p.payment_date DESC, p.id DESC
        LIMIT ?1 OFFSET ?2
    ").map_err(|e| e.to_string())?;

    let payments = stmt
        .query_map(rusqlite::params![limit_val, offset_val], map_payment)
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(payments)
}

#[tauri::command]
pub fn get_payment(state: State<DbState>, id: i64) -> Result<Payment, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    conn.query_row("
        SELECT p.id,p.student_id,p.plan_id,p.amount,p.payment_date,p.due_date,
               p.payment_method,p.receipt_number,p.notes,p.created_by,p.created_at,
               s.full_name,pl.name
        FROM payments p
        JOIN students s ON s.id = p.student_id
        JOIN plans pl ON pl.id = p.plan_id
        WHERE p.id=?1
    ",
    rusqlite::params![id],
    map_payment)
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_payment(
    state: State<DbState>,
    input: CreatePaymentInput,
) -> Result<Payment, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    // Get plan duration to compute due_date
    let duration_days: i64 = conn.query_row(
        "SELECT duration_days FROM plans WHERE id=?1",
        rusqlite::params![input.plan_id],
        |row| row.get(0),
    )
    .map_err(|_| "Plan no encontrado".to_string())?;

    let due_date = format!(
        "SELECT date('{}', '+{} days')",
        input.payment_date, duration_days
    );

    let due_date_val: String = conn.query_row(
        &format!("SELECT date(?1, '+{} days')", duration_days),
        rusqlite::params![input.payment_date],
        |row| row.get(0),
    )
    .map_err(|e| e.to_string())?;

    // Generate receipt number
    let short_uuid = Uuid::new_v4().to_string()[..8].to_uppercase();
    let receipt_number = format!("REC-{}", short_uuid);

    let _ = due_date; // suppress warning

    conn.execute(
        "INSERT INTO payments (student_id,plan_id,amount,payment_date,due_date,payment_method,receipt_number,notes,created_by) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9)",
        rusqlite::params![
            input.student_id,
            input.plan_id,
            input.amount,
            input.payment_date,
            due_date_val,
            input.payment_method,
            receipt_number,
            input.notes,
            input.created_by
        ],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    conn.query_row("
        SELECT p.id,p.student_id,p.plan_id,p.amount,p.payment_date,p.due_date,
               p.payment_method,p.receipt_number,p.notes,p.created_by,p.created_at,
               s.full_name,pl.name
        FROM payments p
        JOIN students s ON s.id = p.student_id
        JOIN plans pl ON pl.id = p.plan_id
        WHERE p.id=?1
    ",
    rusqlite::params![id],
    map_payment)
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_student_payments(
    state: State<DbState>,
    student_id: i64,
) -> Result<Vec<Payment>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("
        SELECT p.id,p.student_id,p.plan_id,p.amount,p.payment_date,p.due_date,
               p.payment_method,p.receipt_number,p.notes,p.created_by,p.created_at,
               s.full_name,pl.name
        FROM payments p
        JOIN students s ON s.id = p.student_id
        JOIN plans pl ON pl.id = p.plan_id
        WHERE p.student_id=?1
        ORDER BY p.payment_date DESC
    ").map_err(|e| e.to_string())?;

    let payments = stmt
        .query_map(rusqlite::params![student_id], map_payment)
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(payments)
}

#[tauri::command]
pub fn get_payments_by_date(
    state: State<DbState>,
    date_from: String,
    date_to: String,
) -> Result<Vec<Payment>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("
        SELECT p.id,p.student_id,p.plan_id,p.amount,p.payment_date,p.due_date,
               p.payment_method,p.receipt_number,p.notes,p.created_by,p.created_at,
               s.full_name,pl.name
        FROM payments p
        JOIN students s ON s.id = p.student_id
        JOIN plans pl ON pl.id = p.plan_id
        WHERE p.payment_date BETWEEN ?1 AND ?2
        ORDER BY p.payment_date DESC
    ").map_err(|e| e.to_string())?;

    let payments = stmt
        .query_map(rusqlite::params![date_from, date_to], map_payment)
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(payments)
}
