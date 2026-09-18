# CRM HRMS SLA Test Module

This test module is designed for the current SLA implementation in the CRM For HRMS backend.

It uses Node's built-in `node:test` runner, so **no new test framework dependency is required**.

## Covered areas

### Business calendar
- Monday-Friday business days
- Saturday/Sunday exclusion
- Saturday/Sunday inclusion
- holidays
- inactive/invalid holiday inputs
- workday boundaries
- before/inside/at-end/after business window
- invalid calendars
- timezone conversion
- next business instant
- long non-business periods

### Business time
- same timestamp
- reversed timestamps
- before business hours
- after business hours
- partial workdays
- full workdays
- weekends
- holidays
- cross-week calculations
- multiple holidays
- timezone/DST-safe behavior
- adding business minutes
- exact boundary behavior
- zero minutes
- invalid duration
- long durations

### Resolver
- supported ticket fields
- unsupported fields
- null/empty values
- trimming
- case normalization
- stable machine-key behavior

### SLA invariants
- target/elapsed/remaining consistency
- terminal statuses
- open-segment invariants
- policy snapshot holiday representation
- segment consumption bounds
- run number invariants

## Important limitation

The repository currently has no test framework configured and the SLA engine directly imports its repository/service dependencies. Therefore these tests deliberately separate:

1. **pure deterministic unit tests** — run on every machine with no database;
2. **optional live API tests** — enabled only when explicit environment variables are supplied.

Do not make tests silently modify production data.

## Production recommendation

Run the unit suite on every commit and run the live API suite against a dedicated test database/environment.

---

## File structure

```text
server/
└── tests/
    └── sla/
        ├── README.md
        ├── test-fixtures.js
        ├── businessCalendar.test.js
        ├── businessTime.test.js
        ├── resolver.test.js
        ├── slaInvariants.test.js
        ├── slaSourceContracts.test.js
        └── apiSmoke.test.js
```

Copy this directory into:

```text
server/tests/sla
```

---

## 1. Add test script

Edit:

```text
server/package.json
```

Change:

```json
"test": "echo \"Error: no test specified\" && exit 1"
```

to:

```json
"test": "node --test tests/sla/*.test.js"
```

Optional additional scripts:

```json
"test:sla": "node --test tests/sla/*.test.js",
"test:sla:unit": "node --test tests/sla/businessCalendar.test.js tests/sla/businessTime.test.js tests/sla/resolver.test.js tests/sla/slaInvariants.test.js",
"test:sla:api": "node --test tests/sla/apiSmoke.test.js"
```

Because the current server package has no test runner configured, these use the Node built-in test runner. The current package already uses ES modules. 

---

## 2. Run unit tests

From:

```text
D:\Projects\crmForHRMS\server
```

run:

```cmd
npm test
```

or:

```cmd
npm run test:sla:unit
```

Expected:

```text
# tests ...
# pass ...
# fail 0
```

---

## 3. Run API smoke tests

These tests are intentionally disabled unless:

```text
SLA_TEST_BASE_URL
SLA_TEST_TOKEN
SLA_TEST_TICKET_ID
```

are provided.

Example CMD:

```cmd
set NODE_ENV=test
set SLA_TEST_BASE_URL=http://localhost:5000/api/v1
set SLA_TEST_TOKEN=YOUR_ACCESS_TOKEN
set SLA_TEST_TICKET_ID=YOUR_TEST_TICKET_UUID
npm run test:sla:api
```

PowerShell:

```powershell
$env:NODE_ENV="test"
$env:SLA_TEST_BASE_URL="http://localhost:5000/api/v1"
$env:SLA_TEST_TOKEN="YOUR_ACCESS_TOKEN"
$env:SLA_TEST_TICKET_ID="YOUR_TEST_TICKET_UUID"
npm run test:sla:api
```

The API suite is read-only.

---

## 4. CI requirement

Do not allow a merge if:

```text
npm run test:sla:unit
```

fails.

For integration CI, use a dedicated test database and dedicated test user/token.

Never point destructive integration tests at production.

---

## 5. Test philosophy

A passing test suite does not prove an SLA system is mathematically correct by itself.

The highest-risk SLA defects are:

```text
timezone conversion
business-window boundaries
holiday/date semantics
weekend handling
pause/resume accounting
severity changes
breach boundaries
terminal-state immutability
multiple open segments
historical policy snapshot integrity
```

The pure tests in this module target those failure classes first.
