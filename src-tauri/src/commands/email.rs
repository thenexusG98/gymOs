use crate::database::DbState;
use crate::models::user::{EmailSettings, UpdateEmailSettingsInput};
use lettre::message::header::ContentType;
use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, SmtpTransport, Transport};
use serde::{Deserialize, Serialize};
use tauri::State;

// ─── Types ───────────────────────────────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ReminderLog {
    pub id: i64,
    pub student_id: i64,
    pub student_name: String,
    pub reminder_type: String,
    pub sent_date: String,
    pub student_email: Option<String>,
    pub admin_notified: bool,
    pub created_at: String,
}

struct StudentToRemind {
    id: i64,
    name: String,
    email: String,
    due_date: String,
    reminder_type: String,
}

// ─── Internal helpers ────────────────────────────────────────────────────────

fn get_settings_from_conn(conn: &rusqlite::Connection) -> Result<EmailSettings, String> {
    conn.query_row(
        "SELECT id,smtp_host,smtp_port,smtp_user,smtp_password,from_name,from_email,enabled,days_before_reminder \
         FROM email_settings LIMIT 1",
        [],
        |row| {
            Ok(EmailSettings {
                id: row.get(0)?,
                smtp_host: row.get(1)?,
                smtp_port: row.get(2)?,
                smtp_user: row.get(3)?,
                smtp_password: row.get(4)?,
                from_name: row.get(5)?,
                from_email: row.get(6)?,
                enabled: row.get(7)?,
                days_before_reminder: row.get(8)?,
            })
        },
    )
    .map_err(|e| e.to_string())
}

fn send_email_internal(
    settings: &EmailSettings,
    to: &str,
    subject: &str,
    html_body: &str,
) -> Result<(), String> {
    if settings.smtp_host.is_empty() || settings.smtp_user.is_empty() {
        return Err("Configuración SMTP incompleta".to_string());
    }

    let from = format!("{} <{}>", settings.from_name, settings.from_email);
    let creds = Credentials::new(
        settings.smtp_user.clone(),
        settings.smtp_password.clone(),
    );

    let email = Message::builder()
        .from(from.parse().map_err(|e: lettre::address::AddressError| e.to_string())?)
        .to(to.parse().map_err(|e: lettre::address::AddressError| e.to_string())?)
        .subject(subject)
        .header(ContentType::TEXT_HTML)
        .body(html_body.to_string())
        .map_err(|e| e.to_string())?;

    let mailer = if settings.smtp_port == 465 {
        SmtpTransport::relay(&settings.smtp_host)
            .map_err(|e| e.to_string())?
            .credentials(creds)
            .build()
    } else {
        SmtpTransport::starttls_relay(&settings.smtp_host)
            .map_err(|e| e.to_string())?
            .credentials(creds)
            .port(settings.smtp_port as u16)
            .build()
    };

    mailer.send(&email).map_err(|e| e.to_string())?;
    Ok(())
}

fn student_reminder_html(name: &str, due_date: &str, is_overdue: bool) -> String {
    let status_text = if is_overdue {
        format!("venció el <strong style=\"color:#ef4444\">{}</strong>", due_date)
    } else {
        format!("vence el <strong style=\"color:#f97316\">{}</strong>", due_date)
    };
    format!(
        r#"<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:24px;border-radius:12px;">
          <div style="background:#f97316;padding:20px 24px;border-radius:8px;margin-bottom:24px;">
            <h1 style="color:white;margin:0;font-size:22px;">GymOS</h1>
            <p style="color:rgba(255,255,255,0.85);margin:4px 0 0;font-size:13px;">Deportivo de Calistenia</p>
          </div>
          <h2 style="color:#1a1a1a;margin-top:0;">Recordatorio de pago</h2>
          <p style="color:#333;">Hola <strong>{}</strong>,</p>
          <p style="color:#333;">Te informamos que tu membresía {}.</p>
          <p style="color:#333;">Por favor acércate a recepción o realiza tu pago para continuar disfrutando nuestros servicios.</p>
          <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;"/>
          <p style="color:#999;font-size:11px;">GymOS · Mensaje automático, por favor no respondas este correo.</p>
        </div>"#,
        name, status_text
    )
}

