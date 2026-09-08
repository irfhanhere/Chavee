-- ====================================================================
--  Chavee — complete the notifications system
--  Project dtokistffdnycrzbmxcr · Supabase Dashboard -> SQL Editor
--  Idempotent — safe to re-run.
--
--  Depends on Phase 3 (supabase_rls_lockdown_contact_notifications.sql)
--  already applied: notifications has no client INSERT policy, and
--  create_notification() is the only write path.
-- ====================================================================

begin;

-- ====================================================================
--  PART 1 — Realtime publication
-- ====================================================================
--  notifications: the useNotifications() hook subscribes with
--    filter: user_id=eq.<id>  — needs the table in the publication.
--  gig_contracts: Messages.jsx `payment-confirm:*` channel listens for
--    UPDATE ... payment_status='paid' — also missing.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    execute 'alter publication supabase_realtime add table public.notifications';
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'gig_contracts'
  ) then
    execute 'alter publication supabase_realtime add table public.gig_contracts';
  end if;
end $$;

-- Old clients filter notifications by user_id but Realtime RLS also
-- applies — notif_select_own (auth.uid() = user_id) already scopes each
-- socket to its own rows, so REPLICA IDENTITY DEFAULT (the PK) is enough.


-- ====================================================================
--  PART 3a — Preference gating, centralised in create_notification()
-- ====================================================================
--  notification_preferences is created per-user by create_default_settings
--  but never read. Gate every producer (existing triggers + the new ones
--  below) here, once. No prefs row => send (safe default).

create or replace function public._notification_pref_enabled(p_user_id uuid, p_type text)
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  p public.notification_preferences%rowtype;
  t text := lower(coalesce(p_type, ''));
begin
  select * into p from public.notification_preferences where user_id = p_user_id;
  if not found then
    return true;
  end if;
  return case
    when t in ('message', 'new_message')                       then coalesce(p.messages, true)
    when t in ('comment', 'post_comment', 'post_commented')    then coalesce(p.comments, true)
    when t in ('like', 'post_like', 'post_liked')              then coalesce(p.likes, true)
    when t in ('connection_request', 'connection_accepted',
               'follow', 'new_follower')                        then coalesce(p.connection_requests, true)
    when t = 'mention'                                          then coalesce(p.mentions, true)
    when t like 'gig%'                                          then coalesce(p.gig_updates, true)
    when t like 'job%'                                          then coalesce(p.job_notifs, true)
    when t like 'course%'                                       then coalesce(p.course_updates, true)
    when t like 'scholarship%'                                  then coalesce(p.scholarship_alerts, true)
    when t like 'event%'                                        then coalesce(p.event_reminders, true)
    when t like 'community%'                                    then coalesce(p.community_activity, true)
    when t like 'platform%'                                     then coalesce(p.platform_notifications, true)
    else true
  end;
end;
$$;

