-- Seeds 12 test partners with 40-50 reviews each (mixed positive/negative,
-- spread across the last 75 days at varied hours) so the dashboard can be
-- inspected with realistic-looking data before real venues go live.
--
-- Every test partner's name starts with "TESZT – " specifically so it's
-- unmistakable in the admin lists and trivial to remove afterward:
--
--   delete from public.partners where name like 'TESZT – %';
-- (cascades to their submissions and submission_scores automatically)
--
-- Not a schema migration — this is one-off seed data, so it does NOT belong
-- in supabase/migrations/. Run once in the SQL Editor, then delete when done
-- looking.

do $$
declare
  v_qset uuid := '00000000-0000-0000-0000-000000000001';
  v_partner_id uuid;
  v_submission_id uuid;
  v_review_count int;
  v_days_back int;
  v_hour int;
  v_minute int;
  v_created_at timestamptz;
  v_email text;
  v_prize_id text;
  v_prize_consent_at timestamptz;
  v_score int;
  v_reason text;
  partner_rec record;
  aspect_rec record;
  i int;
  reasons_low text[] := array[
    'Sokat kellett várni.', 'Nem voltak elég figyelmesek.', 'Hidegen érkezett az étel.',
    'Zsúfolt volt, kevés a személyzet.', 'Nem volt tiszta az asztal.', 'Kicsit rendetlen volt a mosdó.'
  ];
  reasons_high text[] := array[
    'Nagyon kedvesek voltak!', 'Gyors és profi kiszolgálás.', 'Isteni volt minden.',
    'Tökéletes hangulat.', 'Mindig szívesen jövünk vissza.', 'Kifogástalan volt az egész élmény.'
  ];
begin
  for partner_rec in
    select * from (values
      ('TESZT – Kávézó Aurora',       'Váci utca 12, Budapest',       8.5, null::int, null::int),
      ('TESZT – Pizzéria Verde',      'Rákóczi út 45, Budapest',      7.8, null::int, null::int),
      ('TESZT – Bisztró Kilátó',      'Andrássy út 88, Budapest',     7.2, null::int, null::int),
      ('TESZT – Night Bar Eclipse',   'Kazinczy utca 21, Budapest',   6.5, 18, 2),
      ('TESZT – Gyros Sarok',         'Blaha Lujza tér 3, Budapest',  6.0, null::int, null::int),
      ('TESZT – Cukrászda Édenkert',  'Fő tér 5, Szeged',             8.2, 7, 15),
      ('TESZT – Sörkert Tölgyfa',     'Diófa utca 9, Debrecen',       5.2, 16, 0),
      ('TESZT – Reggeliző Napfény',   'Nap utca 2, Pécs',             7.6, 7, 13),
      ('TESZT – Étterem Óváros',      'Óváros tér 1, Sopron',         4.3, null::int, null::int),
      ('TESZT – Kávézó Kilátó Plaza', 'Bevásárló út 10, Győr',        6.8, null::int, null::int),
      ('TESZT – Wine Bar Szőlő',      'Szőlő utca 14, Eger',          7.9, 17, 1),
      ('TESZT – Gyorsbüfé Expressz',  'Vasút utca 7, Miskolc',        5.8, null::int, null::int)
    ) as t(name, address, baseline, open_hour, close_hour)
  loop
    insert into public.partners (name, address, question_set_id, alert_threshold, open_hour, close_hour)
    values (partner_rec.name, partner_rec.address, v_qset, 6.5, partner_rec.open_hour, partner_rec.close_hour)
    returning id into v_partner_id;

    v_review_count := 40 + floor(random() * 11)::int; -- 40-50

    for i in 1..v_review_count loop
      v_days_back := floor(random() * 75)::int;
      v_minute := floor(random() * 60)::int;

      -- Hour is drawn from the partner's own opening window when set
      -- (wrapping past midnight the same way partner_hour_bucket() does),
      -- otherwise from a plausible 8-20 daytime spread.
      if partner_rec.open_hour is not null then
        v_hour := (
          partner_rec.open_hour + floor(
            random() * (
              case when partner_rec.close_hour > partner_rec.open_hour
                then partner_rec.close_hour - partner_rec.open_hour
                else 24 - partner_rec.open_hour + partner_rec.close_hour
              end
            )
          )::int
        ) % 24;
      else
        v_hour := 8 + floor(random() * 13)::int;
      end if;

      -- Built in Budapest local time then converted to timestamptz, so the
      -- intended hour lands in the right bucket regardless of server tz.
      v_created_at := (
        date_trunc('day', (now() at time zone 'Europe/Budapest') - (v_days_back || ' days')::interval)
        + (v_hour || ' hours')::interval
        + (v_minute || ' minutes')::interval
      ) at time zone 'Europe/Budapest';

      if random() < 0.35 then
        v_email := 'vendeg' || floor(random() * 100000)::text || '@example.com';
        if random() < 0.5 then
          v_prize_id := gen_random_uuid()::text;
          v_prize_consent_at := v_created_at;
        else
          v_prize_id := null;
          v_prize_consent_at := null;
        end if;
      else
        v_email := null;
        v_prize_id := null;
        v_prize_consent_at := null;
      end if;

      v_submission_id := gen_random_uuid();
      insert into public.submissions (id, partner_id, created_at, email, prize_id, prize_consent_at)
      values (v_submission_id, v_partner_id, v_created_at, v_email, v_prize_id, v_prize_consent_at);

      for aspect_rec in select key from public.question_aspects where question_set_id = v_qset loop
        v_score := greatest(1, least(10, round(partner_rec.baseline + (random() * 4 - 2))::int));

        v_reason := null;
        if v_score <= 4 and random() < 0.3 then
          v_reason := reasons_low[1 + floor(random() * array_length(reasons_low, 1))::int];
        elsif v_score >= 9 and random() < 0.3 then
          v_reason := reasons_high[1 + floor(random() * array_length(reasons_high, 1))::int];
        end if;

        insert into public.submission_scores (submission_id, aspect_key, score, reason)
        values (v_submission_id, aspect_rec.key, v_score, v_reason);
      end loop;
    end loop;
  end loop;
end $$;
