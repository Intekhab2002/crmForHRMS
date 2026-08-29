--
-- PostgreSQL database dump
--

\restrict 1OsyN7S6mESBfICGy16i2xAfHpgVkyiSL3YvLwMCFItZlGp4i96jAL4b7mEh2FG

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
-- Name: prevent_immutable_role_downgrade(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.prevent_immutable_role_downgrade() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN

    IF OLD.is_immutable = TRUE
       AND NEW.is_immutable IS DISTINCT FROM TRUE
    THEN

        RAISE EXCEPTION
            'An immutable role cannot be made mutable.'
            USING ERRCODE = '42501';

    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.prevent_immutable_role_downgrade() OWNER TO postgres;

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
-- Name: protect_system_identity_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.protect_system_identity_user() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    has_protected_role BOOLEAN;
BEGIN

    /**
     * ========================================================================
     * DELETE
     * ========================================================================
     */

    IF TG_OP = 'DELETE' THEN

        SELECT EXISTS (
            SELECT 1
            FROM user_roles ur
            INNER JOIN roles r
                ON r.id = ur.role_id
            WHERE ur.user_id = OLD.id
              AND r.code = 'developer'
        )
        INTO has_protected_role;

        IF has_protected_role THEN
            RAISE EXCEPTION
                'Protected developer identity cannot be deleted.'
                USING ERRCODE = '42501';
        END IF;

        RETURN OLD;
    END IF;


    /**
     * ========================================================================
     * UPDATE
     * ========================================================================
     */

    IF TG_OP = 'UPDATE' THEN

        SELECT EXISTS (
            SELECT 1
            FROM user_roles ur
            INNER JOIN roles r
                ON r.id = ur.role_id
            WHERE ur.user_id = OLD.id
              AND r.code = 'developer'
        )
        INTO has_protected_role;

        IF has_protected_role THEN

            /**
             * Developer identity credentials cannot be changed.
             */
            IF OLD.username IS DISTINCT FROM NEW.username
               OR OLD.email IS DISTINCT FROM NEW.email
               OR OLD.password_hash IS DISTINCT FROM NEW.password_hash
            THEN
                RAISE EXCEPTION
                    'Protected developer identity credentials cannot be modified.'
                    USING ERRCODE = '42501';
            END IF;


            /**
             * Developer cannot be deactivated, locked, or suspended through
             * ordinary user mutation.
             */
            IF OLD.status IS DISTINCT FROM NEW.status
               AND NEW.status <> 'active'
            THEN
                RAISE EXCEPTION
                    'Protected developer identity cannot be deactivated or locked.'
                    USING ERRCODE = '42501';
            END IF;


            /**
             * Developer cannot receive a deactivation timestamp.
             */
            IF NEW.deactivated_at IS NOT NULL THEN
                RAISE EXCEPTION
                    'Protected developer identity cannot be deactivated.'
                    USING ERRCODE = '42501';
            END IF;

        END IF;

        RETURN NEW;
    END IF;


    RETURN NEW;

END;
$$;


ALTER FUNCTION public.protect_system_identity_user() OWNER TO postgres;

--
-- Name: protect_system_role_assignment(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.protect_system_role_assignment() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    target_role_code VARCHAR(50);
    existing_count INTEGER;
BEGIN

    IF TG_OP = 'INSERT' THEN

        SELECT code
        INTO target_role_code
        FROM roles
        WHERE id = NEW.role_id;

        IF target_role_code IN ('developer', 'superadmin') THEN

            SELECT COUNT(*)
            INTO existing_count
            FROM user_roles ur
            WHERE ur.role_id = NEW.role_id
              AND ur.user_id <> NEW.user_id;

            IF existing_count > 0 THEN

                IF target_role_code = 'developer' THEN

                    RAISE EXCEPTION
                        'Only one Developer account is permitted.'
                        USING ERRCODE = '23505';

                ELSE

                    RAISE EXCEPTION
                        'Only one Super Admin account is permitted.'
                        USING ERRCODE = '23505';

                END IF;

            END IF;

        END IF;

        RETURN NEW;

    END IF;


    IF TG_OP = 'UPDATE' THEN

        SELECT code
        INTO target_role_code
        FROM roles
        WHERE id = NEW.role_id;

        IF target_role_code IN ('developer', 'superadmin') THEN

            SELECT COUNT(*)
            INTO existing_count
            FROM user_roles ur
            WHERE ur.role_id = NEW.role_id
              AND ur.user_id <> NEW.user_id;

            IF existing_count > 0 THEN

                IF target_role_code = 'developer' THEN

                    RAISE EXCEPTION
                        'Only one Developer account is permitted.'
                        USING ERRCODE = '23505';

                ELSE

                    RAISE EXCEPTION
                        'Only one Super Admin account is permitted.'
                        USING ERRCODE = '23505';

                END IF;

            END IF;

        END IF;

        RETURN NEW;

    END IF;


    /**
     * DELETE is intentionally allowed.
     *
     * The server RBAC layer determines whether the actor is authorized.
     * This permits Developer-controlled Super Admin succession.
     */

    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    END IF;


    RETURN NEW;

END;
$$;


ALTER FUNCTION public.protect_system_role_assignment() OWNER TO postgres;

--
-- Name: protect_system_role_identity(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.protect_system_role_identity() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN

    /**
     * ========================================================================
     * INSERT
     * ========================================================================
     */

    IF TG_OP = 'INSERT' THEN

        IF NEW.code IN ('developer', 'superadmin') THEN

            RAISE EXCEPTION
                'Protected system role "%" cannot be created directly.',
                NEW.code
                USING ERRCODE = '42501';

        END IF;

        RETURN NEW;
    END IF;


    /**
     * ========================================================================
     * UPDATE
     * ========================================================================
     */

    IF TG_OP = 'UPDATE' THEN

        /**
         * Existing protected identity.
         */
        IF OLD.code IN ('developer', 'superadmin') THEN

            /**
             * Code is immutable.
             */
            IF NEW.code IS DISTINCT FROM OLD.code THEN

                RAISE EXCEPTION
                    'Protected system role code cannot be changed.'
                    USING ERRCODE = '42501';

            END IF;


            /**
             * Display name is also protected for the two fixed identities.
             */
            IF NEW.name IS DISTINCT FROM OLD.name THEN

                RAISE EXCEPTION
                    'Protected system role name cannot be changed.'
                    USING ERRCODE = '42501';

            END IF;


            /**
             * Must remain a system role.
             */
            IF NEW.is_system IS DISTINCT FROM TRUE THEN

                RAISE EXCEPTION
                    'Protected system role must remain a system role.'
                    USING ERRCODE = '42501';

            END IF;


            /**
             * Must remain immutable.
             */
            IF NEW.is_immutable IS DISTINCT FROM TRUE THEN

                RAISE EXCEPTION
                    'Protected system role must remain immutable.'
                    USING ERRCODE = '42501';

            END IF;


            /**
             * Cannot be deactivated.
             */
            IF NEW.is_active IS DISTINCT FROM TRUE THEN

                RAISE EXCEPTION
                    'Protected system role cannot be deactivated.'
                    USING ERRCODE = '42501';

            END IF;

        END IF;


        /**
         * Prevent an ordinary role from becoming a protected identity.
         */
        IF OLD.code NOT IN ('developer', 'superadmin')
           AND NEW.code IN ('developer', 'superadmin')
        THEN

            RAISE EXCEPTION
                'An existing role cannot be converted into a protected system role.'
                USING ERRCODE = '42501';

        END IF;


        RETURN NEW;
    END IF;


    /**
     * ========================================================================
     * DELETE
     * ========================================================================
     */

    IF TG_OP = 'DELETE' THEN

        IF OLD.code IN ('developer', 'superadmin') THEN

            RAISE EXCEPTION
                'Protected system role "%" cannot be deleted.',
                OLD.code
                USING ERRCODE = '42501';

        END IF;

        RETURN OLD;
    END IF;


    RETURN NEW;

END;
$$;


ALTER FUNCTION public.protect_system_role_identity() OWNER TO postgres;

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
-- Name: set_ticket_attachments_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_ticket_attachments_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_ticket_attachments_updated_at() OWNER TO postgres;

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
    email character varying(320),
    department_id uuid,
    district character varying(100),
    CONSTRAINT contacts_mobile_not_blank CHECK ((length(btrim((mobile_phone)::text)) > 0)),
    CONSTRAINT contacts_name_not_blank CHECK ((length(btrim((name)::text)) > 0))
);


ALTER TABLE public.contacts OWNER TO postgres;

--
-- Name: default_role_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.default_role_permissions (
    permission_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.default_role_permissions OWNER TO postgres;

--
-- Name: TABLE default_role_permissions; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.default_role_permissions IS 'Default permissions automatically assigned when a custom role is created.';


--
-- Name: COLUMN default_role_permissions.permission_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.default_role_permissions.permission_id IS 'Permission granted by default to newly created custom roles.';


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
    short_name character varying(100),
    department_type character varying(100),
    contact_email character varying(320),
    contact_phone character varying(30),
    website character varying(255),
    address_line1 character varying(255),
    address_line2 character varying(255),
    city character varying(100),
    district character varying(100),
    state character varying(100) DEFAULT 'Bihar'::character varying,
    postal_code character varying(20),
    CONSTRAINT departments_parent_not_self_check CHECK (((parent_department_id IS NULL) OR (parent_department_id <> id))),
    CONSTRAINT departments_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);


ALTER TABLE public.departments OWNER TO postgres;

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
    is_immutable boolean DEFAULT false NOT NULL,
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
-- Name: ticket_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_attachments (
    id uuid NOT NULL,
    ticket_id uuid NOT NULL,
    user_id uuid NOT NULL,
    original_name character varying(255) NOT NULL,
    stored_name character varying(255) NOT NULL,
    mime_type character varying(150) NOT NULL,
    file_size bigint NOT NULL,
    storage_path text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ticket_attachments_file_size_limit CHECK ((file_size <= 10485760)),
    CONSTRAINT ticket_attachments_file_size_positive CHECK ((file_size > 0)),
    CONSTRAINT ticket_attachments_mime_type_not_blank CHECK ((length(btrim((mime_type)::text)) > 0)),
    CONSTRAINT ticket_attachments_original_name_not_blank CHECK ((length(btrim((original_name)::text)) > 0)),
    CONSTRAINT ticket_attachments_storage_path_not_blank CHECK ((length(btrim(storage_path)) > 0)),
    CONSTRAINT ticket_attachments_stored_name_not_blank CHECK ((length(btrim((stored_name)::text)) > 0))
);


ALTER TABLE public.ticket_attachments OWNER TO postgres;

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
-- Name: ticket_lifecycle_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_lifecycle_events (
    id uuid NOT NULL,
    ticket_id uuid NOT NULL,
    actor_user_id uuid NOT NULL,
    event_type character varying(50) NOT NULL,
    event_action character varying(100) NOT NULL,
    field_name character varying(100),
    old_value text,
    new_value text,
    metadata jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ticket_lifecycle_events_type_check CHECK (((event_type)::text = ANY ((ARRAY['TICKET'::character varying, 'FIELD'::character varying, 'STATUS'::character varying, 'ASSIGNMENT'::character varying, 'COMMENT'::character varying, 'ATTACHMENT'::character varying])::text[])))
);


ALTER TABLE public.ticket_lifecycle_events OWNER TO postgres;

--
-- Name: ticket_number_counters; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ticket_number_counters (
    year integer NOT NULL,
    next_number bigint NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT ticket_number_counters_next_number_check CHECK ((next_number >= 1)),
    CONSTRAINT ticket_number_counters_year_check CHECK ((year >= 2000))
);


ALTER TABLE public.ticket_number_counters OWNER TO postgres;

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
    priority character varying(20) DEFAULT 'MEDIUM'::character varying CONSTRAINT tickets_priority_not_null1 NOT NULL,
    status character varying(20) DEFAULT 'OPEN'::character varying CONSTRAINT tickets_status_not_null1 NOT NULL,
    requester_user_id uuid NOT NULL,
    created_by_user_id uuid NOT NULL,
    organization_id uuid NOT NULL,
    department_id uuid NOT NULL,
    resolution_note text,
    assigned_at timestamp with time zone,
    resolved_at timestamp with time zone,
    closed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP CONSTRAINT tickets_created_at_not_null1 NOT NULL,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP CONSTRAINT tickets_updated_at_not_null1 NOT NULL,
    contact_id uuid,
    assigned_user_id uuid,
    service_type character varying(100),
    category character varying(100),
    problem_statement text,
    employee_current_office_name_id character varying(100),
    employee_id character varying(100),
    current_bill_status character varying(100),
    bill_reference_no character varying(100),
    severity character varying(50),
    expected_resolution_date date,
    duplicate_ticket character varying(255),
    issue_category character varying(100),
    letter_no character varying(100),
    dependency_category character varying(100),
    initial_diagnosis text,
    solution text,
    resolution text,
    CONSTRAINT tickets_assigned_at_check CHECK (((assigned_at IS NULL) OR (assigned_user_id IS NOT NULL))),
    CONSTRAINT tickets_closed_at_check CHECK (((closed_at IS NULL) OR ((status)::text = 'CLOSED'::text))),
    CONSTRAINT tickets_created_at_not_null CHECK ((created_at IS NOT NULL)),
    CONSTRAINT tickets_created_by_not_null CHECK ((created_by_user_id IS NOT NULL)),
    CONSTRAINT tickets_department_not_null CHECK ((department_id IS NOT NULL)),
    CONSTRAINT tickets_description_not_blank CHECK ((length(btrim(description)) > 0)),
    CONSTRAINT tickets_description_not_null CHECK ((description IS NOT NULL)),
    CONSTRAINT tickets_id_not_null CHECK ((id IS NOT NULL)),
    CONSTRAINT tickets_organization_not_null CHECK ((organization_id IS NOT NULL)),
    CONSTRAINT tickets_priority_check CHECK (((priority)::text = ANY ((ARRAY['LOW'::character varying, 'MEDIUM'::character varying, 'HIGH'::character varying, 'CRITICAL'::character varying])::text[]))),
    CONSTRAINT tickets_priority_not_null CHECK ((priority IS NOT NULL)),
    CONSTRAINT tickets_requester_not_null CHECK ((requester_user_id IS NOT NULL)),
    CONSTRAINT tickets_resolved_at_check CHECK (((resolved_at IS NULL) OR ((status)::text = ANY ((ARRAY['RESOLVED'::character varying, 'CLOSED'::character varying])::text[])))),
    CONSTRAINT tickets_status_check CHECK (((status)::text = ANY ((ARRAY['OPEN'::character varying, 'IN_PROGRESS'::character varying, 'WAIT_FOR_RESPONSE'::character varying, 'CLOSED'::character varying])::text[]))),
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
    first_name character varying(100),
    last_name character varying(100),
    mobile_phone character varying(30),
    employee_code character varying(100),
    designation character varying(150),
    organization_id uuid,
    phone character varying(30),
    department_id uuid,
    CONSTRAINT users_failed_login_attempts_check CHECK ((failed_login_attempts >= 0)),
    CONSTRAINT users_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'active'::character varying, 'inactive'::character varying, 'suspended'::character varying, 'locked'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: COLUMN users.first_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.first_name IS 'User profile first name.';


--
-- Name: COLUMN users.last_name; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.last_name IS 'User profile last name.';


--
-- Name: COLUMN users.designation; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.designation IS 'Business/job designation.';


--
-- Name: COLUMN users.organization_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.organization_id IS 'Optional organization assignment.';


--
-- Name: COLUMN users.phone; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.phone IS 'Primary user contact phone number.';


--
-- Name: COLUMN users.department_id; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.users.department_id IS 'Optional department assignment.';


--
-- Name: contacts contacts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_pkey PRIMARY KEY (id);


--
-- Name: default_role_permissions default_role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.default_role_permissions
    ADD CONSTRAINT default_role_permissions_pkey PRIMARY KEY (permission_id);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


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
-- Name: ticket_attachments ticket_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_attachments
    ADD CONSTRAINT ticket_attachments_pkey PRIMARY KEY (id);


--
-- Name: ticket_comments ticket_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_comments
    ADD CONSTRAINT ticket_comments_pkey PRIMARY KEY (id);


--
-- Name: ticket_lifecycle_events ticket_lifecycle_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_lifecycle_events
    ADD CONSTRAINT ticket_lifecycle_events_pkey PRIMARY KEY (id);


--
-- Name: ticket_number_counters ticket_number_counters_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_number_counters
    ADD CONSTRAINT ticket_number_counters_pkey PRIMARY KEY (year);


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
-- Name: contacts_department_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX contacts_department_idx ON public.contacts USING btree (department_id);


--
-- Name: contacts_mobile_phone_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX contacts_mobile_phone_idx ON public.contacts USING btree (mobile_phone);


--
-- Name: contacts_organization_mobile_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX contacts_organization_mobile_unique_idx ON public.contacts USING btree (organization_id, mobile_phone);


--
-- Name: default_role_permissions_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX default_role_permissions_created_at_idx ON public.default_role_permissions USING btree (created_at);


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
-- Name: roles_immutable_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX roles_immutable_idx ON public.roles USING btree (is_immutable) WHERE (is_immutable = true);


--
-- Name: roles_name_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX roles_name_unique_idx ON public.roles USING btree (name);


--
-- Name: roles_system_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX roles_system_idx ON public.roles USING btree (is_system);


--
-- Name: ticket_attachments_ticket_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ticket_attachments_ticket_idx ON public.ticket_attachments USING btree (ticket_id, created_at DESC);


--
-- Name: ticket_attachments_user_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ticket_attachments_user_idx ON public.ticket_attachments USING btree (user_id);


--
-- Name: ticket_comments_ticket_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ticket_comments_ticket_idx ON public.ticket_comments USING btree (ticket_id, created_at DESC);


--
-- Name: ticket_comments_user_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ticket_comments_user_idx ON public.ticket_comments USING btree (user_id);


--
-- Name: ticket_lifecycle_events_actor_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ticket_lifecycle_events_actor_idx ON public.ticket_lifecycle_events USING btree (actor_user_id);


--
-- Name: ticket_lifecycle_events_created_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ticket_lifecycle_events_created_at_idx ON public.ticket_lifecycle_events USING btree (created_at DESC);


--
-- Name: ticket_lifecycle_events_ticket_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ticket_lifecycle_events_ticket_idx ON public.ticket_lifecycle_events USING btree (ticket_id, created_at DESC);


--
-- Name: ticket_lifecycle_events_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX ticket_lifecycle_events_type_idx ON public.ticket_lifecycle_events USING btree (event_type, event_action);


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
-- Name: tickets_expected_resolution_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tickets_expected_resolution_date_idx ON public.tickets USING btree (expected_resolution_date);


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
-- Name: tickets_ticket_number_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX tickets_ticket_number_unique_idx ON public.tickets USING btree (ticket_number);


--
-- Name: user_roles_role_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_roles_role_id_idx ON public.user_roles USING btree (role_id);


--
-- Name: user_roles_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_roles_role_idx ON public.user_roles USING btree (role_id);


--
-- Name: user_roles_user_id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX user_roles_user_id_idx ON public.user_roles USING btree (user_id);


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
-- Name: users_department_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_department_idx ON public.users USING btree (department_id);


--
-- Name: users_designation_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_designation_idx ON public.users USING btree (designation);


--
-- Name: users_email_unique_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_unique_idx ON public.users USING btree (lower((email)::text));


--
-- Name: users_employee_code_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_employee_code_idx ON public.users USING btree (employee_code);


--
-- Name: users_last_login_at_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_last_login_at_idx ON public.users USING btree (last_login_at);


--
-- Name: users_locked_until_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_locked_until_idx ON public.users USING btree (locked_until) WHERE (locked_until IS NOT NULL);


--
-- Name: users_mobile_phone_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_mobile_phone_idx ON public.users USING btree (mobile_phone);


--
-- Name: users_organization_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX users_organization_idx ON public.users USING btree (organization_id);


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
-- Name: organizations organizations_set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER organizations_set_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE FUNCTION public.set_organizations_updated_at();


--
-- Name: permissions permissions_set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER permissions_set_updated_at BEFORE UPDATE ON public.permissions FOR EACH ROW EXECUTE FUNCTION public.set_permissions_updated_at();


--
-- Name: roles roles_prevent_immutable_downgrade; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER roles_prevent_immutable_downgrade BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.prevent_immutable_role_downgrade();


--
-- Name: roles roles_protect_system_roles; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER roles_protect_system_roles BEFORE INSERT OR DELETE OR UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.protect_system_role_identity();


--
-- Name: roles roles_set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER roles_set_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.set_roles_updated_at();


--
-- Name: ticket_attachments ticket_attachments_set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER ticket_attachments_set_updated_at BEFORE UPDATE ON public.ticket_attachments FOR EACH ROW EXECUTE FUNCTION public.set_ticket_attachments_updated_at();


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

CREATE TRIGGER user_roles_protect_singleton_system_assignments BEFORE INSERT OR DELETE OR UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.protect_system_role_assignment();


--
-- Name: users users_protect_system_identity; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER users_protect_system_identity BEFORE DELETE OR UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.protect_system_identity_user();


--
-- Name: users users_set_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.set_users_updated_at();


--
-- Name: contacts contacts_department_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_department_fk FOREIGN KEY (department_id) REFERENCES public.departments(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: contacts contacts_organization_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.contacts
    ADD CONSTRAINT contacts_organization_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: default_role_permissions default_role_permissions_permission_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.default_role_permissions
    ADD CONSTRAINT default_role_permissions_permission_fk FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


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
-- Name: ticket_attachments ticket_attachments_ticket_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_attachments
    ADD CONSTRAINT ticket_attachments_ticket_fk FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ticket_attachments ticket_attachments_user_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_attachments
    ADD CONSTRAINT ticket_attachments_user_fk FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


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
-- Name: ticket_lifecycle_events ticket_lifecycle_events_actor_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_lifecycle_events
    ADD CONSTRAINT ticket_lifecycle_events_actor_fk FOREIGN KEY (actor_user_id) REFERENCES public.users(id) ON DELETE RESTRICT;


--
-- Name: ticket_lifecycle_events ticket_lifecycle_events_ticket_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ticket_lifecycle_events
    ADD CONSTRAINT ticket_lifecycle_events_ticket_fk FOREIGN KEY (ticket_id) REFERENCES public.tickets(id) ON DELETE CASCADE;


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
-- Name: users users_department_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_fk FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE RESTRICT;


--
-- Name: users users_organization_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_organization_fk FOREIGN KEY (organization_id) REFERENCES public.organizations(id) ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--

\unrestrict 1OsyN7S6mESBfICGy16i2xAfHpgVkyiSL3YvLwMCFItZlGp4i96jAL4b7mEh2FG

