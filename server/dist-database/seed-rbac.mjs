import{randomUUID as N}from"node:crypto";import G from"dotenv";import W from"node:path";G.config({path:W.resolve(process.cwd(),".env")});var X=["NODE_ENV","PORT","DB_HOST","DB_PORT","DB_NAME","DB_USER","DB_PASSWORD","JWT_SECRET","COOKIE_SECRET","CORS_ALLOWED_ORIGINS","HOST"],v=Object.freeze(["development","production","test"]),_=(e,t)=>{let r=Number(e);if(Number.isNaN(r))throw new Error(`${t} must be a valid number.`);return r},R=(e,t,r)=>e===void 0||e===""?r:_(e,t),Q=e=>{e.forEach(t=>{if(!process.env[t])throw new Error(`Missing required environment variable: ${t}`)})};Q(X);if(!v.includes(process.env.NODE_ENV))throw new Error(`Invalid NODE_ENV: ${process.env.NODE_ENV}. Allowed values: ${v.join(", ")}`);var K=Object.freeze({app:Object.freeze({name:process.env.APP_NAME,version:process.env.APP_VERSION,environment:process.env.NODE_ENV}),cookies:Object.freeze({secret:process.env.COOKIE_SECRET,secure:process.env.COOKIE_SECURE==="true",sameSite:process.env.COOKIE_SAMESITE}),server:Object.freeze({host:process.env.HOST,port:_(process.env.PORT,"PORT"),trustProxy:process.env.TRUST_PROXY==="true"?!0:process.env.TRUST_PROXY==="false"?!1:Number.isInteger(Number(process.env.TRUST_PROXY))?Number(process.env.TRUST_PROXY):process.env.TRUST_PROXY}),database:Object.freeze({host:process.env.DB_HOST,port:_(process.env.DB_PORT,"DB_PORT"),database:process.env.DB_NAME,user:process.env.DB_USER,password:process.env.DB_PASSWORD,maxConnections:R(process.env.DB_MAX_CONNECTIONS,"DB_MAX_CONNECTIONS",20),idleTimeout:R(process.env.DB_IDLE_TIMEOUT,"DB_IDLE_TIMEOUT",3e4),connectionTimeout:R(process.env.DB_CONNECTION_TIMEOUT,"DB_CONNECTION_TIMEOUT",3e4),dbSlowQueryThreshold:R(process.env.DB_SLOW_QUERY_THRESHOLD,"DB_SLOW_QUERY_THRESHOLD",2e3),connectionRetries:R(process.env.DB_CONNECTION_RETRIES,"DB_CONNECTION_RETRIES",5),connectionRetryDelay:R(process.env.DB_CONNECTION_RETRY_DELAY,"DB_CONNECTION_RETRY_DELAY",1e3)}),jwt:Object.freeze({secret:process.env.JWT_SECRET,expiresIn:process.env.JWT_EXPIRES_IN,refreshExpiresIn:process.env.JWT_REFRESH_EXPIRES_IN}),logging:Object.freeze({level:process.env.LOG_LEVEL,maxSize:process.env.LOG_MAX_SIZE,maxFiles:process.env.LOG_MAX_FILES,zippedArchive:process.env.LOG_ZIPPED_ARCHIVE==="true",logDirectory:process.env.LOG_DIRECTORY}),security:Object.freeze({bcryptSaltRounds:_(process.env.BCRYPT_SALT_ROUNDS,"BCRYPT_SALT_ROUNDS"),rateLimitWindow:_(process.env.RATE_LIMIT_WINDOW,"RATE_LIMIT_WINDOW"),rateLimitMaxRequests:_(process.env.RATE_LIMIT_MAX_REQUESTS,"RATE_LIMIT_MAX_REQUESTS"),rateLimitAuthWindow:_(process.env.RATE_LIMIT_AUTH_WINDOW,"RATE_LIMIT_AUTH_WINDOW"),rateLimitAuthMaxRequests:_(process.env.RATE_LIMIT_AUTH_MAX_REQUESTS,"RATE_LIMIT_AUTH_MAX_REQUESTS")}),compression:Object.freeze({threshold:process.env.COMPRESSION_THRESHOLD??"1kb"}),features:Object.freeze({swagger:process.env.ENABLE_SWAGGER==="true",requestLogging:process.env.ENABLE_REQUEST_LOGGING==="true"}),http:Object.freeze({jsonLimit:process.env.JSON_LIMIT??"1mb",urlEncodedLimit:process.env.URLENCODED_LIMIT??"1mb",corsAllowedOrigins:process.env.CORS_ALLOWED_ORIGINS.split(",").map(e=>e.trim()).filter(Boolean),corsCredentials:process.env.CORS_CREDENTIALS==="true",parameterLimit:_(process.env.PARAMETER_LIMIT,"PARAMETER_LIMIT"),apiPrefix:process.env.API_PREFIX,apiVersion:process.env.API_VERSION}),seeding:Object.freeze({developerUsername:process.env.SEED_DEVELOPER_USERNAME,developerEmail:process.env.SEED_DEVELOPER_EMAIL,developerPassword:process.env.SEED_DEVELOPER_PASSWORD,defaultOrganizationCode:process.env.DEFAULT_ORGANIZATION_CODE,defaultOrganizationName:process.env.DEFAULT_ORGANIZATION_NAME,defaultOrganizationStatus:process.env.DEFAULT_ORGANIZATION_STATUS}),ssl:Object.freeze({enabled:process.env.DB_SSL==="true",rejectUnauthorized:process.env.DB_SSL_REJECT_UNAUTHORIZED==="true",ca:process.env.DB_SSL_CA?.trim()||null})}),l=K;var Z=Object.freeze({app:l.app,server:l.server,database:l.database,jwt:l.jwt,logging:l.logging,http:l.http,cookies:l.cookies,compression:l.compression,security:l.security,features:l.features,seeding:l.seeding,ssl:l.ssl}),o=Z;import{Pool as re}from"pg";import{performance as D}from"node:perf_hooks";import oe from"p-retry";import I from"node:fs";import O from"node:path";import u from"winston";import A from"winston-daily-rotate-file";var T=O.resolve(o.logging.logDirectory||O.join(process.cwd(),"logs")),J=["combined","error","http","exceptions","rejections"];I.existsSync(T)||I.mkdirSync(T);J.forEach(e=>{let t=O.join(T,e);I.existsSync(t)||I.mkdirSync(t,{recursive:!0})});var U={levels:{error:0,warn:1,info:2,http:3,verbose:4,debug:5},colors:{error:"red",warn:"yellow",info:"green",http:"magenta",verbose:"cyan",debug:"blue"}};u.addColors(U.colors);var b=u.format.combine(u.format.timestamp(),u.format.errors({stack:!0}),u.format.metadata({fillExcept:["message","level","timestamp","label"]}),u.format.json()),ee=u.format.combine(u.format.colorize(),u.format.timestamp({format:"YYYY-MM-DD HH:mm:ss"}),u.format.printf(({timestamp:e,level:t,message:r,stack:s})=>`${e} ${t}: ${s||r}`)),te=[new u.transports.Console({format:ee}),new A({dirname:O.join(T,"combined"),filename:"%DATE%.log",datePattern:"YYYY-MM-DD",maxSize:o.logging.maxSize,maxFiles:o.logging.maxFiles,zippedArchive:o.logging.zippedArchive==="true",level:o.logging.level,format:b}),new A({dirname:O.join(T,"error"),filename:"%DATE%.log",datePattern:"YYYY-MM-DD",level:"error",maxSize:o.logging.maxSize,maxFiles:o.logging.maxFiles,zippedArchive:o.logging.zippedArchive==="true",format:b}),new A({dirname:O.join(T,"http"),filename:"%DATE%.log",datePattern:"YYYY-MM-DD",level:"http",maxSize:o.logging.maxSize,maxFiles:o.logging.maxFiles,zippedArchive:o.logging.zippedArchive==="true",format:b})],y=u.createLogger({levels:U.levels,level:o.logging.level,transports:te,exitOnError:!1,exceptionHandlers:[new A({dirname:O.join(T,"exceptions"),filename:"%DATE%.log",datePattern:"YYYY-MM-DD",format:b})],rejectionHandlers:[new A({dirname:O.join(T,"rejections"),filename:"%DATE%.log",datePattern:"YYYY-MM-DD",format:b})]});y.stream={write(e){y.http(e.trim())}};var a=y;var se={host:o.database.host,port:o.database.port,database:o.database.database,user:o.database.user,password:o.database.password,max:o.database.maxConnections,idleTimeoutMillis:o.database.idleTimeout,connectionTimeoutMillis:o.database.connectionTimeout,allowExitOnIdle:!1,keepAlive:!0,application_name:o.app.name,slowQueryThreshold:o.database.dbSlowQueryThreshold,ssl:o.ssl.enabled?{rejectUnauthorized:o.ssl.rejectUnauthorized,...o.ssl.ca?{ca:o.ssl.ca}:{}}:!1},p=new re(se);Object.defineProperty(p,"name",{value:"CRM PostgreSQL Pool",writable:!1});p.on("connect",e=>{a.info("New PostgreSQL client connected.",{processId:e.processID})});p.on("acquire",()=>{a.debug("Database client acquired from pool.")});p.on("remove",()=>{a.debug("Database client removed from pool.")});p.on("error",e=>{a.error("Unexpected PostgreSQL pool error.",{error:e.message,stack:e.stack})});async function ae(){let e=D.now();try{return await oe(async()=>{let t=await p.connect();try{let r=await t.query(`
                        SELECT
                            version() AS version,
                            current_database() AS database,
                            current_user AS "user";
                    `),s=D.now()-e;a.info("PostgreSQL connected successfully.",{database:r.rows[0].database,user:r.rows[0].user,version:r.rows[0].version,connectionTime:`${s.toFixed(2)} ms`})}finally{t.release()}},{retries:o.database.connectionRetries,minTimeout:o.database.connectionRetryDelay,factor:1,onFailedAttempt:t=>{a.warn("Unable to connect to PostgreSQL.",{attempt:t.attemptNumber,retriesLeft:t.retriesLeft,message:t.message})}}),!0}catch(t){throw a.error("PostgreSQL startup failed.",{error:t.message,stack:t.stack}),t}}async function ie(e,t=[]){let r=D.now();try{let s=await p.query(e,t),n=D.now()-r;return a.debug("Database query executed.",{duration:`${n.toFixed(2)} ms`,rowCount:s.rowCount}),n>=o.database.slowQueryThreshold&&a.warn("Slow database query detected.",{duration:`${n.toFixed(2)} ms`,threshold:`${o.database.slowQueryThreshold} ms`,rowCount:s.rowCount,query:e,parameters:t}),s}catch(s){throw a.error("Database query failed.",{query:e,parameters:t,error:s.message,stack:s.stack}),s}}async function ne(){try{let e=await p.connect();return a.debug("Transaction client acquired.",{processId:e.processID}),e}catch(e){throw a.error("Failed to acquire transaction client.",{error:e.message,stack:e.stack}),e}}async function ce(){let e=D.now();try{return await p.query("SELECT 1"),{status:"UP",responseTime:`${(D.now()-e).toFixed(2)} ms`,database:o.database.database,pool:{max:p.options.max,total:p.totalCount,idle:p.idleCount,waiting:p.waitingCount},timestamp:new Date().toISOString()}}catch(t){return a.error("Database health check failed.",{error:t.message,stack:t.stack}),{status:"DOWN",error:t.message,timestamp:new Date().toISOString()}}}async function de(){try{a.info("Closing PostgreSQL connection pool..."),await p.end(),a.info("PostgreSQL connection pool closed successfully.")}catch(e){throw a.error("Failed to close PostgreSQL connection pool.",{error:e.message,stack:e.stack}),e}}var pe=Object.freeze({pool:p,initialize:ae,query:ie,getClient:ne,healthCheck:ce,close:de}),f=pe;import{randomUUID as le}from"node:crypto";var ue="TX",L=Object.freeze({READ_COMMITTED:"READ COMMITTED",REPEATABLE_READ:"REPEATABLE READ",SERIALIZABLE:"SERIALIZABLE"}),z=L.READ_COMMITTED,me=3,Ee=25,_e=Object.freeze(new Set(["40001","40P01"])),Oe=()=>{let e=new Date().toISOString().slice(0,10).replaceAll("-",""),t=le().split("-")[0].toUpperCase();return`${ue}-${e}-${t}`},k=e=>{if(!Object.values(L).includes(e))throw new TypeError(`Unsupported transaction isolation level: ${e}`)},Te=e=>{if(!Number.isInteger(e)||e<0||e>10)throw new TypeError("Transaction maxRetries must be an integer between 0 and 10.")},h=e=>Number(process.hrtime.bigint()-e)/1e6,fe=e=>new Promise(t=>setTimeout(t,e)),Se=e=>{let t=Ee*2**e,r=Math.floor(Math.random()*25);return t+r},ge=e=>_e.has(e?.code),j=async(e,{transactionId:t,isolationLevel:r=z}={})=>{if(!e)throw new TypeError("PostgreSQL client is required to begin a transaction.");k(r),await e.query(`BEGIN ISOLATION LEVEL ${r}`),a.debug("Database transaction started.",{transactionId:t,isolationLevel:r})},P=async(e,{transactionId:t}={})=>{if(!e)throw new TypeError("PostgreSQL client is required to commit a transaction.");await e.query("COMMIT"),a.debug("Database transaction committed.",{transactionId:t})},M=async(e,{transactionId:t}={})=>{if(!e)throw new TypeError("PostgreSQL client is required to rollback a transaction.");await e.query("ROLLBACK"),a.warn("Database transaction rolled back.",{transactionId:t})},Re=async(e,t)=>{let r=Oe(),s=new Date,n=process.hrtime.bigint(),i=null,E=!1;try{i=await f.getClient(),await j(i,{transactionId:r,isolationLevel:t}),E=!0;let d=Object.freeze({client:i,transactionId:r,startedAt:s,isolationLevel:t}),g=await e(d);await P(i,{transactionId:r}),E=!1;let c=h(n);return a.info("Database transaction completed.",{transactionId:r,isolationLevel:t,durationMs:Number(c.toFixed(2)),status:"committed"}),g}catch(d){if(i&&E)try{await M(i,{transactionId:r}),E=!1}catch(c){a.error("Database transaction rollback failed.",{transactionId:r,originalError:{name:d.name,message:d.message,code:d.code},rollbackError:{name:c.name,message:c.message,code:c.code,stack:c.stack}})}let g=h(n);throw a.error("Database transaction failed.",{transactionId:r,isolationLevel:t,durationMs:Number(g.toFixed(2)),status:"failed",error:{name:d.name,message:d.message,code:d.code,stack:d.stack}}),d}finally{i&&(i.release(),a.debug("Database transaction client released.",{transactionId:r}))}},C=async(e,{isolationLevel:t=z,maxRetries:r=me}={})=>{if(typeof e!="function")throw new TypeError("Transaction callback must be a function.");k(t),Te(r);let s=0;for(;;)try{return await Re(e,t)}catch(n){if(!ge(n)||s>=r)throw n;let i=Se(s);a.warn("Retrying transient database transaction failure.",{errorCode:n.code,retryAttempt:s+1,maxRetries:r,delayMs:i,isolationLevel:t}),s+=1,await fe(i)}},mt=Object.freeze({beginTransaction:j,commitTransaction:P,rollbackTransaction:M,executeTransaction:C});var H=(e=null)=>{if(e==null)return f;if(!e.client||typeof e.client.query!="function")throw new TypeError("Invalid transaction context supplied to repository.");return e.client};import x from"bcryptjs";var De=()=>{let e=o?.security?.bcryptSaltRounds;if(!Number.isInteger(e)||e<10||e>31)throw new Error("Invalid bcrypt salt-round configuration.");return e};async function Ae(e){if(typeof e!="string")throw new TypeError("Password must be a string.");if(e.length===0)throw new Error("Password cannot be empty.");return x.hash(e,De())}async function be(e,t){if(typeof e!="string")throw new TypeError("Password must be a string.");if(typeof t!="string")throw new TypeError("Password hash must be a string.");return e.length===0||t.length===0?!1:x.compare(e,t)}var we=Object.freeze({hashPassword:Ae,verifyPassword:be}),V=we;var Ie=Object.freeze({ACCESS:"access",REFRESH:"refresh"}),ye=Object.freeze({PENDING:"pending",ACTIVE:"active",INACTIVE:"inactive",SUSPENDED:"suspended",LOCKED:"locked"}),Ce=Object.freeze({MAX_FAILED_ATTEMPTS:5,LOCK_DURATION_MINUTES:15}),Ne=Object.freeze({SINGLE_ACTIVE_SESSION:!0,ROTATE_REFRESH_TOKEN:!0}),ve=Object.freeze({INVALID_CREDENTIALS:"AUTH_INVALID_CREDENTIALS",ACCOUNT_PENDING:"AUTH_ACCOUNT_PENDING",ACCOUNT_INACTIVE:"AUTH_ACCOUNT_INACTIVE",ACCOUNT_SUSPENDED:"AUTH_ACCOUNT_SUSPENDED",ACCOUNT_LOCKED:"AUTH_ACCOUNT_LOCKED",ACCOUNT_DEACTIVATED:"AUTH_ACCOUNT_DEACTIVATED",INVALID_ACCESS_TOKEN:"AUTH_INVALID_ACCESS_TOKEN",ACCESS_TOKEN_EXPIRED:"AUTH_ACCESS_TOKEN_EXPIRED",INVALID_REFRESH_TOKEN:"AUTH_INVALID_REFRESH_TOKEN",REFRESH_TOKEN_EXPIRED:"AUTH_REFRESH_TOKEN_EXPIRED",SESSION_NOT_FOUND:"AUTH_SESSION_NOT_FOUND",SESSION_REVOKED:"AUTH_SESSION_REVOKED",SESSION_EXPIRED:"AUTH_SESSION_EXPIRED",SESSION_MISMATCH:"AUTH_SESSION_MISMATCH",AUTHENTICATION_REQUIRED:"AUTHENTICATION_REQUIRED",INVALID_AUTHENTICATION_STATE:"AUTH_INVALID_STATE",ACCESS_TOKEN_REQUIRED:"AUTH_ACCESS_TOKEN_REQUIRED"}),Ue=Object.freeze({LOGIN_SUCCESS:"AUTH_LOGIN_SUCCESS",REFRESH_SUCCESS:"AUTH_REFRESH_SUCCESS",LOGOUT_SUCCESS:"AUTH_LOGOUT_SUCCESS",SESSION_VALID:"AUTH_SESSION_VALID"}),he=Object.freeze({ROOT:"/auth",LOGIN:"/login",REFRESH:"/refresh",LOGOUT:"/logout",ME:"/me"}),Le=Object.freeze({AUTHORIZATION:"authorization",BEARER_PREFIX:"Bearer"}),ze=Object.freeze({USER_AGENT_MAX_LENGTH:1e3,IP_ADDRESS_MAX_LENGTH:45}),ke=Object.freeze({JWT:"jwt",PASSWORD:"password"}),je=Object.freeze({AUTH_TOKEN_TYPES:Ie,AUTH_ACCOUNT_STATUS:ye,AUTH_LOGIN_POLICY:Ce,AUTH_SESSION_POLICY:Ne,AUTH_ERROR_CODES:ve,AUTH_SUCCESS_CODES:Ue,AUTH_ROUTES:he,AUTH_HEADERS:Le,AUTH_SESSION_METADATA_LIMITS:ze,AUTH_CONFIG_KEYS:ke}),F=je;var{AUTH_ACCOUNT_STATUS:$}=F,w=Object.freeze([Object.freeze({code:"developer",name:"Developer",description:"Protected highest-authority system role used for system administration, bootstrap and recovery."}),Object.freeze({code:"superadmin",name:"Super Administrator",description:"Protected application administrator role managed by the Developer."})]),S=Object.freeze([Object.freeze({code:"user:read",name:"Read Users",description:"View user records.",resource:"user",action:"read"}),Object.freeze({code:"user:create",name:"Create Users",description:"Create new users.",resource:"user",action:"create"}),Object.freeze({code:"user:update",name:"Update Users",description:"Update existing users.",resource:"user",action:"update"}),Object.freeze({code:"user:delete",name:"Delete Users",description:"Delete users where permitted by business rules.",resource:"user",action:"delete"}),Object.freeze({code:"role:read",name:"Read Roles",description:"View roles.",resource:"role",action:"read"}),Object.freeze({code:"role:create",name:"Create Roles",description:"Create normal application roles.",resource:"role",action:"create"}),Object.freeze({code:"role:update",name:"Update Roles",description:"Update normal application roles.",resource:"role",action:"update"}),Object.freeze({code:"role:delete",name:"Delete Roles",description:"Delete normal application roles where permitted.",resource:"role",action:"delete"}),Object.freeze({code:"permission:read",name:"Read Permissions",description:"View permissions.",resource:"permission",action:"read"}),Object.freeze({code:"permission:create",name:"Create Permissions",description:"Create application permissions where permitted.",resource:"permission",action:"create"}),Object.freeze({code:"permission:update",name:"Update Permissions",description:"Update application permissions where permitted.",resource:"permission",action:"update"}),Object.freeze({code:"permission:delete",name:"Delete Permissions",description:"Delete application permissions where permitted.",resource:"permission",action:"delete"}),Object.freeze({code:"organization:read",name:"Read Organizations",description:"View organization records.",resource:"organization",action:"read"}),Object.freeze({code:"organization:create",name:"Create Organizations",description:"Create organizations.",resource:"organization",action:"create"}),Object.freeze({code:"organization:update",name:"Update Organizations",description:"Update organization records.",resource:"organization",action:"update"}),Object.freeze({code:"organization:delete",name:"Delete Organizations",description:"Deactivate organizations where permitted.",resource:"organization",action:"delete"}),Object.freeze({code:"department:read",name:"Read Departments",description:"View department records.",resource:"department",action:"read"}),Object.freeze({code:"department:create",name:"Create Departments",description:"Create departments.",resource:"department",action:"create"}),Object.freeze({code:"department:update",name:"Update Departments",description:"Update department records.",resource:"department",action:"update"}),Object.freeze({code:"department:delete",name:"Delete Departments",description:"Deactivate departments where permitted.",resource:"department",action:"delete"}),Object.freeze({code:"employee:read",name:"Read Employees",description:"View employee records.",resource:"employee",action:"read"}),Object.freeze({code:"employee:create",name:"Create Employees",description:"Create employee records.",resource:"employee",action:"create"}),Object.freeze({code:"employee:update",name:"Update Employees",description:"Update employee records.",resource:"employee",action:"update"}),Object.freeze({code:"employee:delete",name:"Delete Employees",description:"Deactivate employee records.",resource:"employee",action:"delete"}),Object.freeze({code:"ticket:read",name:"Read Tickets",description:"View tickets.",resource:"ticket",action:"read"}),Object.freeze({code:"ticket:create",name:"Create Tickets",description:"Create tickets.",resource:"ticket",action:"create"}),Object.freeze({code:"ticket:update",name:"Update Tickets",description:"Update tickets.",resource:"ticket",action:"update"}),Object.freeze({code:"ticket:assign",name:"Assign Tickets",description:"Assign and reassign tickets.",resource:"ticket",action:"assign"}),Object.freeze({code:"ticket:resolve",name:"Resolve Tickets",description:"Resolve tickets.",resource:"ticket",action:"resolve"}),Object.freeze({code:"ticket:close",name:"Close Tickets",description:"Close tickets.",resource:"ticket",action:"close"}),Object.freeze({code:"sla:read",name:"Read SLA",description:"View SLA configuration and information.",resource:"sla",action:"read"}),Object.freeze({code:"sla:create",name:"Create SLA",description:"Create SLA policies.",resource:"sla",action:"create"}),Object.freeze({code:"sla:update",name:"Update SLA",description:"Update SLA policies.",resource:"sla",action:"update"}),Object.freeze({code:"sla:delete",name:"Delete SLA",description:"Delete SLA policies where permitted.",resource:"sla",action:"delete"}),Object.freeze({code:"dashboard:read",name:"Read Dashboard",description:"View role-authorized dashboards.",resource:"dashboard",action:"read"}),Object.freeze({code:"service_type:read",name:"Read Service Type",description:"View service type configuration and information.",resource:"service_type",action:"read"}),Object.freeze({code:"service_type:create",name:"Create Service Type",description:"Create service type entries.",resource:"service_type",action:"create"}),Object.freeze({code:"service_type:update",name:"Update Service Type",description:"Update service type entries.",resource:"service_type",action:"update"}),Object.freeze({code:"service_type:delete",name:"Delete Service Type",description:"Delete service type entries where permitted.",resource:"service_type",action:"delete"}),Object.freeze({code:"district:read",name:"Read District",description:"View district configuration and information.",resource:"district",action:"read"}),Object.freeze({code:"district:create",name:"Create District",description:"Create district entries.",resource:"district",action:"create"}),Object.freeze({code:"district:update",name:"Update District",description:"Update district entries.",resource:"district",action:"update"}),Object.freeze({code:"district:delete",name:"Delete District",description:"Delete district entries where permitted.",resource:"district",action:"delete"}),Object.freeze({code:"ticket_category:read",name:"Read Ticket Category",description:"View ticket category configuration and information.",resource:"ticket_category",action:"read"}),Object.freeze({code:"ticket_category:create",name:"Create Ticket Category",description:"Create ticket categories.",resource:"ticket_category",action:"create"}),Object.freeze({code:"ticket_category:update",name:"Update Ticket Category",description:"Update ticket categories.",resource:"ticket_category",action:"update"}),Object.freeze({code:"ticket_category:delete",name:"Delete Ticket Category",description:"Delete ticket categories where permitted.",resource:"ticket_category",action:"delete"}),Object.freeze({code:"problem_statement:read",name:"Read Problem Statement",description:"View problem statement configuration and information.",resource:"problem_statement",action:"read"}),Object.freeze({code:"problem_statement:create",name:"Create Problem Statement",description:"Create problem statements.",resource:"problem_statement",action:"create"}),Object.freeze({code:"problem_statement:update",name:"Update Problem Statement",description:"Update problem statements.",resource:"problem_statement",action:"update"}),Object.freeze({code:"problem_statement:delete",name:"Delete Problem Statement",description:"Delete problem statements where permitted.",resource:"problem_statement",action:"delete"}),Object.freeze({code:"current_bill_status:read",name:"Read Current Bill Status",description:"View current bill status configuration and information.",resource:"current_bill_status",action:"read"}),Object.freeze({code:"current_bill_status:create",name:"Create Current Bill Status",description:"Create current bill status entries.",resource:"current_bill_status",action:"create"}),Object.freeze({code:"current_bill_status:update",name:"Update Current Bill Status",description:"Update current bill status entries.",resource:"current_bill_status",action:"update"}),Object.freeze({code:"current_bill_status:delete",name:"Delete Current Bill Status",description:"Delete current bill status entries where permitted.",resource:"current_bill_status",action:"delete"}),Object.freeze({code:"ticket_status:read",name:"Read Ticket Status",description:"View ticket status configuration and information.",resource:"ticket_status",action:"read"}),Object.freeze({code:"ticket_status:create",name:"Create Ticket Status",description:"Create ticket statuses.",resource:"ticket_status",action:"create"}),Object.freeze({code:"ticket_status:update",name:"Update Ticket Status",description:"Update ticket statuses.",resource:"ticket_status",action:"update"}),Object.freeze({code:"ticket_status:delete",name:"Delete Ticket Status",description:"Delete ticket statuses where permitted.",resource:"ticket_status",action:"delete"}),Object.freeze({code:"ticket_severity:read",name:"Read Ticket Severity",description:"View ticket severity configuration and information.",resource:"ticket_severity",action:"read"}),Object.freeze({code:"ticket_severity:create",name:"Create Ticket Severity",description:"Create ticket severity entries.",resource:"ticket_severity",action:"create"}),Object.freeze({code:"ticket_severity:update",name:"Update Ticket Severity",description:"Update ticket severity entries.",resource:"ticket_severity",action:"update"}),Object.freeze({code:"ticket_severity:delete",name:"Delete Ticket Severity",description:"Delete ticket severity entries where permitted.",resource:"ticket_severity",action:"delete"}),Object.freeze({code:"ticket_issue_category:read",name:"Read Ticket Issue Category",description:"View ticket issue category configuration and information.",resource:"ticket_issue_category",action:"read"}),Object.freeze({code:"ticket_issue_category:create",name:"Create Ticket Issue Category",description:"Create ticket issue categories.",resource:"ticket_issue_category",action:"create"}),Object.freeze({code:"ticket_issue_category:update",name:"Update Ticket Issue Category",description:"Update ticket issue categories.",resource:"ticket_issue_category",action:"update"}),Object.freeze({code:"ticket_issue_category:delete",name:"Delete Ticket Issue Category",description:"Delete ticket issue categories where permitted.",resource:"ticket_issue_category",action:"delete"}),Object.freeze({code:"ticket_dependency_category:read",name:"Read Ticket Dependency Category",description:"View ticket dependency category configuration and information.",resource:"ticket_dependency_category",action:"read"}),Object.freeze({code:"ticket_dependency_category:create",name:"Create Ticket Dependency Category",description:"Create ticket dependency categories.",resource:"ticket_dependency_category",action:"create"}),Object.freeze({code:"ticket_dependency_category:update",name:"Update Ticket Dependency Category",description:"Update ticket dependency categories.",resource:"ticket_dependency_category",action:"update"}),Object.freeze({code:"ticket_dependency_category:delete",name:"Delete Ticket Dependency Category",description:"Delete ticket dependency categories where permitted.",resource:"ticket_dependency_category",action:"delete"})]),q=Object.freeze(S.map(({code:e})=>e)),Y=Object.freeze(S.map(({code:e})=>e));function Pe(){let e=o.seeding?.developerUsername?.trim(),t=o.seeding?.developerEmail?.trim(),r=o.seeding?.developerPassword,s=o.seeding?.defaultOrganizationCode?.trim(),n=o.seeding?.defaultOrganizationName?.trim(),i=o.seeding?.defaultOrganizationStatus?.trim();if(!e)throw new Error("SEED_DEVELOPER_USERNAME is required.");if(!t)throw new Error("SEED_DEVELOPER_EMAIL is required.");if(!r)throw new Error("SEED_DEVELOPER_PASSWORD is required.");if(r.length<12)throw new Error("SEED_DEVELOPER_PASSWORD must contain at least 12 characters.");if(!s)throw new Error("DEFAULT_ORGANIZATION_CODE is required.");if(!n)throw new Error("DEFAULT_ORGANIZATION_NAME is required.");if(!i)throw new Error("DEFAULT_ORGANIZATION_STATUS is required.");if(!["active","inactive"].includes(i))throw new Error("DEFAULT_ORGANIZATION_STATUS must be either 'active' or 'inactive'.");return Object.freeze({username:e,email:t,password:r,defaultOrganizationCode:s,defaultOrganizationName:n,defaultOrganizationStatus:i})}function Me(){if(o.app.environment!=="development"&&o.app.environment!=="production")throw new Error("RBAC bootstrap seeder can only run in development or production environments.")}function He(){let e=new Set(w.map(({code:r})=>r));if(e.size!==w.length)throw new Error("Duplicate system role code detected.");if(!e.has("developer")||!e.has("superadmin"))throw new Error("Developer and Super Admin system roles are mandatory.");if(w.length!==2)throw new Error("Bootstrap seeder must contain exactly two system roles.");let t=new Set(S.map(({code:r})=>r));if(t.size!==S.length)throw new Error("Duplicate system permission code detected.");for(let r of S)if(r.code!==`${r.resource}:${r.action}`)throw new Error(`Permission code/resource/action mismatch: ${r.code}`);for(let r of q)if(!t.has(r))throw new Error(`Unknown Super Admin permission: ${r}`);for(let r of Y)if(!t.has(r))throw new Error(`Unknown Developer permission: ${r}`)}async function xe(e,t){let r=await e.query(`
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
            `,[N(),t.code,t.name,t.description])).rows[0];let s=r.rows[0];if(s.is_system!==!0||s.is_immutable!==!0||s.is_active!==!0)throw new Error(`Protected role '${t.code}' exists in an invalid state.`);if(s.name!==t.name)throw new Error(`Protected role '${t.code}' has an invalid name '${s.name}'.`);return s}async function Ve(e,t){return(await e.query(`
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
        `,[N(),t.code,t.name,t.description,t.resource,t.action])).rows[0]}async function B(e,t,r){await e.query(`
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
        `,[t,r])}async function Fe(e,t){let r=await e.query(`
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
        `,[t.username,t.email]);if(r.rowCount>0){let i=r.rows[0];if(i.username.toLowerCase()!==t.username.toLowerCase()||i.email.toLowerCase()!==t.email.toLowerCase())throw new Error("Developer bootstrap username/email conflicts with an existing user.");if(i.status!==$.ACTIVE)throw new Error("Existing Developer bootstrap user is not active.");return i}let s=await V.hashPassword(t.password);return(await e.query(`
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
        `,[N(),t.username,t.email,s,$.ACTIVE])).rows[0]}async function $e(e,t){return(await e.query(`
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
    `,[t.defaultOrganizationCode,t.defaultOrganizationName,t.defaultOrganizationDescription??null,t.defaultOrganizationStatus])).rows[0]}async function Be(e,t,r){await e.query(`
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
        `,[t,r])}async function qe(e,t,r,s){if((await e.query(`
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
            `,[s.id])).rows[0].count!==0)throw new Error("Super Admin role must not have an initial user assignment.");if((await e.query(`
                SELECT COUNT(*)::INTEGER AS count
                FROM roles
                WHERE code IN (
                    'developer',
                    'superadmin'
                )
            `)).rows[0].count!==2)throw new Error("Developer and Super Admin system-role validation failed.");a.info("RBAC bootstrap state validated successfully.",{developerUserId:t.id,developerRoleId:r.id,superadminRoleId:s.id})}async function Ye(){Me(),He();let e=Pe();await f.initialize();try{await C(async t=>{let r=H(t);await r.query("SET LOCAL app.rbac_bootstrap = 'true'");let s=new Map;for(let c of w){let m=await xe(r,c);s.set(m.code,m)}let n=s.get("developer"),i=s.get("superadmin");if(!n||!i)throw new Error("Required system roles are unavailable.");let E=new Map;for(let c of S){let m=await Ve(r,c);E.set(m.code,m)}for(let c of Y){let m=E.get(c);if(!m)throw new Error(`Developer permission was not found: ${c}`);await B(r,n.id,m.id)}for(let c of q){let m=E.get(c);if(!m)throw new Error(`Super Admin permission was not found: ${c}`);await B(r,i.id,m.id)}let d=await Fe(r,e),g=await $e(r,e);a.info("Default organization ensured.",{organizationId:g.id,organizationCode:g.code}),await Be(r,d.id,n.id),await qe(r,d,n,i),a.info("Initial RBAC bootstrap completed.",{roleCount:w.length,permissionCount:S.length,developerUser:d.email,superadminUserCount:0})})}finally{await f.close()}}try{await Ye(),a.info("RBAC bootstrap seeder completed successfully.")}catch(e){a.error("RBAC bootstrap seeder failed.",{message:e.message,stack:e.stack}),process.exitCode=1}
