use crate::database::DbState;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct DashboardStats {
    pub total_active_students: i64,
    pub students_expiring_soon: i64,
    pub students_overdue: i64,
    pub income_today: f64,
    pub income_month: f64,
    pub expenses_month: f64,
    pub profit_month: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MonthlyIncome {
    pub month: String,
    pub income: f64,
    pub expenses: f64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ExpiringStudent {
    pub id: i64,
    pub full_name: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub due_date: String,
    pub plan_name: String,
    pub days_until_due: i64,
    pub payment_status: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MonthlyReport {
    pub year: i32,
    pub month: i32,
    pub total_income: f64,
    pub total_expenses: f64,
    pub profit: f64,
    pub total_payments: i64,
    pub active_students: i64,
    pub new_students: i64,
}

#[tauri::command]
pub fn get_dashboard_stats(state: State<DbState>) -> Result<DashboardStats, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let total_active: i64 = conn.query_row(
        "SELECT COUNT(*) FROM students WHERE status='active'",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let expiring_soon: i64 = conn.query_row("
        SELECT COUNT(DISTINCT s.id) FROM students s
        JOIN payments p ON p.id = (SELECT id FROM payments WHERE student_id=s.id ORDER BY payment_date DESC LIMIT 1)
        WHERE s.status='active' AND date(p.due_date) BETWEEN date('now') AND date('now', '+3 days')
    ", [], |row| row.get(0)).unwrap_or(0);

    let overdue: i64 = conn.query_row("
        SELECT COUNT(DISTINCT s.id) FROM students s
        JOIN payments p ON p.id = (SELECT id FROM payments WHERE student_id=s.id ORDER BY payment_date DESC LIMIT 1)
        WHERE s.status='active' AND date(p.due_date) < date('now')
    ", [], |row| row.get(0)).unwrap_or(0);

    let income_today: f64 = conn.query_row(
        "SELECT COALESCE(SUM(amount),0) FROM payments WHERE date(payment_date)=date('now')",
        [],
        |row| row.get(0),
    ).unwrap_or(0.0);

    let income_month: f64 = conn.query_row(
        "SELECT COALESCE(SUM(amount),0) FROM payments WHERE strftime('%Y-%m',payment_date)=strftime('%Y-%m','now')",
        [],
        |row| row.get(0),
    ).unwrap_or(0.0);

    let expenses_month: f64 = conn.query_row(
        "SELECT COALESCE(SUM(amount),0) FROM expenses WHERE strftime('%Y-%m',date)=strftime('%Y-%m','now')",
        [],
        |row| row.get(0),
    ).unwrap_or(0.0);

    Ok(DashboardStats {
        total_active_students: total_active,
        students_expiring_soon: expiring_soon,
        students_overdue: overdue,
        income_today,
        income_month,
        expenses_month,
        profit_month: income_month - expenses_month,
    })
}

#[tauri::command]
pub fn get_monthly_income(state: State<DbState>, months: Option<i32>) -> Result<Vec<MonthlyIncome>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let n = months.unwrap_or(12);

    let mut stmt = conn.prepare(&format!("
        WITH RECURSIVE months(m) AS (
            SELECT date('now','start of month','-{} months')
            UNION ALL
            SELECT date(m, '+1 month') FROM months WHERE m < date('now','start of month')
        )
        SELECT
            strftime('%Y-%m', m) as month,
            COALESCE((SELECT SUM(amount) FROM payments WHERE strftime('%Y-%m',payment_date)=strftime('%Y-%m',m)),0) as income,
            COALESCE((SELECT SUM(amount) FROM expenses WHERE strftime('%Y-%m',date)=strftime('%Y-%m',m)),0) as expenses
        FROM months
        ORDER BY month
    ", n - 1)).map_err(|e| e.to_string())?;

    let data = stmt
        .query_map([], |row| {
            Ok(MonthlyIncome {
                month: row.get(0)?,
                income: row.get(1)?,
                expenses: row.get(2)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(data)
}

#[tauri::command]
pub fn get_expiring_students(state: State<DbState>, days: Option<i32>) -> Result<Vec<ExpiringStudent>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let d = days.unwrap_or(7);

    let mut stmt = conn.prepare(&format!("
        SELECT s.id, s.full_name, s.phone, s.email, p.due_date, pl.name,
               CAST(julianday(p.due_date) - julianday('now') AS INTEGER) as days_until_due,
               CASE
                   WHEN date(p.due_date) < date('now') THEN 'overdue'
                   WHEN date(p.due_date) <= date('now', '+3 days') THEN 'expiring'
                   ELSE 'current'
               END as payment_status
        FROM students s
        JOIN payments p ON p.id = (SELECT id FROM payments WHERE student_id=s.id ORDER BY payment_date DESC LIMIT 1)
        JOIN plans pl ON pl.id = p.plan_id
        WHERE s.status='active' AND date(p.due_date) <= date('now', '+{} days')
        ORDER BY p.due_date ASC
    ", d)).map_err(|e| e.to_string())?;

    let students = stmt
        .query_map([], |row| {
            Ok(ExpiringStudent {
                id: row.get(0)?,
                full_name: row.get(1)?,
                phone: row.get(2)?,
                email: row.get(3)?,
                due_date: row.get(4)?,
                plan_name: row.get(5)?,
                days_until_due: row.get(6)?,
                payment_status: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(students)
}

#[tauri::command]
pub fn get_overdue_students(state: State<DbState>) -> Result<Vec<ExpiringStudent>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("
        SELECT s.id, s.full_name, s.phone, s.email, p.due_date, pl.name,
               CAST(julianday(p.due_date) - julianday('now') AS INTEGER) as days_until_due,
               'overdue' as payment_status
        FROM students s
        JOIN payments p ON p.id = (SELECT id FROM payments WHERE student_id=s.id ORDER BY payment_date DESC LIMIT 1)
        JOIN plans pl ON pl.id = p.plan_id
        WHERE s.status='active' AND date(p.due_date) < date('now')
        ORDER BY p.due_date ASC
    ").map_err(|e| e.to_string())?;

    let students = stmt
        .query_map([], |row| {
            Ok(ExpiringStudent {
                id: row.get(0)?,
                full_name: row.get(1)?,
                phone: row.get(2)?,
                email: row.get(3)?,
                due_date: row.get(4)?,
                plan_name: row.get(5)?,
                days_until_due: row.get(6)?,
                payment_status: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(students)
}

#[tauri::command]
pub fn get_monthly_report(
    state: State<DbState>,
    year: i32,
    month: i32,
) -> Result<MonthlyReport, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let month_str = format!("{:04}-{:02}", year, month);

    let total_income: f64 = conn.query_row(
        "SELECT COALESCE(SUM(amount),0) FROM payments WHERE strftime('%Y-%m',payment_date)=?1",
        rusqlite::params![month_str],
        |row| row.get(0),
    ).unwrap_or(0.0);

    let total_expenses: f64 = conn.query_row(
        "SELECT COALESCE(SUM(amount),0) FROM expenses WHERE strftime('%Y-%m',date)=?1",
        rusqlite::params![month_str],
        |row| row.get(0),
    ).unwrap_or(0.0);

    let total_payments: i64 = conn.query_row(
        "SELECT COUNT(*) FROM payments WHERE strftime('%Y-%m',payment_date)=?1",
        rusqlite::params![month_str],
        |row| row.get(0),
    ).unwrap_or(0);

    let active_students: i64 = conn.query_row(
        "SELECT COUNT(*) FROM students WHERE status='active'",
        [],
        |row| row.get(0),
    ).unwrap_or(0);

    let date_from = format!("{:04}-{:02}-01", year, month);
    let date_to = format!("{:04}-{:02}-28", year, month);

    let new_students: i64 = conn.query_row(
        "SELECT COUNT(*) FROM students WHERE enrollment_date BETWEEN ?1 AND ?2",
        rusqlite::params![date_from, date_to],
        |row| row.get(0),
    ).unwrap_or(0);

    Ok(MonthlyReport {
        year,
        month,
        total_income,
        total_expenses,
        profit: total_income - total_expenses,
        total_payments,
        active_students,
        new_students,
    })
}
