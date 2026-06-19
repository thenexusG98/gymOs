use rusqlite::Connection;

pub fn run_migrations(conn: &Connection) -> Result<(), rusqlite::Error> {
    conn.execute_batch("
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('admin', 'reception')),
            full_name TEXT NOT NULL,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            enrollment_date TEXT NOT NULL,
            birth_date TEXT,
            photo_path TEXT,
            observations TEXT,
            status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'suspended', 'inactive')),
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS plans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            price REAL NOT NULL,
            duration_days INTEGER NOT NULL,
            description TEXT,
            is_active INTEGER NOT NULL DEFAULT 1,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            plan_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            payment_date TEXT NOT NULL,
            due_date TEXT NOT NULL,
            payment_method TEXT NOT NULL CHECK(payment_method IN ('cash', 'transfer', 'card')),
            receipt_number TEXT NOT NULL UNIQUE,
            notes TEXT,
            created_by INTEGER,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (student_id) REFERENCES students(id),
            FOREIGN KEY (plan_id) REFERENCES plans(id),
            FOREIGN KEY (created_by) REFERENCES users(id)
        );

        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            concept TEXT NOT NULL,
            category TEXT NOT NULL CHECK(category IN ('rent','electricity','water','maintenance','cleaning','equipment','other')),
            amount REAL NOT NULL,
            notes TEXT,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS email_settings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            smtp_host TEXT NOT NULL DEFAULT '',
            smtp_port INTEGER NOT NULL DEFAULT 587,
            smtp_user TEXT NOT NULL DEFAULT '',
            smtp_password TEXT NOT NULL DEFAULT '',
            from_name TEXT NOT NULL DEFAULT 'GymOS',
            from_email TEXT NOT NULL DEFAULT '',
            enabled INTEGER NOT NULL DEFAULT 0,
            days_before_reminder INTEGER NOT NULL DEFAULT 3,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS attendance (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (student_id) REFERENCES students(id)
        );

        CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_id);
        CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
        CREATE INDEX IF NOT EXISTS idx_payments_due ON payments(due_date);
        CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
        CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
        CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

        CREATE TABLE IF NOT EXISTS reminder_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_id INTEGER NOT NULL,
            student_name TEXT NOT NULL,
            reminder_type TEXT NOT NULL CHECK(reminder_type IN ('expiring','overdue')),
            sent_date TEXT NOT NULL,
            student_email TEXT,
            admin_notified INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            FOREIGN KEY (student_id) REFERENCES students(id)
        );

        CREATE INDEX IF NOT EXISTS idx_reminder_log_date ON reminder_log(sent_date);
        CREATE INDEX IF NOT EXISTS idx_reminder_log_student ON reminder_log(student_id);
    ")?;

    // Insert default admin user if none exists
    let count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM users WHERE role = 'admin'",
        [],
        |row| row.get(0),
    )?;

    if count == 0 {
        let hash = bcrypt::hash("admin123", bcrypt::DEFAULT_COST)
            .expect("Error al generar hash de contraseña");
        conn.execute(
            "INSERT INTO users (username, password_hash, role, full_name) VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params!["admin", hash, "admin", "Administrador"],
        )?;
    }

    // Insert default email settings row if none exists
    let email_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM email_settings",
        [],
        |row| row.get(0),
    )?;

    if email_count == 0 {
        conn.execute(
            "INSERT INTO email_settings (smtp_host, smtp_port, smtp_user, smtp_password, from_name, from_email) VALUES ('', 587, '', '', 'GymOS', '')",
            [],
        )?;
    }

    // Insert default plans if none exist
    let plans_count: i64 = conn.query_row(
        "SELECT COUNT(*) FROM plans",
        [],
        |row| row.get(0),
    )?;

    if plans_count == 0 {
        conn.execute_batch("
            INSERT INTO plans (name, price, duration_days, description) VALUES ('2 sesiones por semana', 400.00, 30, 'Acceso a 2 sesiones semanales de calistenia');
            INSERT INTO plans (name, price, duration_days, description) VALUES ('3 sesiones por semana', 550.00, 30, 'Acceso a 3 sesiones semanales de calistenia');
            INSERT INTO plans (name, price, duration_days, description) VALUES ('Mensualidad libre', 700.00, 30, 'Acceso ilimitado al deportivo durante el mes');
        ")?;
    }

    Ok(())
}
