CREATE TABLE IF NOT EXISTS employees (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    employee_number VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    organization_id UUID NOT NULL,
    department_id UUID NOT NULL,
    manager_id UUID,
    designation VARCHAR(150),
    employment_type VARCHAR(30) NOT NULL DEFAULT 'full_time',
    joining_date DATE NOT NULL,
    leaving_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    phone VARCHAR(30),
    alternate_phone VARCHAR(30),
    work_email VARCHAR(320),
    date_of_birth DATE,
    gender VARCHAR(30),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT employees_user_fk
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT employees_organization_fk
        FOREIGN KEY (organization_id)
        REFERENCES organizations(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT employees_department_fk
        FOREIGN KEY (department_id)
        REFERENCES departments(id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT employees_manager_fk
        FOREIGN KEY (manager_id)
        REFERENCES employees(id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,

    CONSTRAINT employees_employment_type_check
        CHECK (employment_type IN (
            'full_time',
            'part_time',
            'contract',
            'intern',
            'consultant'
        )),

    CONSTRAINT employees_status_check
        CHECK (status IN (
            'active',
            'inactive',
            'on_leave',
            'terminated'
        )),

    CONSTRAINT employees_leaving_date_check
        CHECK (leaving_date IS NULL OR leaving_date >= joining_date),

    CONSTRAINT employees_id_not_null CHECK (id IS NOT NULL),
    CONSTRAINT employees_user_id_not_null CHECK (user_id IS NOT NULL),
    CONSTRAINT employees_employee_number_not_null CHECK (employee_number IS NOT NULL),
    CONSTRAINT employees_first_name_not_null CHECK (first_name IS NOT NULL),
    CONSTRAINT employees_last_name_not_null CHECK (last_name IS NOT NULL),
    CONSTRAINT employees_display_name_not_null CHECK (display_name IS NOT NULL),
    CONSTRAINT employees_organization_id_not_null CHECK (organization_id IS NOT NULL),
    CONSTRAINT employees_department_id_not_null CHECK (department_id IS NOT NULL),
    CONSTRAINT employees_joining_date_not_null CHECK (joining_date IS NOT NULL),
    CONSTRAINT employees_status_not_null CHECK (status IS NOT NULL),
    CONSTRAINT employees_created_at_not_null CHECK (created_at IS NOT NULL),
    CONSTRAINT employees_updated_at_not_null CHECK (updated_at IS NOT NULL)
);

CREATE UNIQUE INDEX employees_user_unique_idx
    ON employees (user_id);

CREATE UNIQUE INDEX employees_number_unique_idx
    ON employees (LOWER(employee_number));

CREATE INDEX employees_organization_idx
    ON employees (organization_id);

CREATE INDEX employees_department_idx
    ON employees (department_id);

CREATE INDEX employees_manager_idx
    ON employees (manager_id)
    WHERE manager_id IS NOT NULL;

CREATE INDEX employees_status_idx
    ON employees (status);

CREATE INDEX employees_joining_date_idx
    ON employees (joining_date);

CREATE INDEX employees_display_name_idx
    ON employees (LOWER(display_name));

CREATE OR REPLACE FUNCTION set_employees_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS employees_set_updated_at ON employees;

CREATE TRIGGER employees_set_updated_at
BEFORE UPDATE ON employees
FOR EACH ROW
EXECUTE FUNCTION set_employees_updated_at();
