-- Bank account number for sending the partner their monthly-fee payment
-- request (Qvik) to — plain text, no format validation, since IBANs and
-- domestic Hungarian account numbers (8/16/24-digit, hyphenated) both need
-- to fit and the admin enters it by hand.
alter table public.partners
  add column bank_account_number text;
