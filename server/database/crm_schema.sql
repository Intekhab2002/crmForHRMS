--
-- PostgreSQL database dump
--

\restrict vBTdzPExDQQINatwgHNi09NMzGgXzdI0Ges6zRcEXadPGmvdlIhNzZQrOE08XXp

-- Dumped from database version 18.3
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: protect_singleton_system_assignments(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.protect_singleton_system_assignments() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    target_role_code VARCHAR(50);
    existing_count INTEGER;
BEGIN
    SELECT code
    INTO target_role_code
    FROM roles
    WHERE id = NEW.role_id;

    IF target_role_code = 'developer' THEN
        SELECT COUNT(*)
        INTO existing_count
        FROM user_roles
        WHERE role_id = NEW.role_id
          AND user_id <> NEW.user_id;

        IF existing_count > 0 THEN
            RAISE EXCEPTION 'Only one developer account is permitted.'
                USING ERRCODE = '23514';
        END IF;
    ELSIF target_role_code = 'superadmin' THEN
        SELECT COUNT(*)
        INTO existing_count
        FROM user_roles
        WHERE role_id = NEW.role_id
          AND user_id <> NEW.user_id;

        IF existing_count > 0 THEN
            RAISE EXCEPTION 'Only one superadmin account is permitted.'
                USING ERRCODE = '23514';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.protect_singleton_system_assignments() OWNER TO postgres;

--
-- Name: protect_system_roles(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.protect_system_roles() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.code IN ('developer', 'superadmin') THEN
        RAISE EXCEPTION 'Protected system roles cannot be created directly.'
            USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'UPDATE' AND (OLD.code IN ('developer', 'superadmin') OR NEW.code IN ('developer', 'superadmin')) THEN
        RAISE EXCEPTION 'Protected system roles cannot be modified directly.'
            USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'DELETE' AND OLD.code IN ('developer', 'superadmin') THEN
        RAISE EXCEPTION 'Protected system roles cannot be deleted directly.'
            USING ERRCODE = '42501';
    END IF;

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.protect_system_roles() OWNER TO postgres;

--
-- Name: set_departments_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_departments_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_departments_updated_at() OWNER TO postgres;

--
-- Name: set_employees_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_employees_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_employees_updated_at() OWNER TO postgres;

--
-- Name: set_field_definitions_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_field_definitions_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_field_definitions_updated_at() OWNER TO postgres;

--
-- Name: set_form_definitions_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_form_definitions_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_form_definitions_updated_at() OWNER TO postgres;

--
-- Name: set_form_field_assignments_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_form_field_assignments_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_form_field_assignments_updated_at() OWNER TO postgres;

--
-- Name: set_organizations_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_organizations_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_organizations_updated_at() OWNER TO postgres;

--
-- Name: set_permissions_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_permissions_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_permissions_updated_at() OWNER TO postgres;

--
-- Name: set_roles_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_roles_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_roles_updated_at() OWNER TO postgres;

--
-- Name: set_ticket_comments_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_ticket_comments_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_ticket_comments_updated_at() OWNER TO postgres;

--
-- Name: set_tickets_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_tickets_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_tickets_updated_at() OWNER TO postgres;

--
-- Name: set_users_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_users_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_users_updated_at() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: contacts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.contacts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    organization_id uuid NOT NULL,
    name character varying(200) NOT NULL,
    mobile_phone character varying(30) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT contacts_mobile_not_blank CHECK ((length(btrim((mobile_phone)::text)) > 0)),
    CONSTRAINT contacts_name_not_blank CHECK ((length(btrim((name)::text)) > 0))
);


ALTER TABLE public.contacts OWNER TO postgres;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id uuid NOT NULL,
    organization_id uuid NOT NULL,
    parent_department_id uuid,
    code character varying(50) NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT departments_parent_not_self_check CHECK (((parent_department_id IS NULL) OR (parent_department_id <> id))),
    CONSTRAINT departments_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id uuid CONSTRAINT employees_id_not_null1 NOT NULL,
    user_id uuid CONSTRAINT employees_user_id_not_null1 NOT NULL,
    employee_number character varying(50) CONSTRAINT employees_employee_number_not_null1 NOT NULL,
    first_name character varying(100) CONSTRAINT employees_first_name_not_null1 NOT NULL,
    middle_name character varying(100),
    last_name character varying(100) CONSTRAINT employees_last_name_not_null1 NOT NULL,
    display_name character varying(255) CONSTRAINT employees_display_name_not_null1 NOT NULL,
    organization_id uuid CONSTRAINT employees_organization_id_not_null1 NOT NULL,
    department_id uuid CONSTRAINT employees_department_id_not_null1 NOT NULL,
    manager_id uuid,
    designation character varying(150),
    employment_type character varying(30) DEFAULT 'full_time'::character varying NOT NULL,
    joining_date date CONSTRAINT employees_joining_date_not_null1 NOT NULL,
    leaving_date date,
    status character varying(30) DEFAULT 'active'::character varying CONSTRAINT employees_status_not_null1 NOT NULL,
    phone character varying(30),
    alternate_phone character varying(30),
    work_email character varying(320),
    date_of_birth date,
    gender character varying(30),
    address_line1 character varying(255),
    address_line2 character varying(255),
    city character varying(100),
    state character varying(100),
    postal_code character varying(20),
    country character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP CONSTRAINT employees_created_at_not_null1 NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP CONSTRAINT employees_updated_at_not_null1 NOT NULL,
    CONSTRAINT employees_created_at_not_null CHECK ((created_at IS NOT NULL)),
    CONSTRAINT employees_department_id_not_null CHECK ((department_id IS NOT NULL)),
    CONSTRAINT employees_display_name_not_null CHECK ((display_name IS NOT NULL)),
    CONSTRAINT employees_employee_number_not_null CHECK ((employee_number IS NOT NULL)),
    CONSTRAINT employees_employment_type_check CHECK (((employment_type)::text = ANY ((ARRAY['full_time'::character varying, 'part_time'::character varying, 'contract'::character varying, 'intern'::character varying, 'consultant'::character varying])::text[]))),
    CONSTRAINT employees_first_name_not_null CHECK ((first_name IS NOT NULL)),
    CONSTRAINT employees_id_not_null CHECK ((id IS NOT NULL)),
    CONSTRAINT employees_joining_date_not_null CHECK ((joining_date IS NOT NULL)),
    CONSTRAINT employees_last_name_not_null CHECK ((last_name IS NOT NULL)),
    CONSTRAINT employees_leaving_date_check CHECK (((leaving_date IS NULL) OR (leaving_date >= joining_date))),
    CONSTRAINT employees_organization_id_not_null CHECK ((organization_id IS NOT NULL)),
    CONSTRAINT employees_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'on_leave'::character varying, 'terminated'::character varying])::text[]))),
    CONSTRAINT employees_status_not_null CHECK ((status IS NOT NULL)),
    CONSTRAINT employees_updated_at_not_null CHECK ((updated_at IS NOT NULL)),
    CONSTRAINT employees_user_id_not_null CHECK ((user_id IS NOT NULL))
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: field_definitions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.field_definitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    field_key character varying(100) NOT NULL,
    name character varying(150) NOT NULL,
    label character varying(200) NOT NULL,
    description text,
    type character varying(50) NOT NULL,
    data_type character varying(50) NOT NULL,
    placeholder character varying(255),
    help_text text,
    default_value jsonb,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    is_visible boolean DEFAULT true NOT NULL,
    is_enabled boolean DEFAULT true NOT NULL,
    is_editable boolean DEFAULT true NOT NULL,
    is_read_only boolean DEFAULT false NOT NULL,
    is_required boolean DEFAULT false NOT NULL,
    is_searchable boolean DEFAULT false NOT NULL,
    is_filterable boolean DEFAULT false NOT NULL,
    is_sortable boolean DEFAULT false NOT NULL,
    validation_config jsonb DEFAULT '{}'::jsonb NOT NULL,
    options_config jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT field_definitions_data_type_check CHECK (((data_type)::text = ANY ((ARRAY['string'::character varying, 'number'::character varying, 'boolean'::character varying, 'date'::character varying, 'datetime'::character varying, 'time'::character varying, 'file'::character varying, 'array'::character varying])::text[]))),
    CONSTRAINT field_definitions_deleted_state_check CHECK ((((is_deleted = false) AND (deleted_at IS NULL)) OR ((is_deleted = true) AND (deleted_at IS NOT NULL)))),
    CONSTRAINT field_definitions_label_not_blank CHECK ((length(btrim((label)::text)) > 0)),
    CONSTRAINT field_definitions_name_not_blank CHECK ((length(btrim((name)::text)) > 0)),
    CONSTRAINT field_definitions_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[]))),
    CONSTRAINT field_definitions_type_check CHECK (((type)::text = ANY ((ARRAY['text'::character varying, 'textarea'::character varying, 'number'::character varying, 'email'::character varying, 'password'::character varying, 'select'::character varying, 'multi_select'::character varying, 'autocomplete'::character varying, 'date'::character varying, 'datetime'::character varying, 'time'::character varying, 'checkbox'::character varying, 'switch'::character varying, 'radio'::character varying, 'file'::character varying])::text[])))
);


