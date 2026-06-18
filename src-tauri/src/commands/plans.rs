use crate::database::DbState;
use crate::models::plan::{CreatePlanInput, Plan, UpdatePlanInput};
use tauri::State;

fn map_plan(row: &rusqlite::Row) -> rusqlite::Result<Plan> {
    Ok(Plan {
        id: row.get(0)?,
        name: row.get(1)?,
        price: row.get(2)?,
        duration_days: row.get(3)?,
        description: row.get(4)?,
        is_active: row.get(5)?,
        created_at: row.get(6)?,
        updated_at: row.get(7)?,
    })
}

#[tauri::command]
pub fn get_plans(state: State<DbState>, include_inactive: Option<bool>) -> Result<Vec<Plan>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let sql = if include_inactive.unwrap_or(false) {
        "SELECT id,name,price,duration_days,description,is_active,created_at,updated_at FROM plans ORDER BY name"
    } else {
        "SELECT id,name,price,duration_days,description,is_active,created_at,updated_at FROM plans WHERE is_active=1 ORDER BY name"
    };

    let mut stmt = conn.prepare(sql).map_err(|e| e.to_string())?;
    let plans = stmt
        .query_map([], map_plan)
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(plans)
}

#[tauri::command]
pub fn get_plan(state: State<DbState>, id: i64) -> Result<Plan, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT id,name,price,duration_days,description,is_active,created_at,updated_at FROM plans WHERE id=?1",
        rusqlite::params![id],
        map_plan,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_plan(state: State<DbState>, input: CreatePlanInput) -> Result<Plan, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO plans (name,price,duration_days,description) VALUES (?1,?2,?3,?4)",
        rusqlite::params![input.name, input.price, input.duration_days, input.description],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    conn.query_row(
        "SELECT id,name,price,duration_days,description,is_active,created_at,updated_at FROM plans WHERE id=?1",
        rusqlite::params![id],
        map_plan,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_plan(state: State<DbState>, input: UpdatePlanInput) -> Result<Plan, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE plans SET name=?1,price=?2,duration_days=?3,description=?4,is_active=?5,updated_at=datetime('now') WHERE id=?6",
        rusqlite::params![
            input.name,
            input.price,
            input.duration_days,
            input.description,
            input.is_active,
            input.id
        ],
    )
    .map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT id,name,price,duration_days,description,is_active,created_at,updated_at FROM plans WHERE id=?1",
        rusqlite::params![input.id],
        map_plan,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_plan(state: State<DbState>, id: i64) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    // Soft delete
    conn.execute(
        "UPDATE plans SET is_active=0, updated_at=datetime('now') WHERE id=?1",
        rusqlite::params![id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}
