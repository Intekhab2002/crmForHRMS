import { randomUUID } from "node:crypto";

import { getQueryExecutor } from "../../database/queryExecutor.js";

const EMPLOYEE_FIELDS = `
    e.id,
    e.user_id,
    u.username,
    u.email AS user_email,
    e.employee_number,
    e.first_name,
    e.middle_name,
    e.last_name,
    e.display_name,
    e.organization_id,
    o.code AS organization_code,
    o.name AS organization_name,
    e.department_id,
    d.code AS department_code,
    d.name AS department_name,
    e.manager_id,
    m.display_name AS manager_name,
    e.designation,
    e.employment_type,
    e.joining_date,
    e.leaving_date,
    e.status,
    e.phone,
    e.alternate_phone,
    e.work_email,
    e.date_of_birth,
    e.gender,
    e.address_line1,
    e.address_line2,
    e.city,
    e.state,
    e.postal_code,
    e.country,
    e.created_at,
    e.updated_at
`;

const RETURNING_FIELDS = `
    id,
    user_id,
    employee_number,
    first_name,
    middle_name,
    last_name,
    display_name,
    organization_id,
    department_id,
    manager_id,
    designation,
    employment_type,
    joining_date,
    leaving_date,
    status,
    phone,
    alternate_phone,
    work_email,
    date_of_birth,
    gender,
    address_line1,
    address_line2,
    city,
    state,
    postal_code,
    country,
    created_at,
    updated_at
`;

const FIND_EMPLOYEES = `
    SELECT ${EMPLOYEE_FIELDS}
    FROM employees e
    INNER JOIN users u ON u.id = e.user_id
    INNER JOIN organizations o ON o.id = e.organization_id
    INNER JOIN departments d ON d.id = e.department_id
    LEFT JOIN employees m ON m.id = e.manager_id
    WHERE
        ($1::UUID IS NULL OR e.organization_id = $1::UUID)
        AND ($2::UUID IS NULL OR e.department_id = $2::UUID)
        AND ($3::UUID IS NULL OR e.manager_id = $3::UUID)
        AND ($4::VARCHAR IS NULL OR e.status = $4::VARCHAR)
        AND ($5::VARCHAR IS NULL OR e.employment_type = $5::VARCHAR)
        AND (
            $6::VARCHAR IS NULL
            OR e.employee_number ILIKE '%' || $6::VARCHAR || '%'
            OR e.display_name ILIKE '%' || $6::VARCHAR || '%'
            OR e.first_name ILIKE '%' || $6::VARCHAR || '%'
            OR e.last_name ILIKE '%' || $6::VARCHAR || '%'
            OR e.designation ILIKE '%' || $6::VARCHAR || '%'
            OR u.username ILIKE '%' || $6::VARCHAR || '%'
            OR u.email ILIKE '%' || $6::VARCHAR || '%'
        )
    ORDER BY e.display_name ASC
    LIMIT $7::INTEGER
    OFFSET $8::INTEGER;
`;

const COUNT_EMPLOYEES = `
    SELECT COUNT(*)::INTEGER AS total
    FROM employees e
    INNER JOIN users u ON u.id = e.user_id
    WHERE
        ($1::UUID IS NULL OR e.organization_id = $1::UUID)
        AND ($2::UUID IS NULL OR e.department_id = $2::UUID)
        AND ($3::UUID IS NULL OR e.manager_id = $3::UUID)
        AND ($4::VARCHAR IS NULL OR e.status = $4::VARCHAR)
        AND ($5::VARCHAR IS NULL OR e.employment_type = $5::VARCHAR)
        AND (
            $6::VARCHAR IS NULL
            OR e.employee_number ILIKE '%' || $6::VARCHAR || '%'
            OR e.display_name ILIKE '%' || $6::VARCHAR || '%'
            OR e.first_name ILIKE '%' || $6::VARCHAR || '%'
            OR e.last_name ILIKE '%' || $6::VARCHAR || '%'
            OR e.designation ILIKE '%' || $6::VARCHAR || '%'
            OR u.username ILIKE '%' || $6::VARCHAR || '%'
            OR u.email ILIKE '%' || $6::VARCHAR || '%'
        );
`;

const FIND_EMPLOYEE_BY_ID = `
    SELECT ${EMPLOYEE_FIELDS}
    FROM employees e
    INNER JOIN users u ON u.id = e.user_id
    INNER JOIN organizations o ON o.id = e.organization_id
    INNER JOIN departments d ON d.id = e.department_id
    LEFT JOIN employees m ON m.id = e.manager_id
    WHERE e.id = $1::UUID
    LIMIT 1;
`;