ALTER TABLE public.field_definitions OWNER TO postgres;

--
-- Name: form_definitions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.form_definitions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(150) NOT NULL,
    module character varying(100) NOT NULL,
    description text,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    is_deleted boolean DEFAULT false NOT NULL,
    created_by uuid,
    updated_by uuid,
    deleted_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    deleted_at timestamp with time zone,
    CONSTRAINT form_definitions_code_format_check CHECK (((code)::text ~ '^[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$'::text)),
    CONSTRAINT form_definitions_deleted_state_check CHECK ((((is_deleted = false) AND (deleted_at IS NULL)) OR ((is_deleted = true) AND (deleted_at IS NOT NULL)))),
    CONSTRAINT form_definitions_module_not_blank CHECK ((length(btrim((module)::text)) > 0)),
    CONSTRAINT form_definitions_name_not_blank CHECK ((length(btrim((name)::text)) > 0)),
    CONSTRAINT form_definitions_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);


ALTER TABLE public.form_definitions OWNER TO postgres;

--
-- Name: form_field_assignments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.form_field_assignments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    form_id uuid NOT NULL,
    field_id uuid NOT NULL,
    is_visible boolean,
    is_enabled boolean,
    is_editable boolean,
    is_read_only boolean,
    is_required boolean,
    is_searchable boolean,
    is_filterable boolean,
    is_sortable boolean,
    display_order integer DEFAULT 0 NOT NULL,
    section character varying(100),
    grid_size smallint,
    column_width character varying(50),
    label_override character varying(200),
    placeholder_override character varying(255),
    help_text_override text,
    default_value_override jsonb,
    created_by uuid,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT form_field_assignments_column_width_check CHECK (((column_width IS NULL) OR (length(btrim((column_width)::text)) > 0))),
    CONSTRAINT form_field_assignments_display_order_check CHECK ((display_order >= 0)),
    CONSTRAINT form_field_assignments_grid_size_check CHECK (((grid_size IS NULL) OR ((grid_size >= 1) AND (grid_size <= 12))))
);


