use crate::database::DbState;
use crate::models::expense::{CreateExpenseInput, Expense, UpdateExpenseInput};
use tauri::State;

fn map_expense(row: &rusqlite::Row) -> rusqlite::Result<Expense> {
    Ok(Expense {
        id: row.get(0)?,
        date: row.get(1)?,
        concept: row.get(2)?,
        category: row.get(3)?,
        amount: row.get(4)?,
        notes: row.get(5)?,
        created_at: row.get(6)?,
        updated_at: row.get(7)?,
    })
}

#[tauri::command]
pub fn get_expenses(
    state: State<DbState>,
    limit: Option<i64>,
    offset: Option<i64>,
) -> Result<Vec<Expense>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("
        SELECT id,date,concept,category,amount,notes,created_at,updated_at
        FROM expenses
        ORDER BY date DESC, id DESC
        LIMIT ?1 OFFSET ?2
    ").map_err(|e| e.to_string())?;

    let expenses = stmt
        .query_map(
            rusqlite::params![limit.unwrap_or(50), offset.unwrap_or(0)],
            map_expense,
        )
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(expenses)
}

#[tauri::command]
pub fn get_expenses_by_month(
    state: State<DbState>,
    year: i32,
    month: i32,
) -> Result<Vec<Expense>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let date_from = format!("{:04}-{:02}-01", year, month);
    let date_to = format!(
        "{:04}-{:02}-{:02}",
        year,
        month,
        days_in_month(year, month)
    );

    let mut stmt = conn.prepare("
        SELECT id,date,concept,category,amount,notes,created_at,updated_at
        FROM expenses
        WHERE date BETWEEN ?1 AND ?2
        ORDER BY date DESC
    ").map_err(|e| e.to_string())?;

    let expenses = stmt
        .query_map(rusqlite::params![date_from, date_to], map_expense)
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(expenses)
}

#[tauri::command]
pub fn create_expense(state: State<DbState>, input: CreateExpenseInput) -> Result<Expense, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO expenses (date,concept,category,amount,notes) VALUES (?1,?2,?3,?4,?5)",
        rusqlite::params![
            input.date,
            input.concept,
            input.category,
            input.amount,
            input.notes
        ],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    conn.query_row(
        "SELECT id,date,concept,category,amount,notes,created_at,updated_at FROM expenses WHERE id=?1",
        rusqlite::params![id],
        map_expense,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_expense(state: State<DbState>, input: UpdateExpenseInput) -> Result<Expense, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE expenses SET date=?1,concept=?2,category=?3,amount=?4,notes=?5,updated_at=datetime('now') WHERE id=?6",
        rusqlite::params![
            input.date,
            input.concept,
            input.category,
            input.amount,
            input.notes,
            input.id
        ],
    )
    .map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT id,date,concept,category,amount,notes,created_at,updated_at FROM expenses WHERE id=?1",
        rusqlite::params![input.id],
        map_expense,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_expense(state: State<DbState>, id: i64) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    conn.execute("DELETE FROM expenses WHERE id=?1", rusqlite::params![id])
        .map_err(|e| e.to_string())?;

    Ok(())
}

fn days_in_month(year: i32, month: i32) -> i32 {
    match month {
        1 | 3 | 5 | 7 | 8 | 10 | 12 => 31,
        4 | 6 | 9 | 11 => 30,
        2 => {
            if year % 4 == 0 && (year % 100 != 0 || year % 400 == 0) {
                29
            } else {
                28
            }
        }
        _ => 30,
    }
}
