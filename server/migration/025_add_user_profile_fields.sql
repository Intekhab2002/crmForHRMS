/*
 * Migration: 027_add_user_profile_fields
 *
 * Adds basic user profile information required by the CRM.
 */

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS mobile_phone VARCHAR(30),
    ADD COLUMN IF NOT EXISTS employee_code VARCHAR(100),
    ADD COLUMN IF NOT EXISTS designation VARCHAR(150);

CREATE INDEX IF NOT EXISTS users_employee_code_idx
    ON users (employee_code);

CREATE INDEX IF NOT EXISTS users_mobile_phone_idx
    ON users (mobile_phone);