ALTER TABLE public.form_field_assignments OWNER TO postgres;

--
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    id uuid NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    email character varying(320),
    phone character varying(30),
    website character varying(255),
    address_line1 character varying(255),
    address_line2 character varying(255),
    city character varying(100),
    state character varying(100),
    postal_code character varying(20),
    country character varying(100),
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT organizations_code_format_check CHECK (((code)::text ~ '^[a-z][a-z0-9_-]*$'::text)),
    CONSTRAINT organizations_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);


ALTER TABLE public.organizations OWNER TO postgres;

--
-- Name: permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.permissions (
    id uuid NOT NULL,
    code character varying(100) NOT NULL,
    name character varying(150) NOT NULL,
    description text,
    resource character varying(100) NOT NULL,
    action character varying(50) NOT NULL,
    is_system boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT permissions_action_format_check CHECK (((action)::text ~ '^[a-z][a-z0-9_]*$'::text)),
    CONSTRAINT permissions_code_format_check CHECK (((code)::text ~ '^[a-z][a-z0-9_]*:[a-z][a-z0-9_]*$'::text)),
    CONSTRAINT permissions_resource_format_check CHECK (((resource)::text ~ '^[a-z][a-z0-9_]*$'::text))
);


ALTER TABLE public.permissions OWNER TO postgres;