-- create_notification(): same signature, same grants (CREATE OR REPLACE
-- preserves them; Phase 3's REVOKE anon / search_path stay in effect).
create or replace function public.create_notification(
  p_user_id uuid, p_type text, p_title text,
  p_body text default null, p_link text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_user_id is null then
    return;
  end if;
  if not public._notification_pref_enabled(p_user_id, p_type) then
    return;
  end if;
  insert into public.notifications (user_id, type, title, body, link)
  values (p_user_id, p_type, p_title, p_body, p_link);
end;
$$;

revoke execute on function public._notification_pref_enabled(uuid, text) from anon;


-- ====================================================================
--  PART 2 — Fix notify_waitlist_on_publish()
-- ====================================================================
--  Was: INSERT INTO notifications (user_id, title, message, link, is_read)
--  -> `message` column does not exist -> every row threw, was swallowed by
--     EXCEPTION WHEN OTHERS, and the DELETE still ran => waitlist wiped,
--     zero notifications sent.
--  Now: routed through create_notification() (correct columns, pref-gated,
--  RLS-safe). Signature unchanged — 4 admin managers call it.

create or replace function public.notify_waitlist_on_publish(p_feature_key text, p_title text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  subscriber record;
begin
  for subscriber in
    select user_id
    from public.notify_subscribers
    where feature_key = p_feature_key and user_id is not null
  loop
    begin
      perform public.create_notification(
        subscriber.user_id,
        'platform',
        'Now live: ' || p_title,
        'The wait is over — "' || p_title || '" is now available on Chavee.',
        '/education'
      );
    exception when others then
      raise notice 'notify_waitlist_on_publish: notification failed for user %', subscriber.user_id;
    end;
  end loop;

  delete from public.notify_subscribers where feature_key = p_feature_key;
end;
$$;


-- ====================================================================
--  PART 3b — Fix the existing DM producer (stop the community storm)
-- ====================================================================
--  handle_new_message loops conversation_participants. Community channels
--  put every member in conversation_participants, so one channel message
--  currently fires a 'message' notification (wrong type, /messages link)
--  to every member. Skip community-channel conversations here — they get
--  their own 'community' notification below.

create or replace function public.handle_new_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  recipient uuid;
  sender_name text;
begin
  if exists (
    select 1 from public.community_channels cc where cc.conversation_id = new.conversation_id
  ) then
    return new;   -- handled by handle_community_channel_message
  end if;

  select full_name into sender_name from public.profiles where id = new.sender_id;

  for recipient in
    select user_id from public.conversation_participants
    where conversation_id = new.conversation_id and user_id <> new.sender_id
  loop
    perform public.create_notification(
      recipient, 'message', 'New message',
      coalesce(sender_name, 'Someone') || ' sent you a message.',
      '/messages?id=' || new.conversation_id
    );
  end loop;
  return new;
end;
$$;


-- ====================================================================
--  PART 3c — New producers
-- ====================================================================

-- ── community post / reply ─────────────────────────────────────────
--  A "reply" is just another message in the channel (messages has no
--  parent_id). Notifies every community member except the author,
--  pref-gated by community_activity. NOTE: still O(members) per message
--  — fine at pre-launch scale; revisit with a digest if communities grow.
create or replace function public.handle_community_channel_message()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_community_id uuid;
  v_channel_name text;
  v_slug text;
  v_sender_name text;
  member uuid;
begin
  select cc.community_id, cc.name into v_community_id, v_channel_name
  from public.community_channels cc
  where cc.conversation_id = new.conversation_id;

  if v_community_id is null then
    return new;   -- not a community channel
  end if;

  select coalesce(slug, id::text) into v_slug from public.communities where id = v_community_id;
  select full_name into v_sender_name from public.profiles where id = new.sender_id;

  for member in
    select user_id from public.community_members
    where community_id = v_community_id and user_id <> new.sender_id
  loop
    perform public.create_notification(
      member, 'community',
      'New activity in ' || coalesce(v_channel_name, 'a channel'),
      coalesce(v_sender_name, 'Someone') || ' posted in ' || coalesce(v_channel_name, 'the channel') || '.',
      '/network/' || v_slug
    );
  end loop;
  return new;
end;
$$;

drop trigger if exists on_community_channel_message on public.messages;
create trigger on_community_channel_message
  after insert on public.messages
  for each row execute function public.handle_community_channel_message();


-- ── connection accepted ────────────────────────────────────────────
--  handle_new_connection_request already covers the request itself.
--  This covers the response: notify the original sender when accepted.
create or replace function public.handle_connection_request_accepted()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'accepted' and coalesce(old.status, '') <> 'accepted' then
    perform public.create_notification(
      new.sender_id, 'connection_accepted', 'Connection accepted',
      (select full_name from public.profiles where id = new.receiver_id)
        || ' accepted your connection request.',
      '/profile/' || coalesce(
        (select username from public.profiles where id = new.receiver_id),
        new.receiver_id::text)
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_connection_request_accepted on public.connection_requests;
create trigger trg_connection_request_accepted
  after update on public.connection_requests
  for each row execute function public.handle_connection_request_accepted();


-- ── gig rejected ───────────────────────────────────────────────────
--  handle_gig_verified covers approval (verified false->true). Rejection
--  is a status change to 'rejected' (GigModerationQueue.performReject) —
--  no producer existed.
create or replace function public.handle_gig_rejected()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status = 'rejected' and coalesce(old.status, '') <> 'rejected' then
    perform public.create_notification(
      new.posted_by, 'gig_rejected', 'Gig listing needs changes',
      'Your gig "' || new.title
        || '" wasn''t approved. Open My Gigs -> Needs Attention to see why and resubmit.',
      '/earn'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists on_gig_rejected on public.gigs;
create trigger on_gig_rejected
  after update on public.gigs
  for each row execute function public.handle_gig_rejected();


-- ── gig offer created / accepted / declined ────────────────────────
create or replace function public.handle_gig_offer()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_recipient uuid;
  v_title text;
begin
  select title into v_title from public.gigs where id = new.gig_id;

  if tg_op = 'INSERT' then
    -- notify whoever receives the offer (opposite end of the direction)
    v_recipient := case when new.direction = 'buyer_to_seller' then new.seller_id else new.buyer_id end;
    perform public.create_notification(
      v_recipient, 'gig_offer', 'New offer',
      'You have a new offer on "' || coalesce(v_title, 'a gig') || '".',
      '/messages'
    );

  elsif tg_op = 'UPDATE' and new.status is distinct from old.status then
    -- notify the party who sent the offer of the response
    v_recipient := case when new.direction = 'buyer_to_seller' then new.buyer_id else new.seller_id end;
    if new.status = 'accepted' then
      perform public.create_notification(
        v_recipient, 'gig_offer', 'Offer accepted',
        'Your offer on "' || coalesce(v_title, 'a gig') || '" was accepted.', '/messages');
    elsif new.status = 'declined' then
      perform public.create_notification(
        v_recipient, 'gig_offer', 'Offer declined',
        'Your offer on "' || coalesce(v_title, 'a gig') || '" was declined.', '/messages');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_gig_offer_change on public.gig_offers;
create trigger on_gig_offer_change
  after insert or update on public.gig_offers
  for each row execute function public.handle_gig_offer();


-- ── gig application accepted / rejected ────────────────────────────
--  on_gig_application_completed handles 'completed'. This handles the
--  pick / decline of a pitch — notify the applicant.
create or replace function public.handle_gig_application_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_title text;
begin
  if new.status is not distinct from old.status then
    return new;
  end if;
  select title into v_title from public.gigs where id = new.gig_id;

  if lower(new.status) in ('accepted', 'hired') then
    perform public.create_notification(
      new.applicant_id, 'gig_application_accepted', 'Your pitch was accepted',
      'You were picked for "' || coalesce(v_title, 'a gig') || '".', '/earn');
  elsif lower(new.status) in ('rejected', 'declined') then
    perform public.create_notification(
      new.applicant_id, 'gig_application_rejected', 'Pitch not selected',
      'Your pitch for "' || coalesce(v_title, 'a gig') || '" wasn''t selected this time.', '/earn');
  end if;
  return new;
end;
$$;

drop trigger if exists on_gig_application_status on public.gig_applications;
create trigger on_gig_application_status
  after update on public.gig_applications
  for each row execute function public.handle_gig_application_status();


-- ── event reminder (scheduled, not a trigger) ─────────────────────
--  Notifies registrants of events starting within 24h, once each.
--  REQUIRES pg_cron (not currently installed). After enabling it, run:
--    create extension if not exists pg_cron;
--    select cron.schedule('event-reminders-hourly', '7 * * * *',
--      $cron$ select public.send_event_reminders() $cron$);
create or replace function public.send_event_reminders()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  r record;
begin
  for r in
    select er.user_id, e.id as event_id, e.title
    from public.events e
    join public.event_registrations er on er.event_id = e.id
    where e.event_date is not null
      and e.event_date between now() and now() + interval '24 hours'
      and not exists (
        select 1 from public.notifications n
        where n.user_id = er.user_id
          and n.type = 'event_reminder'
          and n.link = '/events/' || e.id
      )
  loop
    perform public.create_notification(
      r.user_id, 'event_reminder', 'Event starting soon',
      '"' || r.title || '" starts within 24 hours.', '/events/' || r.event_id);
  end loop;
end;
$$;

revoke execute on function public.send_event_reminders() from anon, authenticated;

commit;


-- ====================================================================
--  PART 2 verification — test insert (rolls back, writes nothing)
-- ====================================================================
do $$
declare
  v_uid uuid;
  v_before int;
  v_after int;
begin
  select user_id into v_uid from public.notify_subscribers where user_id is not null limit 1;
  if v_uid is null then
    select id into v_uid from auth.users limit 1;
  end if;
  if v_uid is null then
    raise notice 'PART 2 test skipped: no users found';
    return;
  end if;

  select count(*) into v_before from public.notifications where user_id = v_uid;
  perform public.create_notification(v_uid, 'platform', 'Now live: __test__',
    'notify_waitlist_on_publish column-fix smoke test', '/education');
  select count(*) into v_after from public.notifications where user_id = v_uid;

  if v_after = v_before + 1 then
    raise notice 'PART 2 test PASSED: create_notification inserted a row (body column OK)';
  else
    raise notice 'PART 2 test: no row inserted — user % likely has platform_notifications = false (also a valid outcome)', v_uid;
  end if;

  raise exception 'rollback test insert';   -- nothing is persisted
exception when others then
  if sqlerrm <> 'rollback test insert' then raise; end if;
end $$;


-- ====================================================================
--  General verification
-- ====================================================================
select tablename from pg_publication_tables
where pubname = 'supabase_realtime' and schemaname = 'public'
order by tablename;
-- expect: conversations, gig_contracts, messages, notifications

select tgname, tgrelid::regclass as on_table
from pg_trigger
where tgname in (
  'on_community_channel_message', 'trg_connection_request_accepted',
  'on_gig_rejected', 'on_gig_offer_change', 'on_gig_application_status'
)
order by tgname;
