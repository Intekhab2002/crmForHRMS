import{randomUUID as U}from"node:crypto";import G from"dotenv";import W from"node:path";G.config({path:W.resolve(process.cwd(),".env")});var X=["NODE_ENV","PORT","DB_HOST","DB_PORT","DB_NAME","DB_USER","DB_PASSWORD","JWT_SECRET","COOKIE_SECRET","CORS_ALLOWED_ORIGINS","HOST"],L=Object.freeze(["development","production","test"]),T=(e,t)=>{let r=Number(e);if(Number.isNaN(r))throw new Error(`${t} must be a valid number.`);return r},R=(e,t,r)=>e===void 0||e===""?r:T(e,t),Q=e=>{e.forEach(t=>{if(!process.env[t])throw new Error(`Missing required environment variable: ${t}`)})};Q(X);if(!L.includes(process.env.NODE_ENV))throw new Error(`Invalid NODE_ENV: ${process.env.NODE_ENV}. Allowed values: ${L.join(", ")}`);var K=Object.freeze({app:Object.freeze({name:process.env.APP_NAME,version:process.env.APP_VERSION,environment:process.env.NODE_ENV}),cookies:Object.freeze({secret:process.env.COOKIE_SECRET,secure:process.env.COOKIE_SECURE==="true",sameSite:process.env.COOKIE_SAMESITE}),server:Object.freeze({host:process.env.HOST,port:T(process.env.PORT,"PORT"),trustProxy:process.env.TRUST_PROXY==="true"?!0:process.env.TRUST_PROXY==="false"?!1:Number.isInteger(Number(process.env.TRUST_PROXY))?Number(process.env.TRUST_PROXY):process.env.TRUST_PROXY}),database:Object.freeze({host:process.env.DB_HOST,port:T(process.env.DB_PORT,"DB_PORT"),database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD,maxConnections:R(process.env.DB_MAX_CONNECTIONS,"DB_MAX_CONNECTIONS",20),idleTimeout:R(process.env.DB_IDLE_TIMEOUT,"DB_IDLE_TIMEOUT",3e4),connectionTimeout:R(process.env.DB_CONNECTION_TIMEOUT,"DB_CONNECTION_TIMEOUT",3e4),dbSlowQueryThreshold:R(process.env.DB_SLOW_QUERY_THRESHOLD,"DB_SLOW_QUERY_THRESHOLD",2e3),connectionRetries:R(process.env.DB_CONNECTION_RETRIES,"DB_CONNECTION_RETRIES",5),connectionRetryDelay:R(process.env.DB_CONNECTION_RETRY_DELAY,"DB_CONNECTION_RETRY_DELAY",1e3)}),jwt:Object.freeze({secret:process.env.JWT_SECRET,expiresIn:process.env.JWT_EXPIRES_IN,refreshExpiresIn:process.env.JWT_REFRESH_EXPIRES_IN}),logging:Object.freeze({level:process.env.LOG_LEVEL,maxSize:process.env.LOG_MAX_SIZE,maxFiles:process.env.LOG_MAX_FILES,zippedArchive:process.env.LOG_ZIPPED_ARCHIVE==="true",logDirectory:process.env.LOG_DIRECTORY}),security:Object.freeze({bcryptSaltRounds:T(process.env.BCRYPT_SALT_ROUNDS,"BCRYPT_SALT_ROUNDS"),rateLimitWindow:T(process.env.RATE_LIMIT_WINDOW,"RATE_LIMIT_WINDOW"),rateLimitMaxRequests:T(process.env.RATE_LIMIT_MAX_REQUESTS,"RATE_LIMIT_MAX_REQUESTS"),rateLimitAuthWindow:T(process.env.RATE_LIMIT_AUTH_WINDOW,"RATE_LIMIT_AUTH_WINDOW"),rateLimitAuthMaxRequests:T(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS,"RATE_LIMIT_AUTH_MAX_REQUESTS")}),compression:Object.freeze({threshold:process.env.COMPRESSION_THRESHOLD??"1kb"}),features:Object.freeze({swagger:process.env.ENABLE_SWAGGER==="true",requestLogging:process.env.ENABLE_REQUEST_LOGGING==="true"}),http:Object.freeze({jsonLimit:process.env.JSON_LIMIT??"1mb",urlEncodedLimit:process.env.URLENCODED_LIMIT??"1mb",corsAllowedOrigins:process.env.CORS_ALLOWED_ORIGINS.split(",").map(e=>e.trim()).filter(Boolean),corsCredentials:process.env.CORS_CREDENTIALS==="true",parameterLimit:T(process.env.PARAMETER_LIMIT,"PARAMETER_LIMIT"),apiPrefix:process.env.API_PREFIX,apiVersion:process.env.API_VERSION}),seeding:Object.freeze({developerUsername:process.env.SEED_DEVELOPER_USERNAME,developerEmail:process.env.SEED_DEVELOPER_EMAIL,developerPassword:process.env.SEED_DEVELOPER_PASSWORD,defaultOrganizationCode:process.env.DEFAULT_ORGANIZATION_CODE,defaultOrganizationName:process.env.DEFAULT_ORGANIZATION_NAME,defaultOrganizationStatus:process.env.DEFAULT_ORGANIZATION_STATUS}),ssl:Object.freeze({enabled:process.env.DB_SSL==="true",rejectUnauthorized:process.env.DB_SSL_REJECT_UNAUTHORIZED==="true",ca:process.env.DB_SSL_CA?.trim()||null})}),E=K;var Z=Object.freeze({app:E.app,server:E.server,database:E.database,jwt:E.jwt,logging:E.logging,http:E.http,cookies:E.cookies,compression:E.compression,security:E.security,features:E.features,seeding:E.seeding,ssl:E.ssl}),o=Z;import{Pool as re}from"pg";import{performance as I}from"node:perf_hooks";import oe from"p-retry";import N from"node:fs";import _ from"node:path";import p from"winston";import w from"winston-daily-rotate-file";var O=_.resolve(o.logging.logDirectory||_.join(process.cwd(),"logs")),J=["combined","error","http","exceptions","rejections"];N.existsSync(O)||N.mkdirSync(O);J.forEach(e=>{let t=_.join(O,e);N.existsSync(t)||N.mkdirSync(t,{recursive:!0})});var v={levels:{error:0,warn:1,info:2,http:3,verbose:4,debug:5},colors:{error:"red",warn:"yellow",info:"green",http:"magenta",verbose:"cyan",debug:"blue"}};p.addColors(v.colors);var D=p.format.combine(p.format.timestamp(),p.format.errors({stack:!0}),p.format.metadata({fillExcept:["message","level","timestamp","label"]}),p.format.json()),ee=p.format.combine(p.format.colorize(),p.format.timestamp({format:"YYYY-MM-DD HH:mm:ss"}),p.format.printf(({timestamp:e,level:t,message:r,stack:s})=>`${e} ${t}: ${s||r}`)),te=[new p.transports.Console({format:ee}),new w({dirname:_.join(O,"combined"),filename:"%DATE%.log",datePattern:"YYYY-MM-DD",maxSize:o.logging.maxSize,maxFiles:o.logging.maxFiles,zippedArchive:o.logging.zippedArchive==="true",level:o.logging.level,format:D}),new w({dirname:_.join(O,"error"),filename:"%DATE%.log",datePattern:"YYYY-MM-DD",level:"error",maxSize:o.logging.maxSize,maxFiles:o.logging.maxFiles,zippedArchive:o.logging.zippedArchive==="true",format:D}),new w({dirname:_.join(O,"http"),filename:"%DATE%.log",datePattern:"YYYY-MM-DD",level:"http",maxSize:o.logging.maxSize,maxFiles:o.logging.maxFiles,zippedArchive:o.logging.zippedArchive==="true",format:D})],C=p.createLogger({levels:v.levels,level:o.logging.level,transports:te,exitOnError:!1,exceptionHandlers:[new w({dirname:_.join(O,"exceptions"),filename:"%DATE%.log",datePattern:"YYYY-MM-DD",format:D})],rejectionHandlers:[new w({dirname:_.join(O,"rejections"),filename:"%DATE%.log",datePattern:"YYYY-MM-DD",format:D})]});C.stream={write(e){C.http(e.trim())}};var n=C;var se={host:o.database.host,port:o.database.port,database:o.database.database,user:o.database.user,password:o.database.password,max:o.database.maxConnections,idleTimeoutMillis:o.database.idleTimeout,connectionTimeoutMillis:o.database.connectionTimeout,allowExitOnIdle:!1,keepAlive:!0,application_name:o.app.name,slowQueryThreshold:o.database.dbSlowQueryThreshold,ssl:o.ssl.enabled?{rejectUnauthorized:o.ssl.rejectUnauthorized,...o.ssl.ca?{ca:o.ssl.ca}:{}}:!1},l=new re(se);Object.defineProperty(l,"name",{value:"CRM PostgreSQL Pool",writable:!1});l.on("connect",e=>{n.info("New PostgreSQL client connected.",{processId:e.processID})});l.on("acquire",()=>{n.debug("Database client acquired from pool.")});l.on("remove",()=>{n.debug("Database client removed from pool.")});l.on("error",e=>{n.error("Unexpected PostgreSQL pool error.",{error:e.message,stack:e.stack})});async function ne(){let e=I.now();try{return await oe(async()=>{let t=await l.connect();try{let r=await t.query(`
                        SELECT
                            version() AS version,
                            current_database() AS database,
                            current_user AS "user";
                    `),s=I.now()-e;n.info("PostgreSQL connected successfully.",{database:r.rows[0].database,user:r.rows[0].user,version:r.rows[0].version,connectionTime:`${s.toFixed(2)} ms`})}finally{t.release()}},{retries:o.database.connectionRetries,minTimeout:o.database.connectionRetryDelay,factor:1,onFailedAttempt:t=>{n.warn("Unable to connect to PostgreSQL.",{attempt:t.attemptNumber,retriesLeft:t.retriesLeft,message:t.message})}}),!0}catch(t){throw n.error("PostgreSQL startup failed.",{error:t.message,stack:t.stack}),t}}async function ae(e,t=[]){let r=I.now();try{let s=await l.query(e,t),i=I.now()-r;return n.debug("Database query executed.",{duration:`${i.toFixed(2)} ms`,rowCount:s.rowCount}),i>=o.database.slowQueryThreshold&&n.warn("Slow database query detected.",{duration:`${i.toFixed(2)} ms`,threshold:`${o.database.slowQueryThreshold} ms`,rowCount:s.rowCount,query:e,parameters:t}),s}catch(s){throw n.error("Database query failed.",{query:e,parameters:t,error:s.message,stack:s.stack}),s}}async function ie(){try{let e=await l.connect();return n.debug("Transaction client acquired.",{processId:e.processID}),e}catch(e){throw n.error("Failed to acquire transaction client.",{error:e.message,stack:e.stack}),e}}async function ce(){let e=I.now();try{return await l.query("SELECT 1"),{status:"UP",responseTime:`${(I.now()-e).toFixed(2)} ms`,database:o.database.database,pool:{max:l.options.max,total:l.totalCount,idle:l.idleCount,waiting:l.waitingCount},timestamp:new Date().toISOString()}}catch(t){return n.error("Database health check failed.",{error:t.message,stack:t.stack}),{status:"DOWN",error:t.message,timestamp:new Date().toISOString()}}}async function de(){try{n.info("Closing PostgreSQL connection pool..."),await l.end(),n.info("PostgreSQL connection pool closed successfully.")}catch(e){throw n.error("Failed to close PostgreSQL connection pool.",{error:e.message,stack:e.stack}),e}}var le=Object.freeze({pool:l,initialize:ne,query:ae,getClient:ie,healthCheck:ce,close:de}),S=le;import{randomUUID as Ee}from"node:crypto";var pe="TX",y=Object.freeze({READ_COMMITTED:"READ COMMITTED",REPEATABLE_READ:"REPEATABLE READ",SERIALIZABLE:"SERIALIZABLE"}),z=y.READ_COMMITTED,me=3,ue=25,Te=Object.freeze(new Set(["40001","40P01"])),_e=()=>{let e=new Date().toISOString().slice(0,10).replaceAll("-",""),t=Ee().split("-")[0].toUpperCase();return`${pe}-${e}-${t}`},P=e=>{if(!Object.values(y).includes(e))throw new TypeError(`Unsupported transaction isolation level: ${e}`)},Oe=e=>{if(!Number.isInteger(e)||e<0||e>10)throw new TypeError("Transaction maxRetries must be an integer between 0 and 10.")},h=e=>Number(process.hrtime.bigint()-e)/1e6,Se=e=>new Promise(t=>setTimeout(t,e)),fe=e=>{let t=ue*2**e,r=Math.floor(Math.random()*25);return t+r},Ae=e=>Te.has(e?.code),M=async(e,{transactionId:t,isolationLevel:r=z}={})=>{if(!e)throw new TypeError("PostgreSQL client is required to begin a transaction.");P(r),await e.query(`BEGIN ISOLATION LEVEL ${r}`),n.debug("Database transaction started.",{transactionId:t,isolationLevel:r})},j=async(e,{transactionId:t}={})=>{if(!e)throw new TypeError("PostgreSQL client is required to commit a transaction.");await e.query("COMMIT"),n.debug("Database transaction committed.",{transactionId:t})},H=async(e,{transactionId:t}={})=>{if(!e)throw new TypeError("PostgreSQL client is required to rollback a transaction.");await e.query("ROLLBACK"),n.warn("Database transaction rolled back.",{transactionId:t})},Re=async(e,t)=>{let r=_e(),s=new Date,i=process.hrtime.bigint(),a=null,u=!1;try{a=await S.getClient(),await M(a,{transactionId:r,isolationLevel:t}),u=!0;let d=Object.freeze({client:a,transactionId:r,startedAt:s,isolationLevel:t}),A=await e(d);await j(a,{transactionId:r}),u=!1;let c=h(i);return n.info("Database transaction completed.",{transactionId:r,isolationLevel:t,durationMs:Number(c.toFixed(2)),status:"committed"}),A}catch(d){if(a&&u)try{await H(a,{transactionId:r}),u=!1}catch(c){n.error("Database transaction rollback failed.",{transactionId:r,originalError:{name:d.name,message:d.message,code:d.code},rollbackError:{name:c.name,message:c.message,code:c.code,stack:c.stack}})}let A=h(i);throw n.error("Database transaction failed.",{transactionId:r,isolationLevel:t,durationMs:Number(A.toFixed(2)),status:"failed",error:{name:d.name,message:d.message,code:d.code,stack:d.stack}}),d}finally{a&&(a.release(),n.debug("Database transaction client released.",{transactionId:r}))}},b=async(e,{isolationLevel:t=z,maxRetries:r=me}={})=>{if(typeof e!="function")throw new TypeError("Transaction callback must be a function.");P(t),Oe(r);let s=0;for(;;)try{return await Re(e,t)}catch(i){if(!Ae(i)||s>=r)throw i;let a=fe(s);n.warn("Retrying transient database transaction failure.",{errorCode:i.code,retryAttempt:s+1,maxRetries:r,delayMs:a,isolationLevel:t}),s+=1,await Se(a)}},mt=Object.freeze({beginTransaction:M,commitTransaction:j,rollbackTransaction:H,executeTransaction:b});var x=(e=null)=>{if(e==null)return S;if(!e.client||typeof e.client.query!="function")throw new TypeError("Invalid transaction context supplied to repository.");return e.client};import k from"bcryptjs";var Ie=()=>{let e=o?.security?.bcryptSaltRounds;if(!Number.isInteger(e)||e<10||e>31)throw new Error("Invalid bcrypt salt-round configuration.");return e};async function we(e){if(typeof e!="string")throw new TypeError("Password must be a string.");if(e.length===0)throw new Error("Password cannot be empty.");return k.hash(e,Ie())}async function De(e,t){if(typeof e!="string")throw new TypeError("Password must be a string.");if(typeof t!="string")throw new TypeError("Password hash must be a string.");return e.length===0||t.length===0?!1:k.compare(e,t)}var ge=Object.freeze({hashPassword:we,verifyPassword:De}),F=ge;var Ne=Object.freeze({ACCESS:"access",REFRESH:"refresh"}),Ce=Object.freeze({PENDING:"pending",ACTIVE:"active",INACTIVE:"inactive",SUSPENDED:"suspended",LOCKED:"locked"}),be=Object.freeze({MAX_FAILED_ATTEMPTS:5,LOCK_DURATION_MINUTES:15}),Ue=Object.freeze({SINGLE_ACTIVE_SESSION:!0,ROTATE_REFRESH_TOKEN:!0}),Le=Object.freeze({INVALID_CREDENTIALS:"AUTH_INVALID_CREDENTIALS",ACCOUNT_PENDING:"AUTH_ACCOUNT_PENDING",ACCOUNT_INACTIVE:"AUTH_ACCOUNT_INACTIVE",ACCOUNT_SUSPENDED:"AUTH_ACCOUNT_SUSPENDED",ACCOUNT_LOCKED:"AUTH_ACCOUNT_LOCKED",ACCOUNT_DEACTIVATED:"AUTH_ACCOUNT_DEACTIVATED",INVALID_ACCESS_TOKEN:"AUTH_INVALID_ACCESS_TOKEN",ACCESS_TOKEN_EXPIRED:"AUTH_ACCESS_TOKEN_EXPIRED",INVALID_REFRESH_TOKEN:"AUTH_INVALID_REFRESH_TOKEN",REFRESH_TOKEN_EXPIRED:"AUTH_REFRESH_TOKEN_EXPIRED",SESSION_NOT_FOUND:"AUTH_SESSION_NOT_FOUND",SESSION_REVOKED:"AUTH_SESSION_REVOKED",SESSION_EXPIRED:"AUTH_SESSION_EXPIRED",SESSION_MISMATCH:"AUTH_SESSION_MISMATCH",AUTHENTICATION_REQUIRED:"AUTHENTICATION_REQUIRED",INVALID_AUTHENTICATION_STATE:"AUTH_INVALID_STATE",ACCESS_TOKEN_REQUIRED:"AUTH_ACCESS_TOKEN_REQUIRED"}),ve=Object.freeze({LOGIN_SUCCESS:"AUTH_LOGIN_SUCCESS",REFRESH_SUCCESS:"AUTH_REFRESH_SUCCESS",LOGOUT_SUCCESS:"AUTH_LOGOUT_SUCCESS",SESSION_VALID:"AUTH_SESSION_VALID"}),he=Object.freeze({ROOT:"/auth",LOGIN:"/login",REFRESH:"/refresh",LOGOUT:"/logout",ME:"/me"}),ye=Object.freeze({AUTHORIZATION:"authorization",BEARER_PREFIX:"Bearer"}),ze=Object.freeze({USER_AGENT_MAX_LENGTH:1e3,IP_ADDRESS_MAX_LENGTH:45}),Pe=Object.freeze({JWT:"jwt",PASSWORD:"password"}),Me=Object.freeze({AUTH_TOKEN_TYPES:Ne,AUTH_ACCOUNT_STATUS:Ce,AUTH_LOGIN_POLICY:be,AUTH_SESSION_POLICY:Ue,AUTH_ERROR_CODES:Le,AUTH_SUCCESS_CODES:ve,AUTH_ROUTES:he,AUTH_HEADERS:ye,AUTH_SESSION_METADATA_LIMITS:ze,AUTH_CONFIG_KEYS:Pe}),V=Me;var{AUTH_ACCOUNT_STATUS:$}=V,g=Object.freeze([Object.freeze({code:"developer",name:"Developer",description:"Protected highest-authority system role used for system administration, bootstrap and recovery."}),Object.freeze({code:"superadmin",name:"Super Administrator",description:"Protected application administrator role managed by the Developer."})]),f=Object.freeze([Object.freeze({code:"user:read",name:"Read Users",description:"View user records.",resource:"user",action:"read"}),Object.freeze({code:"user:create",name:"Create Users",description:"Create new users.",resource:"user",action:"create"}),Object.freeze({code:"user:update",name:"Update Users",description:"Update existing users.",resource:"user",action:"update"}),Object.freeze({code:"user:delete",name:"Delete Users",description:"Delete users where permitted by business rules.",resource:"user",action:"delete"}),Object.freeze({code:"role:read",name:"Read Roles",description:"View roles.",resource:"role",action:"read"}),Object.freeze({code:"role:create",name:"Create Roles",description:"Create normal application roles.",resource:"role",action:"create"}),Object.freeze({code:"role:update",name:"Update Roles",description:"Update normal application roles.",resource:"role",action:"update"}),Object.freeze({code:"role:delete",name:"Delete Roles",description:"Delete normal application roles where permitted.",resource:"role",action:"delete"}),Object.freeze({code:"permission:read",name:"Read Permissions",description:"View permissions.",resource:"permission",action:"read"}),Object.freeze({code:"permission:create",name:"Create Permissions",description:"Create application permissions where permitted.",resource:"permission",action:"create"}),Object.freeze({code:"permission:update",name:"Update Permissions",description:"Update application permissions where permitted.",resource:"permission",action:"update"}),Object.freeze({code:"permission:delete",name:"Delete Permissions",description:"Delete application permissions where permitted.",resource:"permission",action:"delete"}),Object.freeze({code:"organization:read",name:"Read Organizations",description:"View organization records.",resource:"organization",action:"read"}),Object.freeze({code:"organization:create",name:"Create Organizations",description:"Create organizations.",resource:"organization",action:"create"}),Object.freeze({code:"organization:update",name:"Update Organizations",description:"Update organization records.",resource:"organization",action:"update"}),Object.freeze({code:"organization:delete",name:"Delete Organizations",description:"Deactivate organizations where permitted.",resource:"organization",action:"delete"}),Object.freeze({code:"ticket:read",name:"Read Tickets",description:"View tickets.",resource:"ticket",action:"read"}),Object.freeze({code:"ticket:create",name:"Create Tickets",description:"Create tickets.",resource:"ticket",action:"create"}),Object.freeze({code:"ticket:update",name:"Update Tickets",description:"Update tickets.",resource:"ticket",action:"update"}),Object.freeze({code:"ticket:assign",name:"Assign Tickets",description:"Assign and reassign tickets.",resource:"ticket",action:"assign"}),Object.freeze({code:"ticket:comment",name:"Comment on Tickets",description:"Add comments to tickets.",resource:"ticket",action:"comment"}),Object.freeze({code:"ticket:attachment",name:"Manage Ticket Attachments",description:"Upload, view, download, and delete ticket attachments.",resource:"ticket",action:"attachment"}),Object.freeze({code:"ticket:resolve",name:"Resolve Tickets",description:"Resolve tickets.",resource:"ticket",action:"resolve"}),Object.freeze({code:"ticket:close",name:"Close Tickets",description:"Close tickets.",resource:"ticket",action:"close"}),Object.freeze({code:"option:read",name:"Read Options",description:"View configurable select options.",resource:"option",action:"read"}),Object.freeze({code:"option:create",name:"Create Options",description:"Create configurable select options.",resource:"option",action:"create"}),Object.freeze({code:"option:update",name:"Update Options",description:"Update configurable select options.",resource:"option",action:"update"}),Object.freeze({code:"option:delete",name:"Delete Options",description:"Deactivate configurable select options.",resource:"option",action:"delete"}),Object.freeze({code:"sla:read",name:"Read SLA",description:"View SLA configuration and information.",resource:"sla",action:"read"}),Object.freeze({code:"sla:create",name:"Create SLA",description:"Create SLA policies.",resource:"sla",action:"create"}),Object.freeze({code:"sla:update",name:"Update SLA",description:"Update SLA policies.",resource:"sla",action:"update"}),Object.freeze({code:"sla:delete",name:"Delete SLA",description:"Delete SLA policies where permitted.",resource:"sla",action:"delete"}),Object.freeze({code:"dashboard:read",name:"Read Dashboard",description:"View role-authorized dashboards.",resource:"dashboard",action:"read"})]),B=Object.freeze(f.map(({code:e})=>e)),Y=Object.freeze(f.map(({code:e})=>e));function je(){let e=o.seeding?.developerUsername?.trim(),t=o.seeding?.developerEmail?.trim(),r=o.seeding?.developerPassword,s=o.seeding?.defaultOrganizationCode?.trim(),i=o.seeding?.defaultOrganizationName?.trim(),a=o.seeding?.defaultOrganizationStatus?.trim();if(!e)throw new Error("SEED_DEVELOPER_USERNAME is required.");if(!t)throw new Error("SEED_DEVELOPER_EMAIL is required.");if(!r)throw new Error("SEED_DEVELOPER_PASSWORD is required.");if(r.length<12)throw new Error("SEED_DEVELOPER_PASSWORD must contain at least 12 characters.");if(!s)throw new Error("DEFAULT_ORGANIZATION_CODE is required.");if(!i)throw new Error("DEFAULT_ORGANIZATION_NAME is required.");if(!a)throw new Error("DEFAULT_ORGANIZATION_STATUS is required.");if(!["active","inactive"].includes(a))throw new Error("DEFAULT_ORGANIZATION_STATUS must be either 'active' or 'inactive'.");return Object.freeze({username:e,email:t,password:r,defaultOrganizationCode:s,defaultOrganizationName:i,defaultOrganizationStatus:a})}function He(){if(o.app.environment!=="development"&&o.app.environment!=="production")throw new Error("RBAC bootstrap seeder can only run in development or production environments.")}function xe(){let e=new Set(g.map(({code:r})=>r));if(e.size!==g.length)throw new Error("Duplicate system role code detected.");if(!e.has("developer")||!e.has("superadmin"))throw new Error("Developer and Super Admin system roles are mandatory.");if(g.length!==2)throw new Error("Bootstrap seeder must contain exactly two system roles.");let t=new Set(f.map(({code:r})=>r));if(t.size!==f.length)throw new Error("Duplicate system permission code detected.");for(let r of f)if(r.code!==`${r.resource}:${r.action}`)throw new Error(`Permission code/resource/action mismatch: ${r.code}`);for(let r of B)if(!t.has(r))throw new Error(`Unknown Super Admin permission: ${r}`);for(let r of Y)if(!t.has(r))throw new Error(`Unknown Developer permission: ${r}`)}async function ke(e,t){let r=await e.query(`
            SELECT
                id,
                code,
                name,
                description,
                is_system,
                is_immutable,
                is_active
            FROM roles
            WHERE code = $1
            LIMIT 1
        `,[t.code]);if(r.rowCount===0)return(await e.query(`
                INSERT INTO roles (
                    id,
                    code,
                    name,
                    description,
                    is_system,
                    is_immutable,
                    is_active
                )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4,
                    TRUE,
                    TRUE,
                    TRUE
                )
                RETURNING
                    id,
                    code,
                    name,
                    description,
                    is_system,
                    is_immutable,
                    is_active
            `,[U(),t.code,t.name,t.description])).rows[0];let s=r.rows[0];if(s.is_system!==!0||s.is_immutable!==!0||s.is_active!==!0)throw new Error(`Protected role '${t.code}' exists in an invalid state.`);if(s.name!==t.name)throw new Error(`Protected role '${t.code}' has an invalid name '${s.name}'.`);return s}async function Fe(e,t){return(await e.query(`
            INSERT INTO permissions (
                id,
                code,
                name,
                description,
                resource,
                action,
                is_system,
                is_active
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                $6,
                TRUE,
                TRUE
            )
            ON CONFLICT (code)
            DO UPDATE SET
                name = EXCLUDED.name,
                description = EXCLUDED.description,
                resource = EXCLUDED.resource,
                action = EXCLUDED.action,
                is_system = TRUE,
                is_active = TRUE,
                updated_at = CURRENT_TIMESTAMP
            RETURNING
                id,
                code,
                name,
                description,
                resource,
                action,
                is_system,
                is_active
        `,[U(),t.code,t.name,t.description,t.resource,t.action])).rows[0]}async function q(e,t,r){await e.query(`
            INSERT INTO role_permissions (
                role_id,
                permission_id
            )
            VALUES ($1, $2)
            ON CONFLICT (
                role_id,
                permission_id
            )
            DO NOTHING
        `,[t,r])}async function Ve(e,t){let r=await e.query(`
            SELECT
                id,
                username,
                email,
                password_hash,
                status,
                failed_login_attempts,
                locked_until,
                email_verified_at,
                password_changed_at,
                deactivated_at
            FROM users
            WHERE
                LOWER(username) = LOWER($1)
                OR LOWER(email) = LOWER($2)
            LIMIT 1
        `,[t.username,t.email]);if(r.rowCount>0){let a=r.rows[0];if(a.username.toLowerCase()!==t.username.toLowerCase()||a.email.toLowerCase()!==t.email.toLowerCase())throw new Error("Developer bootstrap username/email conflicts with an existing user.");if(a.status!==$.ACTIVE)throw new Error("Existing Developer bootstrap user is not active.");return a}let s=await F.hashPassword(t.password);return(await e.query(`
            INSERT INTO users (
                id,
                username,
                email,
                password_hash,
                status,
                failed_login_attempts,
                locked_until,
                email_verified_at,
                password_changed_at
            )
            VALUES (
                $1,
                $2,
                $3,
                $4,
                $5,
                0,
                NULL,
                NOW(),
                NOW()
            )
            RETURNING
                id,
                username,
                email,
                status,
                failed_login_attempts,
                locked_until,
                email_verified_at,
                password_changed_at,
                deactivated_at
        `,[U(),t.username,t.email,s,$.ACTIVE])).rows[0]}async function $e(e,t){return(await e.query(`
      INSERT INTO organizations (
        id,
        code,
        name,
        description,
        status
      )
      VALUES (
        gen_random_uuid(),
        $1,
        $2,
        $3,
        $4
      )
      ON CONFLICT (LOWER(code))
      DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        status = EXCLUDED.status
      RETURNING
        id,
        code,
        name,
        description,
        status;
    `,[t.defaultOrganizationCode,t.defaultOrganizationName,t.defaultOrganizationDescription??null,t.defaultOrganizationStatus])).rows[0]}async function qe(e,t,r){await e.query(`
            DELETE FROM user_roles
            WHERE user_id = $1
              AND role_id <> $2
        `,[t,r]),await e.query(`
            INSERT INTO user_roles (
                user_id,
                role_id
            )
            VALUES ($1, $2)
            ON CONFLICT (
                user_id,
                role_id
            )
            DO NOTHING
        `,[t,r])}async function Be(e,t,r,s){if((await e.query(`
                SELECT COUNT(*)::INTEGER AS count
                FROM user_roles ur
                INNER JOIN roles r
                    ON r.id = ur.role_id
                WHERE ur.user_id = $1
                  AND r.code = 'developer'
            `,[t.id])).rows[0].count!==1)throw new Error("Developer bootstrap role assignment validation failed.");if((await e.query(`
                SELECT COUNT(*)::INTEGER AS count
                FROM user_roles ur
                WHERE ur.role_id = $1
            `,[r.id])).rows[0].count!==1)throw new Error("Developer role must have exactly one assigned user.");if((await e.query(`
                SELECT COUNT(*)::INTEGER AS count
                FROM user_roles ur
                WHERE ur.role_id = $1
            `,[s.id])).rows[0].count!==0&&n.debug("Super Admin role already has a user assignment. Existing assignment will be preserved."),(await e.query(`
                SELECT COUNT(*)::INTEGER AS count
                FROM roles
                WHERE code IN (
                    'developer',
                    'superadmin'
                )
            `)).rows[0].count!==2)throw new Error("Developer and Super Admin system-role validation failed.");n.info("RBAC bootstrap state validated successfully.",{developerUserId:t.id,developerRoleId:r.id,superadminRoleId:s.id})}async function Ye(){He(),xe();let e=je();await S.initialize();try{await b(async t=>{let r=x(t);await r.query("SET LOCAL app.rbac_bootstrap = 'true'");let s=new Map;for(let c of g){let m=await ke(r,c);s.set(m.code,m)}let i=s.get("developer"),a=s.get("superadmin");if(!i||!a)throw new Error("Required system roles are unavailable.");let u=new Map;for(let c of f){let m=await Fe(r,c);u.set(m.code,m)}for(let c of Y){let m=u.get(c);if(!m)throw new Error(`Developer permission was not found: ${c}`);await q(r,i.id,m.id)}for(let c of B){let m=u.get(c);if(!m)throw new Error(`Super Admin permission was not found: ${c}`);await q(r,a.id,m.id)}let d=await Ve(r,e),A=await $e(r,e);n.info("Default organization ensured.",{organizationId:A.id,organizationCode:A.code}),await qe(r,d.id,i.id),await Be(r,d,i,a),n.info("Initial RBAC bootstrap completed.",{roleCount:g.length,permissionCount:f.length,developerUser:d.email,superadminUserCount:0})})}finally{await S.close()}}try{await Ye(),n.info("RBAC bootstrap seeder completed successfully.")}catch(e){n.error("RBAC bootstrap seeder failed.",{message:e.message,stack:e.stack}),process.exitCode=1}
