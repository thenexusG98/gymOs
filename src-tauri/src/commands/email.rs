use crate::database::DbState;
use crate::models::user::{EmailSettings, UpdateEmailSettingsInput};
use lettre::message::header::ContentType;
use lettre::transport::smtp::authentication::Credentials;
use lettre::{Message, SmtpTransport, Transport};
use tauri::State;

#[tauri::command]
pub fn get_email_settings(state: State<DbState>) -> Result<EmailSettings, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    conn.query_row(
        "SELECT id,smtp_host,smtp_port,smtp_user,smtp_password,from_name,from_email,enabled,days_before_reminder FROM email_settings LIMIT 1",
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

#[tauri::command]
pub fn save_email_settings(
    state: State<DbState>,
    input: UpdateEmailSettingsInput,
) -> Result<EmailSettings, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    conn.execute(
        "UPDATE email_settings SET smtp_host=?1,smtp_port=?2,smtp_user=?3,smtp_password=?4,from_name=?5,from_email=?6,enabled=?7,days_before_reminder=?8,updated_at=datetime('now')",
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

    conn.query_row(
        "SELECT id,smtp_host,smtp_port,smtp_user,smtp_password,from_name,from_email,enabled,days_before_reminder FROM email_settings LIMIT 1",
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

#[tauri::command]
pub fn send_test_email(state: State<DbState>, to_email: String) -> Result<String, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    let settings: EmailSettings = conn.query_row(
        "SELECT id,smtp_host,smtp_port,smtp_user,smtp_password,from_name,from_email,enabled,days_before_reminder FROM email_settings LIMIT 1",
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
    .map_err(|e| e.to_string())?;

    drop(conn);

    send_email(
        &settings,
        &to_email,
        "Prueba de correo - GymOS",
        "<h2>¡Correo de prueba!</h2><p>La configuración de correo funciona correctamente en <strong>GymOS</strong>.</p>",
    )
}

#[tauri::command]
pub fn send_payment_reminder(
    state: State<DbState>,
    student_id: i64,
) -> Result<String, String> {
    let conn = state.conn.lock().map_err(|e| e.to_string())?;

    // Get student info and last payment
    let student_info: (String, Option<String>, Option<String>) = conn.query_row(
        "SELECT full_name, email, (SELECT due_date FROM payments WHERE student_id=?1 ORDER BY payment_date DESC LIMIT 1) as due_date FROM students WHERE id=?1",
        rusqlite::params![student_id],
        |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
    ).map_err(|e| e.to_string())?;

    let email = student_info.1.ok_or("El alumno no tiene correo registrado")?;
    let due_date = student_info.2.unwrap_or("N/A".to_string());

    let settings: EmailSettings = conn.query_row(
        "SELECT id,smtp_host,smtp_port,smtp_user,smtp_password,from_name,from_email,enabled,days_before_reminder FROM email_settings LIMIT 1",
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
    ).map_err(|e| e.to_string())?;

    drop(conn);

    let body = format!(
        "<h2>Recordatorio de pago - GymOS</h2>\
         <p>Hola <strong>{}</strong>,</p>\
         <p>Te recordamos que tu membresía vence el <strong>{}</strong>.</p>\
         <p>Por favor realiza tu pago a tiempo para continuar disfrutando nuestros servicios.</p>\
         <br/><p>GymOS - Deportivo de Calistenia</p>",
        student_info.0, due_date
    );

    send_email(&settings, &email, "Recordatorio de pago - GymOS", &body)
}

fn send_email(settings: &EmailSettings, to: &str, subject: &str, html_body: &str) -> Result<String, String> {
    if settings.smtp_host.is_empty() {
        return Err("Configuración SMTP incompleta".to_string());
    }

    let from = format!("{} <{}>", settings.from_name, settings.from_email);

    let email = Message::builder()
        .from(from.parse().map_err(|e: lettre::address::AddressError| e.to_string())?)
        .to(to.parse().map_err(|e: lettre::address::AddressError| e.to_string())?)
        .subject(subject)
        .header(ContentType::TEXT_HTML)
        .body(html_body.to_string())
        .map_err(|e| e.to_string())?;

    let creds = Credentials::new(settings.smtp_user.clone(), settings.smtp_password.clone());

    let mailer = SmtpTransport::starttls_relay(&settings.smtp_host)
        .map_err(|e| e.to_string())?
        .credentials(creds)
        .port(settings.smtp_port as u16)
        .build();

    mailer.send(&email).map_err(|e| e.to_string())?;

    Ok("Correo enviado exitosamente".to_string())
}