fn admin_copy_html(
    student_name: &str,
    student_email: &str,
    due_date: &str,
    is_overdue: bool,
) -> String {
    let (status_label, status_color) = if is_overdue {
        ("Vencido", "#ef4444")
    } else {
        ("Próximo a vencer", "#f59e0b")
    };
    format!(
        r#"<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:24px;border-radius:12px;">
          <div style="background:#1a1a1a;padding:20px 24px;border-radius:8px;margin-bottom:24px;">
            <h1 style="color:#f97316;margin:0;font-size:22px;">GymOS</h1>
            <p style="color:#9ca3af;margin:4px 0 0;font-size:13px;">Notificación interna</p>
          </div>
          <h2 style="color:#1a1a1a;margin-top:0;">Recordatorio enviado a alumno</h2>
          <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;margin-bottom:16px;">
            <tr style="background:#f5f5f5;">
              <td style="padding:10px 16px;font-weight:bold;color:#555;width:140px;">Alumno</td>
              <td style="padding:10px 16px;color:#1a1a1a;">{}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;font-weight:bold;color:#555;">Correo</td>
              <td style="padding:10px 16px;color:#1a1a1a;">{}</td>
            </tr>
            <tr style="background:#f5f5f5;">
              <td style="padding:10px 16px;font-weight:bold;color:#555;">Vencimiento</td>
              <td style="padding:10px 16px;color:#1a1a1a;">{}</td>
            </tr>
            <tr>
              <td style="padding:10px 16px;font-weight:bold;color:#555;">Estado</td>
              <td style="padding:10px 16px;"><strong style="color:{};">{}</strong></td>
            </tr>
          </table>
          <hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0;"/>
          <p style="color:#999;font-size:11px;">GymOS · Notificación automática del scheduler</p>
        </div>"#,
        student_name, student_email, due_date, status_color, status_label
    )
}

/// Send reminder to student + admin copy, log to reminder_log. Returns true if student email was sent.
fn send_and_log_reminder(
    settings: &EmailSettings,
    student: &StudentToRemind,
    conn: &rusqlite::Connection,
) -> bool {
    let is_overdue = student.reminder_type == "overdue";

    let student_ok = send_email_internal(
        settings,
        &student.email,
        "Recordatorio de pago - GymOS",
        &student_reminder_html(&student.name, &student.due_date, is_overdue),
    )
    .is_ok();

    let admin_ok = if !settings.from_email.is_empty() && settings.from_email != student.email {
        send_email_internal(
            settings,
            &settings.from_email,
            &format!("[GymOS] Recordatorio enviado — {}", student.name),
            &admin_copy_html(&student.name, &student.email, &student.due_date, is_overdue),
        )
        .is_ok()
    } else {
        false
    };

    if student_ok {
        let _ = conn.execute(
            "INSERT INTO reminder_log \
             (student_id,student_name,reminder_type,sent_date,student_email,admin_notified) \
             VALUES (?1,?2,?3,date('now'),?4,?5)",
            rusqlite::params![
                student.id,
                student.name,
                student.reminder_type,
                student.email,
                admin_ok
            ],
        );
    }

    student_ok
}

// ─── Background scheduler (called from OS thread in lib.rs) ─────────────────

