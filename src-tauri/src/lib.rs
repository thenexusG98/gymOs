use tauri::Manager;

pub mod commands;
pub mod database;
pub mod models;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("No se pudo obtener el directorio de datos");
            std::fs::create_dir_all(&app_data_dir)
                .expect("No se pudo crear el directorio de datos");

            let db_path = app_data_dir.join("gymos.db");
            let db_state = database::DbState::new(&db_path)
                .expect("No se pudo inicializar la base de datos");

            app.manage(db_state);

            // Spawn background scheduler — checks every 6 hours while app is running
            let app_handle_sched = app.handle().clone();
            std::thread::spawn(move || {
                // Wait 2 minutes after startup before first check
                std::thread::sleep(std::time::Duration::from_secs(120));
                loop {
                    commands::email::run_email_scheduler(&app_handle_sched);
                    std::thread::sleep(std::time::Duration::from_secs(6 * 3600));
                }
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // Auth
            commands::auth::login,
            commands::auth::get_current_user,
            commands::auth::create_user,
            commands::auth::update_user,
            commands::auth::get_users,
            // Students
            commands::students::get_students,
            commands::students::get_student,
            commands::students::create_student,
            commands::students::update_student,
            commands::students::delete_student,
            commands::students::get_students_with_status,
            // Plans
            commands::plans::get_plans,
            commands::plans::get_plan,
            commands::plans::create_plan,
            commands::plans::update_plan,
            commands::plans::delete_plan,
            // Payments
            commands::payments::get_payments,
            commands::payments::get_payment,
            commands::payments::create_payment,
            commands::payments::get_student_payments,
            commands::payments::get_payments_by_date,
            // Expenses
            commands::expenses::get_expenses,
            commands::expenses::create_expense,
            commands::expenses::update_expense,
            commands::expenses::delete_expense,
            commands::expenses::get_expenses_by_month,
            // Reports
            commands::reports::get_dashboard_stats,
            commands::reports::get_monthly_income,
            commands::reports::get_expiring_students,
            commands::reports::get_overdue_students,
            commands::reports::get_monthly_report,
            // Email
            commands::email::get_email_settings,
            commands::email::save_email_settings,
            commands::email::send_test_email,
            commands::email::send_payment_reminder,
            commands::email::manual_reminder_check,
            commands::email::get_reminder_logs,
            // Backup
            commands::backup::create_backup,
            commands::backup::restore_backup,
            commands::backup::list_backups,
            // Attendance
            commands::attendance::register_attendance,
            commands::attendance::get_attendance_by_student,
            commands::attendance::get_attendance_by_date,
            commands::attendance::get_monthly_attendance_ranking,
        ])
        .run(tauri::generate_context!())
        .expect("Error al ejecutar la aplicación GymOS");
}