const FIND_BY_USER_ID = `
    SELECT id, user_id, organization_id, department_id, status
    FROM employees
    WHERE user_id = $1::UUID
    LIMIT 1;
`;

const FIND_BY_NUMBER = `
    SELECT id, employee_number, status
    FROM employees
    WHERE LOWER(employee_number) = LOWER($1::VARCHAR)
    LIMIT 1;
`;

const FIND_USER = `
    SELECT id, username, email, status
    FROM users
    WHERE id = $1::UUID
    LIMIT 1;
`;

const FIND_ORGANIZATION = `
    SELECT id, status
    FROM organizations
    WHERE id = $1::UUID
    LIMIT 1;
`;

const FIND_DEPARTMENT = `
    SELECT id, organization_id, status
    FROM departments
    WHERE id = $1::UUID
    LIMIT 1;
`;

const FIND_MANAGER = `
    SELECT id, organization_id, status
    FROM employees
    WHERE id = $1::UUID
    LIMIT 1;
`;

const CREATE_EMPLOYEE = `
    INSERT INTO employees (
        id,
        user_id,
        employee_number,
        first_name,
        middle_name,
        last_name,
        display_name,
        organization_id,
        department_id,
        manager_id,
        designation,
        employment_type,
        joining_date,
        leaving_date,
        status,
        phone,
        alternate_phone,
        work_email,
        date_of_birth,
        gender,
        address_line1,
        address_line2,
        city,
        state,
        postal_code,
        country
    )
    VALUES (
        $1::UUID, $2::UUID, $3::VARCHAR, $4::VARCHAR, $5::VARCHAR,
        $6::VARCHAR, $7::VARCHAR, $8::UUID, $9::UUID, $10::UUID,
        $11::VARCHAR, $12::VARCHAR, $13::DATE, $14::DATE, $15::VARCHAR,
        $16::VARCHAR, $17::VARCHAR, $18::VARCHAR, $19::DATE, $20::VARCHAR,
        $21::VARCHAR, $22::VARCHAR, $23::VARCHAR, $24::VARCHAR,
        $25::VARCHAR, $26::VARCHAR
    )
    RETURNING ${RETURNING_FIELDS};
`;

const UPDATE_EMPLOYEE = `
    UPDATE employees
    SET
        employee_number = COALESCE($2::VARCHAR, employee_number),
        first_name = COALESCE($3::VARCHAR, first_name),
        middle_name = CASE WHEN $4::BOOLEAN THEN $5::VARCHAR ELSE middle_name END,
        last_name = COALESCE($6::VARCHAR, last_name),
        display_name = COALESCE($7::VARCHAR, display_name),
        organization_id = COALESCE($8::UUID, organization_id),
        department_id = COALESCE($9::UUID, department_id),
        manager_id = CASE WHEN $10::BOOLEAN THEN $11::UUID ELSE manager_id END,
        designation = CASE WHEN $12::BOOLEAN THEN $13::VARCHAR ELSE designation END,
        employment_type = COALESCE($14::VARCHAR, employment_type),
        joining_date = COALESCE($15::DATE, joining_date),
        leaving_date = CASE WHEN $16::BOOLEAN THEN $17::DATE ELSE leaving_date END,
        status = COALESCE($18::VARCHAR, status),
        phone = CASE WHEN $19::BOOLEAN THEN $20::VARCHAR ELSE phone END,
        alternate_phone = CASE WHEN $21::BOOLEAN THEN $22::VARCHAR ELSE alternate_phone END,
        work_email = CASE WHEN $23::BOOLEAN THEN $24::VARCHAR ELSE work_email END,
        date_of_birth = CASE WHEN $25::BOOLEAN THEN $26::DATE ELSE date_of_birth END,
        gender = CASE WHEN $27::BOOLEAN THEN $28::VARCHAR ELSE gender END,
        address_line1 = CASE WHEN $29::BOOLEAN THEN $30::VARCHAR ELSE address_line1 END,
        address_line2 = CASE WHEN $31::BOOLEAN THEN $32::VARCHAR ELSE address_line2 END,
        city = CASE WHEN $33::BOOLEAN THEN $34::VARCHAR ELSE city END,
        state = CASE WHEN $35::BOOLEAN THEN $36::VARCHAR ELSE state END,
        postal_code = CASE WHEN $37::BOOLEAN THEN $38::VARCHAR ELSE postal_code END,
        country = CASE WHEN $39::BOOLEAN THEN $40::VARCHAR ELSE country END
    WHERE id = $1::UUID
    RETURNING ${RETURNING_FIELDS};
`;

const DEACTIVATE_EMPLOYEE = `
    UPDATE employees
    SET status = 'inactive'
    WHERE id = $1::UUID
    RETURNING ${RETURNING_FIELDS};
`;