pub fn run_email_scheduler(app_handle: &tauri::AppHandle) {
    use tauri::Manager;

    let db_state = match app_handle.try_state::<DbState>() {
        Some(s) => s,
        None => return,
    };

    // Step 1: Collect settings + eligible students (hold lock briefly)
    let (settings, students): (EmailSettings, Vec<StudentToRemind>) = {
        let conn = match db_state.conn.lock() {
            Ok(c) => c,
            Err(_) => return,
        };

        let settings = match get_settings_from_conn(&conn) {
            Ok(s) if s.enabled && !s.smtp_host.is_empty() => s,
            _ => return,
        };

        let days = settings.days_before_reminder;
        let query = format!(
            "SELECT s.id, s.full_name, s.email, p.due_date, \
                    CASE WHEN date(p.due_date) < date('now') THEN 'overdue' ELSE 'expiring' END \
             FROM students s \
             JOIN payments p ON p.id = ( \
                 SELECT id FROM payments WHERE student_id=s.id ORDER BY payment_date DESC LIMIT 1 \
             ) \
             WHERE s.status='active' \
               AND s.email IS NOT NULL AND s.email != '' \
               AND date(p.due_date) <= date('now', '+{} days') \
               AND NOT EXISTS ( \
                   SELECT 1 FROM reminder_log rl \
                   WHERE rl.student_id = s.id AND rl.sent_date = date('now') \
               )",
            days
        );

        let mut stmt = match conn.prepare(&query) {
            Ok(s) => s,
            Err(_) => return,
        };

        let students: Vec<StudentToRemind> = stmt
            .query_map([], |row| {
                Ok(StudentToRemind {
                    id: row.get(0)?,
                    name: row.get(1)?,
                    email: row.get(2)?,
                    due_date: row.get(3)?,
                    reminder_type: row.get(4)?,
                })
            })
            .map(|rows| rows.filter_map(|r| r.ok()).collect::<Vec<_>>())
            .unwrap_or_default();

        (settings, students)
        // conn lock released here
    };

    // Step 2: Send emails + log (re-acquire lock per student to log promptly)
    for student in &students {
        if let Ok(conn) = db_state.conn.lock() {
            send_and_log_reminder(&settings, student, &conn);
        }
    }
}

#[tauri::command]
pub fn get_email_settings(state: State<DbState>) -> Result<EmailSettings, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    get_settings_from_conn(&conn)
}

#[tauri::command]
pub fn save_email_settings(
    state: State<DbState>,
    input: UpdateEmailSettingsInput,
) -> Result<EmailSettings, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE email_settings SET smtp_host=?1,smtp_port=?2,smtp_user=?3,smtp_password=?4,\
         from_name=?5,from_email=?6,enabled=?7,days_before_reminder=?8,updated_at=datetime('now')",
        rusqlite::params![
            input.smtp_host,
            input.smtp_port,
            input.smtp_user,
            input.smtp_password,
            input.from_name,
            input.from_email,
            input.enabled,
            input.days_before_reminder
        ],
    )
    .map_err(|e| e.to_string())?;

    get_settings_from_conn(&conn)
}

#[tauri::command]
pub fn send_test_email(state: State<DbState>, to_email: String) -> Result<String, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;
    let settings = get_settings_from_conn(&conn)?;
    drop(conn);

    send_email_internal(
        &settings,
        &to_email,
        "Prueba de correo — GymOS",
        r#"<div style="font-family:Arial,sans-serif;padding:24px;">
           <h2 style="color:#f97316;">¡Correo de prueba!</h2>
           <p>La configuración SMTP funciona correctamente en <strong>GymOS</strong>.</p>
           </div>"#,
    )?;

    Ok("Correo de prueba enviado correctamente".to_string())
}

