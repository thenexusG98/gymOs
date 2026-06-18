use rusqlite::Connection;
use std::path::Path;
use std::sync::Mutex;

pub mod migrations;

pub struct DbState {
    pub conn: Mutex<Connection>,
}

impl DbState {
    pub fn new(db_path: &Path) -> Result<Self, rusqlite::Error> {
        let conn = Connection::open(db_path)?;

        // Enable WAL mode and foreign keys
        conn.execute_batch("PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;")?;

        // Run migrations
        crate::database::migrations::run_migrations(&conn)?;

        Ok(Self {
            conn: Mutex::new(conn),
        })
    }
}
