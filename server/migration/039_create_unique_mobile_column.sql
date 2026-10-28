BEGIN;

ALTER TABLE
    contacts
ADD
    CONSTRAINT contacts_mobile_phone_unique UNIQUE (mobile_phone);

COMMIT;