--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.role_permissions (
    role_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.role_permissions OWNER TO postgres;

--
-- Name: roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.roles (
    id uuid NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_system boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT roles_code_format_check CHECK (((code)::text ~ '^[a-z][a-z0-9_]*$'::text))
);


ALTER TABLE public.roles OWNER TO postgres;

--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.schema_migrations (
    version character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    checksum character(64) NOT NULL,
    applied_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    execution_time_ms integer NOT NULL,
    CONSTRAINT schema_migrations_execution_time_ms_check CHECK ((execution_time_ms >= 0))
);


ALTER TABLE public.schema_migrations OWNER TO postgres;

--
-- Name: ticket_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_comments (
    id uuid CONSTRAINT ticket_comments_id_not_null1 NOT NULL,
    ticket_id uuid NOT NULL,
    user_id uuid NOT NULL,
    comment text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP CONSTRAINT ticket_comments_created_at_not_null1 NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP CONSTRAINT ticket_comments_updated_at_not_null1 NOT NULL,
    CONSTRAINT ticket_comments_comment_not_blank CHECK ((length(btrim(comment)) > 0)),
    CONSTRAINT ticket_comments_created_at_not_null CHECK ((created_at IS NOT NULL)),
    CONSTRAINT ticket_comments_id_not_null CHECK ((id IS NOT NULL)),
    CONSTRAINT ticket_comments_ticket_not_null CHECK ((ticket_id IS NOT NULL)),
    CONSTRAINT ticket_comments_updated_at_not_null CHECK ((updated_at IS NOT NULL)),
    CONSTRAINT ticket_comments_user_not_null CHECK ((user_id IS NOT NULL))
);


ALTER TABLE public.ticket_comments OWNER TO postgres;

--
-- Name: ticket_number_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ticket_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ticket_number_seq OWNER TO postgres;

--
-- Name: tickets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tickets (
    id uuid CONSTRAINT tickets_id_not_null1 NOT NULL,
    ticket_number character varying(32) CONSTRAINT tickets_ticket_number_not_null1 NOT NULL,
    subject character varying(255) CONSTRAINT tickets_subject_not_null1 NOT NULL,
    description text CONSTRAINT tickets_description_not_null1 NOT NULL,
    issue_type character varying(100) CONSTRAINT tickets_issue_type_not_null1 NOT NULL,
    priority character varying(20) DEFAULT 'MEDIUM'::character varying CONSTRAINT tickets_priority_not_null1 NOT NULL,
    status character varying(20) DEFAULT 'OPEN'::character varying CONSTRAINT tickets_status_not_null1 NOT NULL,
    requester_user_id uuid NOT NULL,
    created_by_user_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    department_id uuid NOT NULL,
    assigned_employee_id uuid,
    resolution_note text,
    assigned_at timestamp with time zone,
    resolved_at timestamp with time zone,
    closed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP CONSTRAINT tickets_created_at_not_null1 NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP CONSTRAINT tickets_updated_at_not_null1 NOT NULL,
    contact_id uuid,
    assigned_user_id uuid,
    CONSTRAINT tickets_assigned_at_check CHECK (((assigned_at IS NULL) OR (assigned_user_id IS NOT NULL))),
    CONSTRAINT tickets_closed_at_check CHECK (((closed_at IS NULL) OR ((status)::text = 'CLOSED'::text))),
    CONSTRAINT tickets_created_at_not_null CHECK ((created_at IS NOT NULL)),
    CONSTRAINT tickets_created_by_not_null CHECK ((created_by_user_id IS NOT NULL)),
    CONSTRAINT tickets_department_not_null CHECK ((department_id IS NOT NULL)),
    CONSTRAINT tickets_description_not_blank CHECK ((length(btrim(description)) > 0)),
    CONSTRAINT tickets_description_not_null CHECK ((description IS NOT NULL)),
    CONSTRAINT tickets_id_not_null CHECK ((id IS NOT NULL)),
    CONSTRAINT tickets_issue_type_not_blank CHECK ((length(btrim((issue_type)::text)) > 0)),
    CONSTRAINT tickets_issue_type_not_null CHECK ((issue_type IS NOT NULL)),
    CONSTRAINT tickets_organization_not_null CHECK ((organization_id IS NOT NULL)),
    CONSTRAINT tickets_priority_check CHECK (((priority)::text = ANY ((ARRAY['LOW'::character varying, 'MEDIUM'::character varying, 'HIGH'::character varying, 'CRITICAL'::character varying])::text[]))),
    CONSTRAINT tickets_priority_not_null CHECK ((priority IS NOT NULL)),
    CONSTRAINT tickets_requester_not_null CHECK ((requester_user_id IS NOT NULL)),
    CONSTRAINT tickets_resolved_at_check CHECK (((resolved_at IS NULL) OR ((status)::text = ANY ((ARRAY['RESOLVED'::character varying, 'CLOSED'::character varying])::text[])))),
    CONSTRAINT tickets_status_check CHECK (((status)::text = ANY ((ARRAY['OPEN'::character varying, 'ASSIGNED'::character varying, 'IN_PROGRESS'::character varying, 'PENDING'::character varying, 'RESOLVED'::character varying, 'CLOSED'::character varying, 'REOPENED'::character varying])::text[]))),
    CONSTRAINT tickets_status_not_null CHECK ((status IS NOT NULL)),
    CONSTRAINT tickets_subject_not_blank CHECK ((length(btrim((subject)::text)) > 0)),
    CONSTRAINT tickets_subject_not_null CHECK ((subject IS NOT NULL)),
    CONSTRAINT tickets_ticket_number_not_null CHECK ((ticket_number IS NOT NULL)),
    CONSTRAINT tickets_updated_at_not_null CHECK ((updated_at IS NOT NULL))
);


ALTER TABLE public.tickets OWNER TO postgres;

--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.user_roles OWNER TO postgres;

--
-- Name: user_sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    refresh_token_hash character varying(64) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_used_at timestamp with time zone,
    ip_address inet,
    user_agent text
);


