use crate::database::DbState;
use crate::models::student::{
    CreateStudentInput, Student, StudentWithPaymentStatus, UpdateStudentInput,
};
use tauri::State;

fn map_student(row: &rusqlite::Row) -> rusqlite::Result<Student> {
    Ok(Student {
        id: row.get(0)?,
        full_name: row.get(1)?,
        phone: row.get(2)?,
        email: row.get(3)?,
        enrollment_date: row.get(4)?,
        birth_date: row.get(5)?,
        photo_path: row.get(6)?,
        observations: row.get(7)?,
        status: row.get(8)?,
        created_at: row.get(9)?,
        updated_at: row.get(10)?,
    })
}

#[tauri::command]
pub fn get_students(
    state: State<DbState>,
    query: Option<String>,
    status_filter: Option<String>,
) -> Result<Vec<Student>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let (sql, pattern) = match (&query, &status_filter) {
        (Some(q), Some(s)) => (
            "SELECT id,full_name,phone,email,enrollment_date,birth_date,photo_path,observations,status,created_at,updated_at FROM students WHERE status=?2 AND (full_name LIKE ?1 OR phone LIKE ?1 OR email LIKE ?1) ORDER BY full_name".to_string(),
            Some((format!("%{}%", q), s.clone())),
        ),
        (Some(q), None) => (
            "SELECT id,full_name,phone,email,enrollment_date,birth_date,photo_path,observations,status,created_at,updated_at FROM students WHERE full_name LIKE ?1 OR phone LIKE ?1 OR email LIKE ?1 ORDER BY full_name".to_string(),
            Some((format!("%{}%", q), String::new())),
        ),
        (None, Some(s)) => (
            "SELECT id,full_name,phone,email,enrollment_date,birth_date,photo_path,observations,status,created_at,updated_at FROM students WHERE status=?1 ORDER BY full_name".to_string(),
            Some((s.clone(), String::new())),
        ),
        (None, None) => (
            "SELECT id,full_name,phone,email,enrollment_date,birth_date,photo_path,observations,status,created_at,updated_at FROM students ORDER BY full_name".to_string(),
            None,
        ),
    };

    let mut stmt = conn.prepare(&sql).map_err(|e| e.to_string())?;

    let students: Vec<Student> = match (&query, &status_filter) {
        (Some(_), Some(_)) => {
            let p = pattern.unwrap();
            stmt.query_map(rusqlite::params![p.0, p.1], map_student)
                .map_err(|e| e.to_string())?
                .filter_map(|r| r.ok())
                .collect()
        }
        (Some(_), None) | (None, Some(_)) => {
            let p = pattern.unwrap();
            stmt.query_map(rusqlite::params![p.0], map_student)
                .map_err(|e| e.to_string())?
                .filter_map(|r| r.ok())
                .collect()
        }
        (None, None) => stmt
            .query_map([], map_student)
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .collect(),
    };

    Ok(students)
}

#[tauri::command]
pub fn get_student(state: State<DbState>, id: i64) -> Result<Student, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT id,full_name,phone,email,enrollment_date,birth_date,photo_path,observations,status,created_at,updated_at FROM students WHERE id=?1",
        rusqlite::params![id],
        map_student,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_student(
    state: State<DbState>,
    input: CreateStudentInput,
) -> Result<Student, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO students (full_name,phone,email,enrollment_date,birth_date,photo_path,observations) VALUES (?1,?2,?3,?4,?5,?6,?7)",
        rusqlite::params![
            input.full_name,
            input.phone,
            input.email,
            input.enrollment_date,
            input.birth_date,
            input.photo_path,
            input.observations
        ],
    )
    .map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();

    conn.query_row(
        "SELECT id,full_name,phone,email,enrollment_date,birth_date,photo_path,observations,status,created_at,updated_at FROM students WHERE id=?1",
        rusqlite::params![id],
        map_student,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_student(
    state: State<DbState>,
    input: UpdateStudentInput,
) -> Result<Student, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE students SET full_name=?1,phone=?2,email=?3,birth_date=?4,photo_path=?5,observations=?6,status=?7,updated_at=datetime('now') WHERE id=?8",
        rusqlite::params![
            input.full_name,
            input.phone,
            input.email,
            input.birth_date,
            input.photo_path,
            input.observations,
            input.status,
            input.id
        ],
    )
    .map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT id,full_name,phone,email,enrollment_date,birth_date,photo_path,observations,status,created_at,updated_at FROM students WHERE id=?1",
        rusqlite::params![input.id],
        map_student,
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_student(state: State<DbState>, id: i64) -> Result<(), String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE students SET status='inactive', updated_at=datetime('now') WHERE id=?1",
        rusqlite::params![id],
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn get_students_with_status(
    state: State<DbState>,
) -> Result<Vec<StudentWithPaymentStatus>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare("
        SELECT
            s.id,
            s.full_name,
            s.phone,
            s.email,
            s.enrollment_date,
            s.birth_date,
            s.status,
            p.payment_date as last_payment_date,
            p.due_date as last_due_date,
            pl.name as last_plan_name,
            CASE
                WHEN p.due_date IS NULL THEN 'no_payment'
                WHEN date(p.due_date) < date('now') THEN 'overdue'
                WHEN date(p.due_date) <= date('now', '+3 days') THEN 'expiring'
                ELSE 'current'
            END as payment_status
        FROM students s
        LEFT JOIN payments p ON p.id = (
            SELECT id FROM payments WHERE student_id = s.id ORDER BY payment_date DESC LIMIT 1
        )
        LEFT JOIN plans pl ON pl.id = p.plan_id
        WHERE s.status = 'active'
        ORDER BY s.full_name
    ").map_err(|e| e.to_string())?;

    let students = stmt
        .query_map([], |row| {
            Ok(StudentWithPaymentStatus {
                id: row.get(0)?,
                full_name: row.get(1)?,
                phone: row.get(2)?,
                email: row.get(3)?,
                enrollment_date: row.get(4)?,
                birth_date: row.get(5)?,
                status: row.get(6)?,
                last_payment_date: row.get(7)?,
                last_due_date: row.get(8)?,
                last_plan_name: row.get(9)?,
                payment_status: row.get(10)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(students)
}
