use crate::database::DbState;
use serde::{Deserialize, Serialize};
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct AttendanceRecord {
    pub id: i64,
    pub student_id: i64,
    pub student_name: String,
    pub date: String,
    pub time: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AttendanceRanking {
    pub student_id: i64,
    pub full_name: String,
    pub total_sessions: i64,
    pub rank: i64,
}

#[tauri::command]
pub fn register_attendance(
    state: State<DbState>,
    student_id: i64,
) -> Result<AttendanceRecord, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    // Check if already attended today
    let today_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM attendance WHERE student_id=?1 AND date=date('now')",
        rusqlite::params![student_id],
        |row| row.get(0),
    ).unwrap_or(0);

    if today_count > 0 {
        return Err("El alumno ya registró asistencia hoy".to_string());
    }

    conn.execute(
        "INSERT INTO attendance (student_id, date, time) VALUES (?1, date('now'), time('now','localtime'))",
        rusqlite::params![student_id],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    conn.query_row(
        "SELECT a.id, a.student_id, s.full_name, a.date, a.time, a.created_at FROM attendance a JOIN students s ON s.id=a.student_id WHERE a.id=?1",
        rusqlite::params![id],
        |row| {
            Ok(AttendanceRecord {
                id: row.get(0)?,
                student_id: row.get(1)?,
                student_name: row.get(2)?,
                date: row.get(3)?,
                time: row.get(4)?,
                created_at: row.get(5)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_attendance_by_student(
    state: State<DbState>,
    student_id: i64,
    limit: Option<i64>,
) -> Result<Vec<AttendanceRecord>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("
        SELECT a.id, a.student_id, s.full_name, a.date, a.time, a.created_at
        FROM attendance a
        JOIN students s ON s.id=a.student_id
        WHERE a.student_id=?1
        ORDER BY a.date DESC, a.time DESC
        LIMIT ?2
    ").map_err(|e| e.to_string())?;

    let records = stmt
        .query_map(rusqlite::params![student_id, limit.unwrap_or(30)], |row| {
            Ok(AttendanceRecord {
                id: row.get(0)?,
                student_id: row.get(1)?,
                student_name: row.get(2)?,
                date: row.get(3)?,
                time: row.get(4)?,
                created_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(records)
}

#[tauri::command]
pub fn get_attendance_by_date(
    state: State<DbState>,
    date: String,
) -> Result<Vec<AttendanceRecord>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("
        SELECT a.id, a.student_id, s.full_name, a.date, a.time, a.created_at
        FROM attendance a
        JOIN students s ON s.id=a.student_id
        WHERE a.date=?1
        ORDER BY a.time ASC
    ").map_err(|e| e.to_string())?;

    let records = stmt
        .query_map(rusqlite::params![date], |row| {
            Ok(AttendanceRecord {
                id: row.get(0)?,
                student_id: row.get(1)?,
                student_name: row.get(2)?,
                date: row.get(3)?,
                time: row.get(4)?,
                created_at: row.get(5)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(records)
}

#[tauri::command]
pub fn get_monthly_attendance_ranking(
    state: State<DbState>,
    year: Option<i32>,
    month: Option<i32>,
) -> Result<Vec<AttendanceRanking>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let now = chrono::Local::now();
    let y = year.unwrap_or(now.format("%Y").to_string().parse().unwrap_or(2024));
    let m = month.unwrap_or(now.format("%m").to_string().parse().unwrap_or(1));

    let month_str = format!("{:04}-{:02}", y, m);

    let mut stmt = conn.prepare("
        SELECT s.id, s.full_name, COUNT(a.id) as total_sessions,
               ROW_NUMBER() OVER (ORDER BY COUNT(a.id) DESC) as rank
        FROM students s
        LEFT JOIN attendance a ON a.student_id=s.id AND strftime('%Y-%m', a.date)=?1
        WHERE s.status='active'
        GROUP BY s.id, s.full_name
        ORDER BY total_sessions DESC
        LIMIT 20
    ").map_err(|e| e.to_string())?;

    let rankings = stmt
        .query_map(rusqlite::params![month_str], |row| {
            Ok(AttendanceRanking {
                student_id: row.get(0)?,
                full_name: row.get(1)?,
                total_sessions: row.get(2)?,
                rank: row.get(3)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(rankings)
}