ALTER TABLE public.user_sessions OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    username character varying(100) NOT NULL,
    email character varying(320) NOT NULL,
    password_hash character varying(255) NOT NULL,
    status character varying(20) DEFAULT 'active'::character varying NOT NULL,
    failed_login_attempts integer DEFAULT 0 NOT NULL,
    locked_until timestamp with time zone,
    email_verified_at timestamp with time zone,
    password_changed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_login_at timestamp with time zone,
    last_login_ip inet,
    deactivated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT users_failed_login_attempts_check CHECK ((failed_login_attempts >= 0)),
    CONSTRAINT users_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'inactive'::character varying, 'suspended'::character varying, 'locked'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: field_definitions field_definitions_field_key_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.field_definitions
    ADD CONSTRAINT field_definitions_field_key_unique UNIQUE (field_key);


--
-- Name: field_definitions field_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.field_definitions
    ADD CONSTRAINT field_definitions_pkey PRIMARY KEY (id);


--
-- Name: form_definitions form_definitions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_definitions
    ADD CONSTRAINT form_definitions_pkey PRIMARY KEY (id);


--
-- Name: form_field_assignments form_field_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_field_assignments
    ADD CONSTRAINT form_field_assignments_pkey PRIMARY KEY (id);


--
-- Name: form_field_assignments form_field_assignments_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_field_assignments
    ADD CONSTRAINT form_field_assignments_unique UNIQUE (form_id, field_id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: ticket_comments ticket_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_pkey PRIMARY KEY (id);


--
-- Name: tickets tickets_ticket_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_ticket_number_unique UNIQUE (ticket_number);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: user_sessions user_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_pkey PRIMARY KEY (id);


--
-- Name: user_sessions user_sessions_refresh_token_hash_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_refresh_token_hash_unique UNIQUE (refresh_token_hash);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: contacts_organization_mobile_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX contacts_organization_mobile_unique_idx ON public.contacts USING btree (organization_id, mobile_phone);


--
-- Name: departments_organization_code_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX departments_organization_code_unique_idx ON public.departments USING btree (organization_id, lower((code)::text));


--
-- Name: departments_organization_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX departments_organization_idx ON public.departments USING btree (organization_id);


--
-- Name: departments_organization_name_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX departments_organization_name_unique_idx ON public.departments USING btree (organization_id, lower((name)::text));


--
-- Name: departments_parent_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX departments_parent_idx ON public.departments USING btree (parent_department_id);


--
-- Name: departments_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX departments_status_idx ON public.departments USING btree (status);


--
-- Name: employees_department_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX employees_department_idx ON public.employees USING btree (department_id);


--
-- Name: employees_display_name_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX employees_display_name_idx ON public.employees USING btree (lower((display_name)::text));


--
-- Name: employees_joining_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX employees_joining_date_idx ON public.employees USING btree (joining_date);


--
-- Name: employees_manager_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX employees_manager_idx ON public.employees USING btree (manager_id) WHERE (manager_id IS NOT NULL);


--
-- Name: employees_number_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX employees_number_unique_idx ON public.employees USING btree (lower((employee_number)::text));


--
-- Name: employees_organization_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX employees_organization_idx ON public.employees USING btree (organization_id);


--
-- Name: employees_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX employees_status_idx ON public.employees USING btree (status);


--
-- Name: employees_user_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX employees_user_unique_idx ON public.employees USING btree (user_id);


--
-- Name: field_definitions_data_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX field_definitions_data_type_idx ON public.field_definitions USING btree (data_type);


--
-- Name: field_definitions_deleted_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX field_definitions_deleted_idx ON public.field_definitions USING btree (is_deleted);


--
-- Name: field_definitions_options_config_gin_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX field_definitions_options_config_gin_idx ON public.field_definitions USING gin (options_config);


--
-- Name: field_definitions_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX field_definitions_status_idx ON public.field_definitions USING btree (status);


--
-- Name: field_definitions_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX field_definitions_type_idx ON public.field_definitions USING btree (type);


--
-- Name: field_definitions_validation_config_gin_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX field_definitions_validation_config_gin_idx ON public.field_definitions USING gin (validation_config);


--
-- Name: form_definitions_code_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX form_definitions_code_unique_idx ON public.form_definitions USING btree (code);


--
-- Name: form_definitions_deleted_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX form_definitions_deleted_idx ON public.form_definitions USING btree (is_deleted);


--
-- Name: form_definitions_module_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX form_definitions_module_idx ON public.form_definitions USING btree (module);


--
-- Name: form_definitions_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX form_definitions_status_idx ON public.form_definitions USING btree (status);


--
-- Name: form_field_assignments_field_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX form_field_assignments_field_idx ON public.form_field_assignments USING btree (field_id);


--
-- Name: form_field_assignments_form_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX form_field_assignments_form_idx ON public.form_field_assignments USING btree (form_id, display_order);


--
-- Name: form_field_assignments_section_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX form_field_assignments_section_idx ON public.form_field_assignments USING btree (section);


--
-- Name: idx_tickets_assigned_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_assigned_user_id ON public.tickets USING btree (assigned_user_id);


--
-- Name: idx_tickets_contact_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tickets_contact_id ON public.tickets USING btree (contact_id);


--
-- Name: organizations_code_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX organizations_code_unique_idx ON public.organizations USING btree (lower((code)::text));


--
-- Name: organizations_name_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX organizations_name_unique_idx ON public.organizations USING btree (lower((name)::text));


--
-- Name: organizations_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX organizations_status_idx ON public.organizations USING btree (status);


--
-- Name: permissions_action_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX permissions_action_idx ON public.permissions USING btree (action);


--
-- Name: permissions_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX permissions_active_idx ON public.permissions USING btree (is_active);


--
-- Name: permissions_code_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX permissions_code_unique_idx ON public.permissions USING btree (code);


--
-- Name: permissions_resource_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX permissions_resource_active_idx ON public.permissions USING btree (resource, is_active);


--
-- Name: permissions_resource_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX permissions_resource_idx ON public.permissions USING btree (resource);


--
-- Name: permissions_system_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX permissions_system_idx ON public.permissions USING btree (is_system);


--
-- Name: role_permissions_permission_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX role_permissions_permission_idx ON public.role_permissions USING btree (permission_id);


--
-- Name: roles_active_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX roles_active_idx ON public.roles USING btree (is_active);


--
-- Name: roles_code_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX roles_code_unique_idx ON public.roles USING btree (code);


--
-- Name: roles_name_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX roles_name_unique_idx ON public.roles USING btree (name);


--
-- Name: roles_system_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX roles_system_idx ON public.roles USING btree (is_system);


--
-- Name: ticket_comments_ticket_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ticket_comments_ticket_idx ON public.ticket_comments USING btree (ticket_id, created_at DESC);


--
-- Name: ticket_comments_user_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ticket_comments_user_idx ON public.ticket_comments USING btree (user_id);


--
-- Name: tickets_assigned_employee_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tickets_assigned_employee_idx ON public.tickets USING btree (assigned_employee_id) WHERE (assigned_employee_id IS NOT NULL);


--
-- Name: tickets_assigned_user_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tickets_assigned_user_idx ON public.tickets USING btree (assigned_user_id) WHERE (assigned_user_id IS NOT NULL);


--
-- Name: tickets_contact_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tickets_contact_idx ON public.tickets USING btree (contact_id) WHERE (contact_id IS NOT NULL);


--
-- Name: tickets_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tickets_created_at_idx ON public.tickets USING btree (created_at DESC);


--
-- Name: tickets_created_by_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tickets_created_by_idx ON public.tickets USING btree (created_by_user_id);


--
-- Name: tickets_department_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tickets_department_idx ON public.tickets USING btree (department_id);


--
-- Name: tickets_organization_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tickets_organization_idx ON public.tickets USING btree (organization_id);


--
-- Name: tickets_priority_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tickets_priority_idx ON public.tickets USING btree (priority);


--
-- Name: tickets_requester_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tickets_requester_idx ON public.tickets USING btree (requester_user_id);


--
-- Name: tickets_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tickets_status_idx ON public.tickets USING btree (status);


--
-- Name: tickets_subject_search_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tickets_subject_search_idx ON public.tickets USING btree (lower((subject)::text));


--
-- Name: user_roles_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_roles_role_idx ON public.user_roles USING btree (role_id);


--
-- Name: user_sessions_active_user_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_sessions_active_user_idx ON public.user_sessions USING btree (user_id) WHERE (revoked_at IS NULL);


--
-- Name: user_sessions_expires_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_sessions_expires_at_idx ON public.user_sessions USING btree (expires_at);


--
-- Name: user_sessions_revoked_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_sessions_revoked_at_idx ON public.user_sessions USING btree (revoked_at) WHERE (revoked_at IS NOT NULL);


--
-- Name: user_sessions_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_sessions_user_id_idx ON public.user_sessions USING btree (user_id);


--
-- Name: users_email_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_unique_idx ON public.users USING btree (lower((email)::text));


--
-- Name: users_last_login_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_last_login_at_idx ON public.users USING btree (last_login_at);


--
-- Name: users_locked_until_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_locked_until_idx ON public.users USING btree (locked_until) WHERE (locked_until IS NOT NULL);


--
-- Name: users_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_status_idx ON public.users USING btree (status);


--
-- Name: users_username_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_username_unique_idx ON public.users USING btree (lower((username)::text));


--
-- Name: departments departments_set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER departments_set_updated_at BEFORE UPDATE ON public.departments FOR EACH ROW EXECUTE FUNCTION public.set_departments_updated_at();


--
-- Name: employees employees_set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER employees_set_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.set_employees_updated_at();


--
-- Name: field_definitions field_definitions_set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER field_definitions_set_updated_at BEFORE UPDATE ON public.field_definitions FOR EACH ROW EXECUTE FUNCTION public.set_field_definitions_updated_at();


--
-- Name: form_definitions form_definitions_set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER form_definitions_set_updated_at BEFORE UPDATE ON public.form_definitions FOR EACH ROW EXECUTE FUNCTION public.set_form_definitions_updated_at();


--
-- Name: form_field_assignments form_field_assignments_set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER form_field_assignments_set_updated_at BEFORE UPDATE ON public.form_field_assignments FOR EACH ROW EXECUTE FUNCTION public.set_form_field_assignments_updated_at();


--
-- Name: organizations organizations_set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER organizations_set_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.set_organizations_updated_at();


--
-- Name: permissions permissions_set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER permissions_set_updated_at BEFORE UPDATE ON public.permissions FOR EACH ROW EXECUTE FUNCTION public.set_permissions_updated_at();


--
-- Name: roles roles_protect_system_roles; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER roles_protect_system_roles BEFORE INSERT OR DELETE OR UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.protect_system_roles();


--
-- Name: roles roles_set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER roles_set_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.set_roles_updated_at();


--
-- Name: ticket_comments ticket_comments_set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER ticket_comments_set_updated_at BEFORE UPDATE ON public.ticket_comments FOR EACH ROW EXECUTE FUNCTION public.set_ticket_comments_updated_at();


--
-- Name: tickets tickets_set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER tickets_set_updated_at BEFORE UPDATE ON public.tickets FOR EACH ROW EXECUTE FUNCTION public.set_tickets_updated_at();


--
-- Name: user_roles user_roles_protect_singleton_system_assignments; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER user_roles_protect_singleton_system_assignments BEFORE INSERT OR UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.protect_singleton_system_assignments();


--
-- Name: users users_set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_users_updated_at();


--
-- Name: contacts contacts_organization_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_organization_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: departments departments_organization_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_organization_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;


--
-- Name: departments departments_parent_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_parent_fk FOREIGN KEY (parent_department_id) REFERENCES public.departments(id) ON DELETE RESTRICT;


--
-- Name: employees employees_department_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_department_fk FOREIGN KEY (department_id) REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employees employees_manager_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_manager_fk FOREIGN KEY (manager_id) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: employees employees_organization_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_organization_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: employees employees_user_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_user_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: field_definitions field_definitions_created_by_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.field_definitions
    ADD CONSTRAINT field_definitions_created_by_fk FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: field_definitions field_definitions_deleted_by_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.field_definitions
    ADD CONSTRAINT field_definitions_deleted_by_fk FOREIGN KEY (deleted_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: field_definitions field_definitions_updated_by_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.field_definitions
    ADD CONSTRAINT field_definitions_updated_by_fk FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: form_definitions form_definitions_created_by_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_definitions
    ADD CONSTRAINT form_definitions_created_by_fk FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: form_definitions form_definitions_deleted_by_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_definitions
    ADD CONSTRAINT form_definitions_deleted_by_fk FOREIGN KEY (deleted_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: form_definitions form_definitions_updated_by_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_definitions
    ADD CONSTRAINT form_definitions_updated_by_fk FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: form_field_assignments form_field_assignments_created_by_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_field_assignments
    ADD CONSTRAINT form_field_assignments_created_by_fk FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: form_field_assignments form_field_assignments_field_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_field_assignments
    ADD CONSTRAINT form_field_assignments_field_fk FOREIGN KEY (field_id) REFERENCES public.field_definitions(id) ON DELETE RESTRICT;


--
-- Name: form_field_assignments form_field_assignments_form_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_field_assignments
    ADD CONSTRAINT form_field_assignments_form_fk FOREIGN KEY (form_id) REFERENCES public.form_definitions(id) ON DELETE CASCADE;


--
-- Name: form_field_assignments form_field_assignments_updated_by_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.form_field_assignments
    ADD CONSTRAINT form_field_assignments_updated_by_fk FOREIGN KEY (updated_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: role_permissions role_permissions_permission_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_fk FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_fk FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: ticket_comments ticket_comments_ticket_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_ticket_fk FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ticket_comments ticket_comments_user_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_user_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tickets tickets_assigned_employee_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_assigned_employee_fk FOREIGN KEY (assigned_employee_id) REFERENCES public.employees(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tickets tickets_assigned_user_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_assigned_user_fk FOREIGN KEY (assigned_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tickets tickets_assigned_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_assigned_user_id_fkey FOREIGN KEY (assigned_user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: tickets tickets_contact_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_contact_fk FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tickets tickets_contact_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_contact_id_fkey FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;


--
-- Name: tickets tickets_created_by_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_created_by_fk FOREIGN KEY (created_by_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tickets tickets_department_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_department_fk FOREIGN KEY (department_id) REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tickets tickets_organization_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_organization_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: tickets tickets_requester_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tickets
    ADD CONSTRAINT tickets_requester_fk FOREIGN KEY (requester_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: user_roles user_roles_role_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_fk FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_sessions user_sessions_user_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_sessions
    ADD CONSTRAINT user_sessions_user_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict vBTdzPExDQQINatwgHNi09NMzGgXzdI0Ges6zRcEXadPGmvdlIhNzZQrOE08XXp

