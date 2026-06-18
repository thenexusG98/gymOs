use crate::database::DbState;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tauri::State;

#[derive(Debug, Serialize, Deserialize)]
pub struct BackupInfo {
    pub filename: String,
    pub path: String,
    pub size_bytes: u64,
    pub created_at: String,
}

#[tauri::command]
pub fn create_backup(state: State<DbState>, backup_dir: Option<String>) -> Result<BackupInfo, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let backup_path = if let Some(dir) = backup_dir {
        PathBuf::from(dir)
    } else {
        let home = std::env::var("HOME").map(PathBuf::from).unwrap_or_else(|_| PathBuf::from("."));
        home.join("GymOS_Backups")
    };

    std::fs::create_dir_all(&backup_path).map_err(|e| e.to_string())?;

    let now = chrono::Local::now();
    let filename = format!("gymos_backup_{}.db", now.format("%Y%m%d_%H%M%S"));
    let dest = backup_path.join(&filename);

    // Use SQLite backup API
    conn.execute_batch(&format!(
        "VACUUM INTO '{}'",
        dest.to_string_lossy()
    ))
    .map_err(|e| e.to_string())?;

    let size = std::fs::metadata(&dest)
        .map(|m| m.len())
        .unwrap_or(0);

    Ok(BackupInfo {
        filename: filename.clone(),
        path: dest.to_string_lossy().to_string(),
        size_bytes: size,
        created_at: now.to_rfc3339(),
    })
}

#[tauri::command]
pub fn list_backups(backup_dir: Option<String>) -> Result<Vec<BackupInfo>, String> {
    let backup_path = if let Some(dir) = backup_dir {
        PathBuf::from(dir)
    } else {
        let home = std::env::var("HOME").map(PathBuf::from).unwrap_or_else(|_| PathBuf::from("."));
        home.join("GymOS_Backups")
    };

    if !backup_path.exists() {
        return Ok(vec![]);
    }

    let mut backups: Vec<BackupInfo> = std::fs::read_dir(&backup_path)
        .map_err(|e| e.to_string())?
        .filter_map(|entry| entry.ok())
        .filter(|e| {
            e.path()
                .extension()
                .map(|ext| ext == "db")
                .unwrap_or(false)
        })
        .filter_map(|entry| {
            let path = entry.path();
            let filename = path.file_name()?.to_string_lossy().to_string();
            let meta = std::fs::metadata(&path).ok()?;
            let modified = meta.modified().ok()?;
            let dt: chrono::DateTime<chrono::Local> = modified.into();

            Some(BackupInfo {
                filename,
                path: path.to_string_lossy().to_string(),
                size_bytes: meta.len(),
                created_at: dt.to_rfc3339(),
            })
        })
        .collect();

    backups.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(backups)
}

#[tauri::command]
pub fn restore_backup(_state: State<DbState>, backup_path: String) -> Result<String, String> {
    // Validate the backup exists
    let path = PathBuf::from(&backup_path);
    if !path.exists() {
        return Err("El archivo de respaldo no existe".to_string());
    }

    Ok(format!(
        "Para restaurar desde '{}', cierre la aplicación y reemplace el archivo de base de datos manualmente.",
        backup_path
    ))
}