#[tauri::command]
pub fn send_payment_reminder(
    state: State<DbState>,
    student_id: i64,
) -> Result<String, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let (name, email, due_date): (String, Option<String>, Option<String>) = conn
        .query_row(
            "SELECT s.full_name, s.email, \
                    (SELECT due_date FROM payments WHERE student_id=?1 ORDER BY payment_date DESC LIMIT 1) \
             FROM students s WHERE s.id=?1",
            rusqlite::params![student_id],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .map_err(|e| e.to_string())?;

    let email = email.ok_or("El alumno no tiene correo registrado")?;
    let due_date = due_date.unwrap_or_else(|| "N/A".to_string());

    let settings = get_settings_from_conn(&conn)?;

    let is_overdue: bool = conn
        .query_row(
            "SELECT CASE WHEN date(?1) < date('now') THEN 1 ELSE 0 END",
            rusqlite::params![due_date],
            |row| row.get::<_, bool>(0),
        )
        .unwrap_or(false);

    let student = StudentToRemind {
        id: student_id,
        name: name.clone(),
        email,
        due_date,
        reminder_type: if is_overdue { "overdue".into() } else { "expiring".into() },
    };

    if send_and_log_reminder(&settings, &student, &conn) {
        Ok(format!(
            "Recordatorio enviado a {} y copia al correo del administrador",
            name
        ))
    } else {
        Err("No se pudo enviar el correo. Revisa la configuración SMTP.".to_string())
    }
}

#[tauri::command]
pub fn manual_reminder_check(state: State<DbState>) -> Result<Vec<ReminderLog>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let settings = match get_settings_from_conn(&conn) {
        Ok(s) if s.enabled && !s.smtp_host.is_empty() => s,
        Ok(_) => {
            return Err(
                "Los recordatorios están desactivados o el SMTP no está configurado".to_string(),
            )
        }
        Err(e) => return Err(e),
    };

    let days = settings.days_before_reminder;
    let query = format!(
        "SELECT s.id, s.full_name, s.email, p.due_date, \
                CASE WHEN date(p.due_date) < date('now') THEN 'overdue' ELSE 'expiring' END \
         FROM students s \
         JOIN payments p ON p.id = ( \
             SELECT id FROM payments WHERE student_id=s.id ORDER BY payment_date DESC LIMIT 1 \
         ) \
         WHERE s.status='active' \
           AND s.email IS NOT NULL AND s.email != '' \
           AND date(p.due_date) <= date('now', '+{} days') \
           AND NOT EXISTS ( \
               SELECT 1 FROM reminder_log rl \
               WHERE rl.student_id = s.id AND rl.sent_date = date('now') \
           )",
        days
    );

    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;

    let students: Vec<StudentToRemind> = stmt
        .query_map([], |row| {
            Ok(StudentToRemind {
                id: row.get(0)?,
                name: row.get(1)?,
                email: row.get(2)?,
                due_date: row.get(3)?,
                reminder_type: row.get(4)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    let mut sent_logs: Vec<ReminderLog> = Vec::new();
    for student in &students {
        let admin_expected = !settings.from_email.is_empty() && settings.from_email != student.email;
        if send_and_log_reminder(&settings, student, &conn) {
            sent_logs.push(ReminderLog {
                id: conn.last_insert_rowid(),
                student_id: student.id,
                student_name: student.name.clone(),
                reminder_type: student.reminder_type.clone(),
                sent_date: chrono::Local::now().format("%Y-%m-%d").to_string(),
                student_email: Some(student.email.clone()),
                admin_notified: admin_expected,
                created_at: chrono::Local::now().to_rfc3339(),
            });
        }
    }

    Ok(sent_logs)
}

#[tauri::command]
pub fn get_reminder_logs(
    state: State<DbState>,
    limit: Option<i64>,
) -> Result<Vec<ReminderLog>, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let mut stmt = conn
        .prepare(
            "SELECT id,student_id,student_name,reminder_type,sent_date,student_email,admin_notified,created_at \
             FROM reminder_log ORDER BY created_at DESC LIMIT ?1",
        )
        .map_err(|e| e.to_string())?;

    let logs = stmt
        .query_map(rusqlite::params![limit.unwrap_or(30)], |row| {
            Ok(ReminderLog {
                id: row.get(0)?,
                student_id: row.get(1)?,
                student_name: row.get(2)?,
                reminder_type: row.get(3)?,
                sent_date: row.get(4)?,
                student_email: row.get(5)?,
                admin_notified: row.get(6)?,
                created_at: row.get(7)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(logs)
}
