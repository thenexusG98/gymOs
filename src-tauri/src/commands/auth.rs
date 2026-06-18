use crate::database::DbState;
use crate::models::user::{CreateUserInput, LoginInput, UpdateUserInput, User};
use tauri::State;

#[tauri::command]
pub fn login(state: State<DbState>, input: LoginInput) -> Result<User, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let result = conn.query_row(
        "SELECT id, username, password_hash, role, full_name, is_active, created_at, updated_at FROM users WHERE username = ?1 AND is_active = 1",
        rusqlite::params![input.username],
        |row| {
            Ok((
                row.get::<_, i64>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, String>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, String>(4)?,
                row.get::<_, bool>(5)?,
                row.get::<_, String>(6)?,
                row.get::<_, String>(7)?,
            ))
        },
    );

    match result {
        Ok((id, username, hash, role, full_name, is_active, created_at, updated_at)) => {
            let valid = bcrypt::verify(&input.password, &hash)
                .map_err(|e| e.to_string())?;

            if valid {
                Ok(User {
                    id,
                    username,
                    role,
                    full_name,
                    is_active,
                    created_at,
                    updated_at,
                })
            } else {
                Err("Contraseña incorrecta".to_string())
            }
        }
        Err(_) => Err("Usuario no encontrado o inactivo".to_string()),
    }
}

#[tauri::command]
pub fn get_current_user(state: State<DbState>, user_id: i64) -> Result<User, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT id, username, role, full_name, is_active, created_at, updated_at FROM users WHERE id = ?1",
        rusqlite::params![user_id],
        |row| {
            Ok(User {
                id: row.get(0)?,
                username: row.get(1)?,
                role: row.get(2)?,
                full_name: row.get(3)?,
                is_active: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_users(state: State<DbState>) -> Result<Vec<User>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, username, role, full_name, is_active, created_at, updated_at FROM users ORDER BY full_name")
        .map_err(|e| e.to_string())?;

    let users = stmt
        .query_map([], |row| {
            Ok(User {
                id: row.get(0)?,
                username: row.get(1)?,
                role: row.get(2)?,
                full_name: row.get(3)?,
                is_active: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(users)
}

#[tauri::command]
pub fn create_user(state: State<DbState>, input: CreateUserInput) -> Result<User, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let hash = bcrypt::hash(&input.password, bcrypt::DEFAULT_COST)
        .map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT INTO users (username, password_hash, role, full_name) VALUES (?1, ?2, ?3, ?4)",
        rusqlite::params![input.username, hash, input.role, input.full_name],
    )
    .map_err(|e| {
        if e.to_string().contains("UNIQUE") {
            "El nombre de usuario ya existe".to_string()
        } else {
            e.to_string()
        }
    })?;

    let id = conn.last_insert_rowid();

    conn.query_row(
        "SELECT id, username, role, full_name, is_active, created_at, updated_at FROM users WHERE id = ?1",
        rusqlite::params![id],
        |row| {
            Ok(User {
                id: row.get(0)?,
                username: row.get(1)?,
                role: row.get(2)?,
                full_name: row.get(3)?,
                is_active: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

#[tauri::command]
pub fn update_user(state: State<DbState>, input: UpdateUserInput) -> Result<User, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    if let Some(password) = &input.password {
        let hash = bcrypt::hash(password, bcrypt::DEFAULT_COST)
            .map_err(|e| e.to_string())?;
        conn.execute(
            "UPDATE users SET full_name=?1, role=?2, is_active=?3, password_hash=?4, updated_at=datetime('now') WHERE id=?5",
            rusqlite::params![input.full_name, input.role, input.is_active, hash, input.id],
        )
        .map_err(|e| e.to_string())?;
    } else {
        conn.execute(
            "UPDATE users SET full_name=?1, role=?2, is_active=?3, updated_at=datetime('now') WHERE id=?4",
            rusqlite::params![input.full_name, input.role, input.is_active, input.id],
        )
        .map_err(|e| e.to_string())?;
    }

    conn.query_row(
        "SELECT id, username, role, full_name, is_active, created_at, updated_at FROM users WHERE id = ?1",
        rusqlite::params![input.id],
        |row| {
            Ok(User {
                id: row.get(0)?,
                username: row.get(1)?,
                role: row.get(2)?,
                full_name: row.get(3)?,
                is_active: row.get(4)?,
                created_at: row.get(5)?,
                updated_at: row.get(6)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}