async function findEmployees(filters, tx = null) {
    const executor = getQueryExecutor(tx);
    const values = [
        filters.organizationId ?? null,
        filters.departmentId ?? null,
        filters.managerId ?? null,
        filters.status ?? null,
        filters.employmentType ?? null,
        filters.search ?? null,
    ];

    const [rowsResult, countResult] = await Promise.all([
        executor.query(FIND_EMPLOYEES, [
            ...values,
            filters.limit,
            filters.offset,
        ]),
        executor.query(COUNT_EMPLOYEES, values),
    ]);

    return {
        rows: rowsResult.rows,
        total: Number(countResult.rows[0]?.total ?? 0),
    };
}

async function findEmployeeById(id, tx = null) {
    const result = await getQueryExecutor(tx).query(FIND_EMPLOYEE_BY_ID, [id]);
    return result.rows[0] ?? null;
}

async function findEmployeeByUserId(userId, tx = null) {
    const result = await getQueryExecutor(tx).query(FIND_BY_USER_ID, [userId]);
    return result.rows[0] ?? null;
}

async function findEmployeeByNumber(number, tx = null) {
    const result = await getQueryExecutor(tx).query(FIND_BY_NUMBER, [number]);
    return result.rows[0] ?? null;
}

async function findUser(userId, tx = null) {
    const result = await getQueryExecutor(tx).query(FIND_USER, [userId]);
    return result.rows[0] ?? null;
}

async function findOrganization(organizationId, tx = null) {
    const result = await getQueryExecutor(tx).query(FIND_ORGANIZATION, [organizationId]);
    return result.rows[0] ?? null;
}

async function findDepartment(departmentId, tx = null) {
    const result = await getQueryExecutor(tx).query(FIND_DEPARTMENT, [departmentId]);
    return result.rows[0] ?? null;
}

async function findManager(managerId, tx = null) {
    const result = await getQueryExecutor(tx).query(FIND_MANAGER, [managerId]);
    return result.rows[0] ?? null;
}

async function createEmployee(data, tx = null) {
    const result = await getQueryExecutor(tx).query(CREATE_EMPLOYEE, [
        randomUUID(),
        data.userId,
        data.employeeNumber,
        data.firstName,
        data.middleName ?? null,
        data.lastName,
        data.displayName,
        data.organizationId,
        data.departmentId,
        data.managerId ?? null,
        data.designation ?? null,
        data.employmentType,
        data.joiningDate,
        data.leavingDate ?? null,
        data.status,
        data.phone ?? null,
        data.alternatePhone ?? null,
        data.workEmail ?? null,
        data.dateOfBirth ?? null,
        data.gender ?? null,
        data.addressLine1 ?? null,
        data.addressLine2 ?? null,
        data.city ?? null,
        data.state ?? null,
        data.postalCode ?? null,
        data.country ?? null,
    ]);
    return result.rows[0];
}

async function updateEmployee(employeeId, data, tx = null) {
    const has = (key) => Object.prototype.hasOwnProperty.call(data, key);
    const result = await getQueryExecutor(tx).query(UPDATE_EMPLOYEE, [
        employeeId,
        data.employeeNumber ?? null,
        data.firstName ?? null,
        has("middleName"), data.middleName ?? null,
        data.lastName ?? null,
        data.displayName ?? null,
        data.organizationId ?? null,
        data.departmentId ?? null,
        has("managerId"), data.managerId ?? null,
        has("designation"), data.designation ?? null,
        data.employmentType ?? null,
        data.joiningDate ?? null,
        has("leavingDate"), data.leavingDate ?? null,
        data.status ?? null,
        has("phone"), data.phone ?? null,
        has("alternatePhone"), data.alternatePhone ?? null,
        has("workEmail"), data.workEmail ?? null,
        has("dateOfBirth"), data.dateOfBirth ?? null,
        has("gender"), data.gender ?? null,
        has("addressLine1"), data.addressLine1 ?? null,
        has("addressLine2"), data.addressLine2 ?? null,
        has("city"), data.city ?? null,
        has("state"), data.state ?? null,
        has("postalCode"), data.postalCode ?? null,
        has("country"), data.country ?? null,
    ]);
    return result.rows[0] ?? null;
}

async function deactivateEmployee(employeeId, tx = null) {
    const result = await getQueryExecutor(tx).query(DEACTIVATE_EMPLOYEE, [employeeId]);
    return result.rows[0] ?? null;
}

export default Object.freeze({
    findEmployees,
    findEmployeeById,
    findEmployeeByUserId,
    findEmployeeByNumber,
    findUser,
    findOrganization,
    findDepartment,
    findManager,
    createEmployee,
    updateEmployee,
    deactivateEmployee,
});
