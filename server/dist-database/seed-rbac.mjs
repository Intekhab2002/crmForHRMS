import{randomUUID as C}from"node:crypto";import q from"dotenv";import W from"node:path";q.config({path:W.resolve(process.cwd(),".env")});var G=["NODE_ENV","PORT","DB_HOST","DB_PORT","DB_NAME","DB_USER","DB_PASSWORD","JWT_SECRET","COOKIE_SECRET","CORS_ALLOWED_ORIGINS","HOST"],U=Object.freeze(["development","production","test"]),_=(e,r)=>{let t=Number(e);if(Number.isNaN(t))throw new Error(`${r} must be a valid number.`);return t},R=(e,r,t)=>e===void 0||e===""?t:_(e,r),X=e=>{e.forEach(r=>{if(!process.env[r])throw new Error(`Missing required environment variable: ${r}`)})};X(G);if(!U.includes(process.env.NODE_ENV))throw new Error(`Invalid NODE_ENV: ${process.env.NODE_ENV}. Allowed values: ${U.join(", ")}`);var Q=Object.freeze({app:Object.freeze({name:process.env.APP_NAME,version:process.env.APP_VERSION,environment:process.env.NODE_ENV}),cookies:Object.freeze({secret:process.env.COOKIE_SECRET,secure:process.env.COOKIE_SECURE==="true",sameSite:process.env.COOKIE_SAMESITE}),server:Object.freeze({host:process.env.HOST,port:_(process.env.PORT,"PORT"),trustProxy:process.env.TRUST_PROXY==="true"?!0:process.env.TRUST_PROXY==="false"?!1:Number.isInteger(Number(process.env.TRUST_PROXY))?Number(process.env.TRUST_PROXY):process.env.TRUST_PROXY}),database:Object.freeze({host:process.env.DB_HOST,port:_(process.env.DB_PORT,"DB_PORT"),database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD,maxConnections:R(process.env.DB_MAX_CONNECTIONS,"DB_MAX_CONNECTIONS",20),idleTimeout:R(process.env.DB_IDLE_TIMEOUT,"DB_IDLE_TIMEOUT",3e4),connectionTimeout:R(process.env.DB_CONNECTION_TIMEOUT,"DB_CONNECTION_TIMEOUT",3e4),dbSlowQueryThreshold:R(process.env.DB_SLOW_QUERY_THRESHOLD,"DB_SLOW_QUERY_THRESHOLD",2e3),connectionRetries:R(process.env.DB_CONNECTION_RETRIES,"DB_CONNECTION_RETRIES",5),connectionRetryDelay:R(process.env.DB_CONNECTION_RETRY_DELAY,"DB_CONNECTION_RETRY_DELAY",1e3)}),jwt:Object.freeze({secret:process.env.JWT_SECRET,expiresIn:process.env.JWT_EXPIRES_IN,refreshExpiresIn:process.env.JWT_REFRESH_EXPIRES_IN}),logging:Object.freeze({level:process.env.LOG_LEVEL,maxSize:process.env.LOG_MAX_SIZE,maxFiles:process.env.LOG_MAX_FILES,zippedArchive:process.env.LOG_ZIPPED_ARCHIVE==="true",logDirectory:process.env.LOG_DIRECTORY}),security:Object.freeze({bcryptSaltRounds:_(process.env.BCRYPT_SALT_ROUNDS,"BCRYPT_SALT_ROUNDS"),rateLimitWindow:_(process.env.RATE_LIMIT_WINDOW,"RATE_LIMIT_WINDOW"),rateLimitMaxRequests:_(process.env.RATE_LIMIT_MAX_REQUESTS,"RATE_LIMIT_MAX_REQUESTS"),rateLimitAuthWindow:_(process.env.RATE_LIMIT_AUTH_WINDOW,"RATE_LIMIT_AUTH_WINDOW"),rateLimitAuthMaxRequests:_(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS,"RATE_LIMIT_AUTH_MAX_REQUESTS")}),compression:Object.freeze({threshold:process.env.COMPRESSION_THRESHOLD??"1kb"}),features:Object.freeze({swagger:process.env.ENABLE_SWAGGER==="true",requestLogging:process.env.ENABLE_REQUEST_LOGGING==="true"}),http:Object.freeze({jsonLimit:process.env.JSON_LIMIT??"1mb",urlEncodedLimit:process.env.URLENCODED_LIMIT??"1mb",corsAllowedOrigins:process.env.CORS_ALLOWED_ORIGINS.split(",").map(e=>e.trim()).filter(Boolean),corsCredentials:process.env.CORS_CREDENTIALS==="true",parameterLimit:_(process.env.PARAMETER_LIMIT,"PARAMETER_LIMIT"),apiPrefix:process.env.API_PREFIX,apiVersion:process.env.API_VERSION}),seeding:Object.freeze({developerUsername:process.env.SEED_DEVELOPER_USERNAME,developerEmail:process.env.SEED_DEVELOPER_EMAIL,developerPassword:process.env.SEED_DEVELOPER_PASSWORD}),ssl:Object.freeze({enabled:process.env.DB_SSL==="true",rejectUnauthorized:process.env.DB_SSL_REJECT_UNAUTHORIZED==="true",ca:process.env.DB_SSL_CA?.trim()||null})}),E=Q;var K=Object.freeze({app:E.app,server:E.server,database:E.database,jwt:E.jwt,logging:E.logging,http:E.http,cookies:E.cookies,compression:E.compression,security:E.security,features:E.features,seeding:E.seeding,ssl:E.ssl}),o=K;import{Pool as re}from"pg";import{performance as A}from"node:perf_hooks";import te from"p-retry";import N from"node:fs";import T from"node:path";import m from"winston";import w from"winston-daily-rotate-file";var O=T.resolve(o.logging.logDirectory||T.join(process.cwd(),"logs")),J=["combined","error","http","exceptions","rejections"];N.existsSync(O)||N.mkdirSync(O);J.forEach(e=>{let r=T.join(O,e);N.existsSync(r)||N.mkdirSync(r,{recursive:!0})});var v={levels:{error:0,warn:1,info:2,http:3,verbose:4,debug:5},colors:{error:"red",warn:"yellow",info:"green",http:"magenta",verbose:"cyan",debug:"blue"}};m.addColors(v.colors);var D=m.format.combine(m.format.timestamp(),m.format.errors({stack:!0}),m.format.metadata({fillExcept:["message","level","timestamp","label"]}),m.format.json()),Z=m.format.combine(m.format.colorize(),m.format.timestamp({format:"YYYY-MM-DD HH:mm:ss"}),m.format.printf(({timestamp:e,level:r,message:t,stack:s})=>`${e} ${r}: ${s||t}`)),ee=[new m.transports.Console({format:Z}),new w({dirname:T.join(O,"combined"),filename:"%DATE%.log",datePattern:"YYYY-MM-DD",maxSize:o.logging.maxSize,maxFiles:o.logging.maxFiles,zippedArchive:o.logging.zippedArchive==="true",level:o.logging.level,format:D}),new w({dirname:T.join(O,"error"),filename:"%DATE%.log",datePattern:"YYYY-MM-DD",level:"error",maxSize:o.logging.maxSize,maxFiles:o.logging.maxFiles,zippedArchive:o.logging.zippedArchive==="true",format:D}),new w({dirname:T.join(O,"http"),filename:"%DATE%.log",datePattern:"YYYY-MM-DD",level:"http",maxSize:o.logging.maxSize,maxFiles:o.logging.maxFiles,zippedArchive:o.logging.zippedArchive==="true",format:D})],g=m.createLogger({levels:v.levels,level:o.logging.level,transports:ee,exitOnError:!1,exceptionHandlers:[new w({dirname:T.join(O,"exceptions"),filename:"%DATE%.log",datePattern:"YYYY-MM-DD",format:D})],rejectionHandlers:[new w({dirname:T.join(O,"rejections"),filename:"%DATE%.log",datePattern:"YYYY-MM-DD",format:D})]});g.stream={write(e){g.http(e.trim())}};var a=g;var oe={host:o.database.host,port:o.database.port,database:o.database.database,user:o.database.user,password:o.database.password,max:o.database.maxConnections,idleTimeoutMillis:o.database.idleTimeout,connectionTimeoutMillis:o.database.connectionTimeout,allowExitOnIdle:!1,keepAlive:!0,application_name:o.app.name,slowQueryThreshold:o.database.dbSlowQueryThreshold,ssl:o.ssl.enabled?{rejectUnauthorized:o.ssl.rejectUnauthorized,...o.ssl.ca?{ca:o.ssl.ca}:{}}:!1},p=new re(oe);Object.defineProperty(p,"name",{value:"CRM PostgreSQL Pool",writable:!1});p.on("connect",e=>{a.info("New PostgreSQL client connected.",{processId:e.processID})});p.on("acquire",()=>{a.debug("Database client acquired from pool.")});p.on("remove",()=>{a.debug("Database client removed from pool.")});p.on("error",e=>{a.error("Unexpected PostgreSQL pool error.",{error:e.message,stack:e.stack})});async function se(){let e=A.now();try{return await te(async()=>{let r=await p.connect();try{let t=await r.query(`
                        SELECT
                            version() AS version,
                            current_database() AS database,
                            current_user AS "user";
                    `),s=A.now()-e;a.info("PostgreSQL connected successfully.",{database:t.rows[0].database,user:t.rows[0].user,version:t.rows[0].version,connectionTime:`${s.toFixed(2)} ms`})}finally{r.release()}},{retries:o.database.connectionRetries,minTimeout:o.database.connectionRetryDelay,factor:1,onFailedAttempt:r=>{a.warn("Unable to connect to PostgreSQL.",{attempt:r.attemptNumber,retriesLeft:r.retriesLeft,message:r.message})}}),!0}catch(r){throw a.error("PostgreSQL startup failed.",{error:r.message,stack:r.stack}),r}}async function ae(e,r=[]){let t=A.now();try{let s=await p.query(e,r),i=A.now()-t;return a.debug("Database query executed.",{duration:`${i.toFixed(2)} ms`,rowCount:s.rowCount}),i>=o.database.slowQueryThreshold&&a.warn("Slow database query detected.",{duration:`${i.toFixed(2)} ms`,threshold:`${o.database.slowQueryThreshold} ms`,rowCount:s.rowCount,query:e,parameters:r}),s}catch(s){throw a.error("Database query failed.",{query:e,parameters:r,error:s.message,stack:s.stack}),s}}async function ne(){try{let e=await p.connect();return a.debug("Transaction client acquired.",{processId:e.processID}),e}catch(e){throw a.error("Failed to acquire transaction client.",{error:e.message,stack:e.stack}),e}}async function ie(){let e=A.now();try{return await p.query("SELECT 1"),{status:"UP",responseTime:`${(A.now()-e).toFixed(2)} ms`,database:o.database.database,pool:{max:p.options.max,total:p.totalCount,idle:p.idleCount,waiting:p.waitingCount},timestamp:new Date().toISOString()}}catch(r){return a.error("Database health check failed.",{error:r.message,stack:r.stack}),{status:"DOWN",error:r.message,timestamp:new Date().toISOString()}}}async function ce(){try{a.info("Closing PostgreSQL connection pool..."),await p.end(),a.info("PostgreSQL connection pool closed successfully.")}catch(e){throw a.error("Failed to close PostgreSQL connection pool.",{error:e.message,stack:e.stack}),e}}var de=Object.freeze({pool:p,initialize:se,query:ae,getClient:ne,healthCheck:ie,close:ce}),S=de;import{randomUUID as pe}from"node:crypto";var le="TX",y=Object.freeze({READ_COMMITTED:"READ COMMITTED",REPEATABLE_READ:"REPEATABLE READ",SERIALIZABLE:"SERIALIZABLE"}),L=y.READ_COMMITTED,Ee=3,me=25,ue=Object.freeze(new Set(["40001","40P01"])),_e=()=>{let e=new Date().toISOString().slice(0,10).replaceAll("-",""),r=pe().split("-")[0].toUpperCase();return`${le}-${e}-${r}`},z=e=>{if(!Object.values(y).includes(e))throw new TypeError(`Unsupported transaction isolation level: ${e}`)},Te=e=>{if(!Number.isInteger(e)||e<0||e>10)throw new TypeError("Transaction maxRetries must be an integer between 0 and 10.")},h=e=>Number(process.hrtime.bigint()-e)/1e6,Oe=e=>new Promise(r=>setTimeout(r,e)),Se=e=>{let r=me*2**e,t=Math.floor(Math.random()*25);return r+t},fe=e=>ue.has(e?.code),P=async(e,{transactionId:r,isolationLevel:t=L}={})=>{if(!e)throw new TypeError("PostgreSQL client is required to begin a transaction.");z(t),await e.query(`BEGIN ISOLATION LEVEL ${t}`),a.debug("Database transaction started.",{transactionId:r,isolationLevel:t})},M=async(e,{transactionId:r}={})=>{if(!e)throw new TypeError("PostgreSQL client is required to commit a transaction.");await e.query("COMMIT"),a.debug("Database transaction committed.",{transactionId:r})},j=async(e,{transactionId:r}={})=>{if(!e)throw new TypeError("PostgreSQL client is required to rollback a transaction.");await e.query("ROLLBACK"),a.warn("Database transaction rolled back.",{transactionId:r})},Re=async(e,r)=>{let t=_e(),s=new Date,i=process.hrtime.bigint(),n=null,u=!1;try{n=await S.getClient(),await P(n,{transactionId:t,isolationLevel:r}),u=!0;let d=Object.freeze({client:n,transactionId:t,startedAt:s,isolationLevel:r}),l=await e(d);await M(n,{transactionId:t}),u=!1;let c=h(i);return a.info("Database transaction completed.",{transactionId:t,isolationLevel:r,durationMs:Number(c.toFixed(2)),status:"committed"}),l}catch(d){if(n&&u)try{await j(n,{transactionId:t}),u=!1}catch(c){a.error("Database transaction rollback failed.",{transactionId:t,originalError:{name:d.name,message:d.message,code:d.code},rollbackError:{name:c.name,message:c.message,code:c.code,stack:c.stack}})}let l=h(i);throw a.error("Database transaction failed.",{transactionId:t,isolationLevel:r,durationMs:Number(l.toFixed(2)),status:"failed",error:{name:d.name,message:d.message,code:d.code,stack:d.stack}}),d}finally{n&&(n.release(),a.debug("Database transaction client released.",{transactionId:t}))}},b=async(e,{isolationLevel:r=L,maxRetries:t=Ee}={})=>{if(typeof e!="function")throw new TypeError("Transaction callback must be a function.");z(r),Te(t);let s=0;for(;;)try{return await Re(e,r)}catch(i){if(!fe(i)||s>=t)throw i;let n=Se(s);a.warn("Retrying transient database transaction failure.",{errorCode:i.code,retryAttempt:s+1,maxRetries:t,delayMs:n,isolationLevel:r}),s+=1,await Oe(n)}},lr=Object.freeze({beginTransaction:P,commitTransaction:M,rollbackTransaction:j,executeTransaction:b});var H=(e=null)=>{if(e==null)return S;if(!e.client||typeof e.client.query!="function")throw new TypeError("Invalid transaction context supplied to repository.");return e.client};import x from"bcryptjs";var Ae=()=>{let e=o?.security?.bcryptSaltRounds;if(!Number.isInteger(e)||e<10||e>31)throw new Error("Invalid bcrypt salt-round configuration.");return e};async function we(e){if(typeof e!="string")throw new TypeError("Password must be a string.");if(e.length===0)throw new Error("Password cannot be empty.");return x.hash(e,Ae())}async function De(e,r){if(typeof e!="string")throw new TypeError("Password must be a string.");if(typeof r!="string")throw new TypeError("Password hash must be a string.");return e.length===0||r.length===0?!1:x.compare(e,r)}var Ie=Object.freeze({hashPassword:we,verifyPassword:De}),k=Ie;var Ne=Object.freeze({ACCESS:"access",REFRESH:"refresh"}),ge=Object.freeze({PENDING:"pending",ACTIVE:"active",INACTIVE:"inactive",SUSPENDED:"suspended",LOCKED:"locked"}),be=Object.freeze({MAX_FAILED_ATTEMPTS:5,LOCK_DURATION_MINUTES:15}),Ce=Object.freeze({SINGLE_ACTIVE_SESSION:!0,ROTATE_REFRESH_TOKEN:!0}),Ue=Object.freeze({INVALID_CREDENTIALS:"AUTH_INVALID_CREDENTIALS",ACCOUNT_PENDING:"AUTH_ACCOUNT_PENDING",ACCOUNT_INACTIVE:"AUTH_ACCOUNT_INACTIVE",ACCOUNT_SUSPENDED:"AUTH_ACCOUNT_SUSPENDED",ACCOUNT_LOCKED:"AUTH_ACCOUNT_LOCKED",ACCOUNT_DEACTIVATED:"AUTH_ACCOUNT_DEACTIVATED",INVALID_ACCESS_TOKEN:"AUTH_INVALID_ACCESS_TOKEN",ACCESS_TOKEN_EXPIRED:"AUTH_ACCESS_TOKEN_EXPIRED",INVALID_REFRESH_TOKEN:"AUTH_INVALID_REFRESH_TOKEN",REFRESH_TOKEN_EXPIRED:"AUTH_REFRESH_TOKEN_EXPIRED",SESSION_NOT_FOUND:"AUTH_SESSION_NOT_FOUND",SESSION_REVOKED:"AUTH_SESSION_REVOKED",SESSION_EXPIRED:"AUTH_SESSION_EXPIRED",SESSION_MISMATCH:"AUTH_SESSION_MISMATCH",AUTHENTICATION_REQUIRED:"AUTHENTICATION_REQUIRED",INVALID_AUTHENTICATION_STATE:"AUTH_INVALID_STATE",ACCESS_TOKEN_REQUIRED:"AUTH_ACCESS_TOKEN_REQUIRED"}),ve=Object.freeze({LOGIN_SUCCESS:"AUTH_LOGIN_SUCCESS",REFRESH_SUCCESS:"AUTH_REFRESH_SUCCESS",LOGOUT_SUCCESS:"AUTH_LOGOUT_SUCCESS",SESSION_VALID:"AUTH_SESSION_VALID"}),he=Object.freeze({ROOT:"/auth",LOGIN:"/login",REFRESH:"/refresh",LOGOUT:"/logout",ME:"/me"}),ye=Object.freeze({AUTHORIZATION:"authorization",BEARER_PREFIX:"Bearer"}),Le=Object.freeze({USER_AGENT_MAX_LENGTH:1e3,IP_ADDRESS_MAX_LENGTH:45}),ze=Object.freeze({JWT:"jwt",PASSWORD:"password"}),Pe=Object.freeze({AUTH_TOKEN_TYPES:Ne,AUTH_ACCOUNT_STATUS:ge,AUTH_LOGIN_POLICY:be,AUTH_SESSION_POLICY:Ce,AUTH_ERROR_CODES:Ue,AUTH_SUCCESS_CODES:ve,AUTH_ROUTES:he,AUTH_HEADERS:ye,AUTH_SESSION_METADATA_LIMITS:Le,AUTH_CONFIG_KEYS:ze}),V=Pe;var{AUTH_ACCOUNT_STATUS:$}=V,I=Object.freeze([Object.freeze({code:"developer",name:"Developer",description:"Protected highest-authority system role used for system administration, bootstrap and recovery."}),Object.freeze({code:"superadmin",name:"Super Administrator",description:"Protected application administrator role managed by the Developer."})]),f=Object.freeze([Object.freeze({code:"user:read",name:"Read Users",description:"View user records.",resource:"user",action:"read"}),Object.freeze({code:"user:create",name:"Create Users",description:"Create new users.",resource:"user",action:"create"}),Object.freeze({code:"user:update",name:"Update Users",description:"Update existing users.",resource:"user",action:"update"}),Object.freeze({code:"user:delete",name:"Delete Users",description:"Delete users where permitted by business rules.",resource:"user",action:"delete"}),Object.freeze({code:"role:read",name:"Read Roles",description:"View roles.",resource:"role",action:"read"}),Object.freeze({code:"role:create",name:"Create Roles",description:"Create normal application roles.",resource:"role",action:"create"}),Object.freeze({code:"role:update",name:"Update Roles",description:"Update normal application roles.",resource:"role",action:"update"}),Object.freeze({code:"role:delete",name:"Delete Roles",description:"Delete normal application roles where permitted.",resource:"role",action:"delete"}),Object.freeze({code:"permission:read",name:"Read Permissions",description:"View permissions.",resource:"permission",action:"read"}),Object.freeze({code:"permission:create",name:"Create Permissions",description:"Create application permissions where permitted.",resource:"permission",action:"create"}),Object.freeze({code:"permission:update",name:"Update Permissions",description:"Update application permissions where permitted.",resource:"permission",action:"update"}),Object.freeze({code:"permission:delete",name:"Delete Permissions",description:"Delete application permissions where permitted.",resource:"permission",action:"delete"}),Object.freeze({code:"organization:read",name:"Read Organizations",description:"View organization records.",resource:"organization",action:"read"}),Object.freeze({code:"organization:create",name:"Create Organizations",description:"Create organizations.",resource:"organization",action:"create"}),Object.freeze({code:"organization:update",name:"Update Organizations",description:"Update organization records.",resource:"organization",action:"update"}),Object.freeze({code:"organization:delete",name:"Delete Organizations",description:"Deactivate organizations where permitted.",resource:"organization",action:"delete"}),Object.freeze({code:"department:read",name:"Read Departments",description:"View department records.",resource:"department",action:"read"}),Object.freeze({code:"department:create",name:"Create Departments",description:"Create departments.",resource:"department",action:"create"}),Object.freeze({code:"department:update",name:"Update Departments",description:"Update department records.",resource:"department",action:"update"}),Object.freeze({code:"department:delete",name:"Delete Departments",description:"Deactivate departments where permitted.",resource:"department",action:"delete"}),Object.freeze({code:"employee:read",name:"Read Employees",description:"View employee records.",resource:"employee",action:"read"}),Object.freeze({code:"employee:create",name:"Create Employees",description:"Create employee records.",resource:"employee",action:"create"}),Object.freeze({code:"employee:update",name:"Update Employees",description:"Update employee records.",resource:"employee",action:"update"}),Object.freeze({code:"employee:delete",name:"Delete Employees",description:"Deactivate employee records.",resource:"employee",action:"delete"}),Object.freeze({code:"ticket:read",name:"Read Tickets",description:"View tickets.",resource:"ticket",action:"read"}),Object.freeze({code:"ticket:create",name:"Create Tickets",description:"Create tickets.",resource:"ticket",action:"create"}),Object.freeze({code:"ticket:update",name:"Update Tickets",description:"Update tickets.",resource:"ticket",action:"update"}),Object.freeze({code:"ticket:assign",name:"Assign Tickets",description:"Assign and reassign tickets.",resource:"ticket",action:"assign"}),Object.freeze({code:"ticket:resolve",name:"Resolve Tickets",description:"Resolve tickets.",resource:"ticket",action:"resolve"}),Object.freeze({code:"ticket:close",name:"Close Tickets",description:"Close tickets.",resource:"ticket",action:"close"}),Object.freeze({code:"sla:read",name:"Read SLA",description:"View SLA configuration and information.",resource:"sla",action:"read"}),Object.freeze({code:"sla:create",name:"Create SLA",description:"Create SLA policies.",resource:"sla",action:"create"}),Object.freeze({code:"sla:update",name:"Update SLA",description:"Update SLA policies.",resource:"sla",action:"update"}),Object.freeze({code:"sla:delete",name:"Delete SLA",description:"Delete SLA policies where permitted.",resource:"sla",action:"delete"}),Object.freeze({code:"dashboard:read",name:"Read Dashboard",description:"View role-authorized dashboards.",resource:"dashboard",action:"read"})]),B=Object.freeze(f.map(({code:e})=>e)),Y=Object.freeze(f.map(({code:e})=>e));function Me(){let e=o.seeding?.developerUsername?.trim(),r=o.seeding?.developerEmail?.trim(),t=o.seeding?.developerPassword;if(!e)throw new Error("SEED_DEVELOPER_USERNAME is required.");if(!r)throw new Error("SEED_DEVELOPER_EMAIL is required.");if(!t)throw new Error("SEED_DEVELOPER_PASSWORD is required.");if(t.length<12)throw new Error("SEED_DEVELOPER_PASSWORD must contain at least 12 characters.");return Object.freeze({username:e,email:r,password:t})}function je(){if(o.app.environment!=="development"&&o.app.environment!=="production")throw new Error("RBAC bootstrap seeder can only run in development or production environments.")}function He(){let e=new Set(I.map(({code:t})=>t));if(e.size!==I.length)throw new Error("Duplicate system role code detected.");if(!e.has("developer")||!e.has("superadmin"))throw new Error("Developer and Super Admin system roles are mandatory.");if(I.length!==2)throw new Error("Bootstrap seeder must contain exactly two system roles.");let r=new Set(f.map(({code:t})=>t));if(r.size!==f.length)throw new Error("Duplicate system permission code detected.");for(let t of f)if(t.code!==`${t.resource}:${t.action}`)throw new Error(`Permission code/resource/action mismatch: ${t.code}`);for(let t of B)if(!r.has(t))throw new Error(`Unknown Super Admin permission: ${t}`);for(let t of Y)if(!r.has(t))throw new Error(`Unknown Developer permission: ${t}`)}async function xe(e,r){let t=await e.query(`
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
        `,[r.code]);if(t.rowCount===0)return(await e.query(`
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
            `,[C(),r.code,r.name,r.description])).rows[0];let s=t.rows[0];if(s.is_system!==!0||s.is_immutable!==!0||s.is_active!==!0)throw new Error(`Protected role '${r.code}' exists in an invalid state.`);if(s.name!==r.name)throw new Error(`Protected role '${r.code}' has an invalid name '${s.name}'.`);return s}async function ke(e,r){return(await e.query(`
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
        `,[C(),r.code,r.name,r.description,r.resource,r.action])).rows[0]}async function F(e,r,t){await e.query(`
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
        `,[r,t])}async function Ve(e,r){let t=await e.query(`
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
        `,[r.username,r.email]);if(t.rowCount>0){let n=t.rows[0];if(n.username.toLowerCase()!==r.username.toLowerCase()||n.email.toLowerCase()!==r.email.toLowerCase())throw new Error("Developer bootstrap username/email conflicts with an existing user.");if(n.status!==$.ACTIVE)throw new Error("Existing Developer bootstrap user is not active.");return n}let s=await k.hashPassword(r.password);return(await e.query(`
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
        `,[C(),r.username,r.email,s,$.ACTIVE])).rows[0]}async function $e(e,r,t){await e.query(`
            DELETE FROM user_roles
            WHERE user_id = $1
              AND role_id <> $2
        `,[r,t]),await e.query(`
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
        `,[r,t])}async function Fe(e,r,t,s){if((await e.query(`
                SELECT COUNT(*)::INTEGER AS count
                FROM user_roles ur
                INNER JOIN roles r
                    ON r.id = ur.role_id
                WHERE ur.user_id = $1
                  AND r.code = 'developer'
            `,[r.id])).rows[0].count!==1)throw new Error("Developer bootstrap role assignment validation failed.");if((await e.query(`
                SELECT COUNT(*)::INTEGER AS count
                FROM user_roles ur
                WHERE ur.role_id = $1
            `,[t.id])).rows[0].count!==1)throw new Error("Developer role must have exactly one assigned user.");if((await e.query(`
                SELECT COUNT(*)::INTEGER AS count
                FROM user_roles ur
                WHERE ur.role_id = $1
            `,[s.id])).rows[0].count!==0)throw new Error("Super Admin role must not have an initial user assignment.");if((await e.query(`
                SELECT COUNT(*)::INTEGER AS count
                FROM roles
                WHERE code IN (
                    'developer',
                    'superadmin'
                )
            `)).rows[0].count!==2)throw new Error("Developer and Super Admin system-role validation failed.");a.info("RBAC bootstrap state validated successfully.",{developerUserId:r.id,developerRoleId:t.id,superadminRoleId:s.id})}async function Be(){je(),He();let e=Me();await S.initialize();try{await b(async r=>{let t=H(r);await t.query("SET LOCAL app.rbac_bootstrap = 'true'");let s=new Map;for(let l of I){let c=await xe(t,l);s.set(c.code,c)}let i=s.get("developer"),n=s.get("superadmin");if(!i||!n)throw new Error("Required system roles are unavailable.");let u=new Map;for(let l of f){let c=await ke(t,l);u.set(c.code,c)}for(let l of Y){let c=u.get(l);if(!c)throw new Error(`Developer permission was not found: ${l}`);await F(t,i.id,c.id)}for(let l of B){let c=u.get(l);if(!c)throw new Error(`Super Admin permission was not found: ${l}`);await F(t,n.id,c.id)}let d=await Ve(t,e);await $e(t,d.id,i.id),await Fe(t,d,i,n),a.info("Initial RBAC bootstrap completed.",{roleCount:I.length,permissionCount:f.length,developerUser:d.email,superadminUserCount:0})})}finally{await S.close()}}try{await Be(),a.info("RBAC bootstrap seeder completed successfully.")}catch(e){a.error("RBAC bootstrap seeder failed.",{message:e.message,stack:e.stack}),process.exitCode=1}
