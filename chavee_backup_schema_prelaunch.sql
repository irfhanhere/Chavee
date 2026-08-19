


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "hypopg" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "index_advisor" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."accept_connection_request"("p_request_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE v_sender uuid; v_receiver uuid; v_u1 uuid; v_u2 uuid;
BEGIN
  SELECT sender_id, receiver_id INTO v_sender, v_receiver
  FROM connection_requests WHERE id = p_request_id AND status = 'pending' AND receiver_id = auth.uid();
  IF NOT FOUND THEN RAISE EXCEPTION 'Request not found or not authorized'; END IF;
  UPDATE connection_requests SET status = 'accepted', responded_at = now() WHERE id = p_request_id;
  v_u1 := LEAST(v_sender, v_receiver); v_u2 := GREATEST(v_sender, v_receiver);
  INSERT INTO connections (user_one, user_two) VALUES (v_u1, v_u2) ON CONFLICT DO NOTHING;
  PERFORM create_notification(v_sender, 'connection', 'Connection accepted',
    (SELECT full_name FROM profiles WHERE id = v_receiver) || ' accepted your connection request.',
    '/profile/' || (SELECT username FROM profiles WHERE id = v_receiver));
END; $$;


ALTER FUNCTION "public"."accept_connection_request"("p_request_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."add_admin"("target_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can add admins';
  END IF;
  INSERT INTO admins(user_id) VALUES (target_user_id) ON CONFLICT DO NOTHING;
END $$;


ALTER FUNCTION "public"."add_admin"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_mark_withdrawal_paid"("p_withdrawal_id" "uuid", "p_utr_reference" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_rows int;
begin
  if not is_admin() then
    raise exception 'Not authorized';
  end if;

  update withdrawals
  set status = 'paid', paid_at = now(), utr_reference = p_utr_reference
  where id = p_withdrawal_id
    and status = 'requested';

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'Withdrawal not found or already marked paid';
  end if;

  update gig_contracts
  set payout_status = 'paid', payout_completed_at = now()
  where withdrawal_id = p_withdrawal_id
    and payout_status = 'requested';
end;
$$;


ALTER FUNCTION "public"."admin_mark_withdrawal_paid"("p_withdrawal_id" "uuid", "p_utr_reference" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_moderate_gig"("p_gig_id" "uuid", "p_action" "text", "p_reason" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Only admins can moderate gigs'; END IF;
  IF p_action NOT IN ('verify','reject','suspend','unsuspend','feature','unfeature','hide','unhide') THEN
    RAISE EXCEPTION 'Invalid action';
  END IF;
  UPDATE gigs SET
    verified = CASE WHEN p_action = 'verify' THEN true WHEN p_action = 'reject' THEN false ELSE verified END,
    verified_by = CASE WHEN p_action = 'verify' THEN auth.uid() ELSE verified_by END,
    verified_at = CASE WHEN p_action = 'verify' THEN now() ELSE verified_at END,
    status = CASE WHEN p_action = 'suspend' THEN 'suspended' WHEN p_action = 'unsuspend' THEN 'active' ELSE status END,
    featured = CASE WHEN p_action = 'feature' THEN true WHEN p_action = 'unfeature' THEN false ELSE featured END,
    admin_hidden = CASE WHEN p_action = 'hide' THEN true WHEN p_action = 'unhide' THEN false ELSE admin_hidden END
  WHERE id = p_gig_id;
  PERFORM log_admin_action('gig_' || p_action, 'gigs', p_gig_id, jsonb_build_object('reason', p_reason));
END $$;


ALTER FUNCTION "public"."admin_moderate_gig"("p_gig_id" "uuid", "p_action" "text", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_moderate_job"("p_job_id" "uuid", "p_action" "text", "p_reason" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Only admins can moderate jobs'; END IF;
  IF p_action NOT IN ('feature','unfeature','hide','unhide','close') THEN RAISE EXCEPTION 'Invalid action'; END IF;
  UPDATE jobs SET
    featured = CASE WHEN p_action = 'feature' THEN true WHEN p_action = 'unfeature' THEN false ELSE featured END,
    admin_hidden = CASE WHEN p_action = 'hide' THEN true WHEN p_action = 'unhide' THEN false ELSE admin_hidden END,
    status = CASE WHEN p_action = 'close' THEN 'closed' ELSE status END
  WHERE id = p_job_id;
  PERFORM log_admin_action('job_' || p_action, 'jobs', p_job_id, jsonb_build_object('reason', p_reason));
END $$;


ALTER FUNCTION "public"."admin_moderate_job"("p_job_id" "uuid", "p_action" "text", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_resolve_dispute"("p_dispute_id" "uuid", "p_resolution" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_rows int;
begin
  if not is_admin() then
    raise exception 'Not authorized';
  end if;
  if p_resolution is null or length(trim(p_resolution)) = 0 then
    raise exception 'Resolution notes are required';
  end if;

  update disputes
  set status = 'resolved', resolution = p_resolution, resolved_by = auth.uid(), resolved_at = now()
  where id = p_dispute_id and status = 'open';

  get diagnostics v_rows = row_count;
  if v_rows = 0 then
    raise exception 'Dispute not found or already resolved';
  end if;
end;
$$;


ALTER FUNCTION "public"."admin_resolve_dispute"("p_dispute_id" "uuid", "p_resolution" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_set_gig_auto_approve"("p_user_id" "uuid", "p_value" boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Guard: only callable by an actual admin, checked inside the function,
  -- not left to RLS or the caller's honesty
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE profiles
  SET gig_auto_approve = p_value
  WHERE id = p_user_id;
END;
$$;


ALTER FUNCTION "public"."admin_set_gig_auto_approve"("p_user_id" "uuid", "p_value" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_set_job_application_status"("p_application_id" "uuid", "p_status" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Only admins can update application status'; END IF;
  IF p_status NOT IN ('submitted','review','interview','selected','rejected') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  UPDATE job_applications SET status = p_status WHERE id = p_application_id;
  PERFORM log_admin_action('job_app_status:' || p_status, 'jobs', p_application_id, NULL);
END $$;


ALTER FUNCTION "public"."admin_set_job_application_status"("p_application_id" "uuid", "p_status" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_set_user_status"("p_user_id" "uuid", "p_status" "text", "p_reason" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Only admins can change user status'; END IF;
  IF p_status NOT IN ('active','inactive','suspended','banned') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  UPDATE profiles SET status = p_status,
    ban_reason = CASE WHEN p_status = 'banned' THEN p_reason ELSE NULL END,
    banned_at = CASE WHEN p_status = 'banned' THEN now() ELSE NULL END,
    banned_by = CASE WHEN p_status = 'banned' THEN auth.uid() ELSE NULL END
  WHERE id = p_user_id;
  PERFORM log_admin_action('set_user_status:' || p_status, 'users', p_user_id, jsonb_build_object('reason', p_reason));
END $$;


ALTER FUNCTION "public"."admin_set_user_status"("p_user_id" "uuid", "p_status" "text", "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_toggle_report_content"("p_report_id" "uuid", "p_hide" boolean) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_post_id UUID; v_gig_id UUID; v_job_id UUID;
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Only admins can hide reported content'; END IF;
  SELECT post_id, gig_id, job_id INTO v_post_id, v_gig_id, v_job_id
  FROM reports_moderation WHERE id = p_report_id;

  IF v_post_id IS NOT NULL THEN
    UPDATE posts SET hidden_by_admin = p_hide WHERE id = v_post_id;
  ELSIF v_gig_id IS NOT NULL THEN
    UPDATE gigs SET admin_hidden = p_hide WHERE id = v_gig_id;
  ELSIF v_job_id IS NOT NULL THEN
    UPDATE jobs SET admin_hidden = p_hide WHERE id = v_job_id;
  ELSE
    RAISE EXCEPTION 'This report has no hideable content (message or user report)';
  END IF;

  PERFORM log_admin_action(
    CASE WHEN p_hide THEN 'report_content_hide' ELSE 'report_content_unhide' END,
    'reports', p_report_id, NULL
  );
END $$;


ALTER FUNCTION "public"."admin_toggle_report_content"("p_report_id" "uuid", "p_hide" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."admin_update_report_status"("p_report_id" "uuid", "p_status" "text", "p_notes" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Only admins can update report status'; END IF;
  IF p_status NOT IN ('Pending','In Review','Resolved','Dismissed') THEN RAISE EXCEPTION 'Invalid status'; END IF;
  UPDATE reports_moderation SET
    status = p_status,
    resolution_notes = COALESCE(p_notes, resolution_notes),
    resolved_by = CASE WHEN p_status IN ('Resolved','Dismissed') THEN auth.uid() ELSE resolved_by END,
    resolved_at = CASE WHEN p_status IN ('Resolved','Dismissed') THEN now() ELSE resolved_at END
  WHERE id = p_report_id;
  PERFORM log_admin_action('report_status:' || p_status, 'reports', p_report_id, jsonb_build_object('notes', p_notes));
END $$;


ALTER FUNCTION "public"."admin_update_report_status"("p_report_id" "uuid", "p_status" "text", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."approve_work"("p_contract_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update gig_contracts
  set status = 'approved', approved_at = now()
  where id = p_contract_id and buyer_id = auth.uid() and status = 'submitted';

  if not found then
    raise exception 'Contract not found, not yours, or not awaiting approval';
  end if;
end;
$$;


ALTER FUNCTION "public"."approve_work"("p_contract_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."award_xp_for_gig_creation"("p_gig_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_poster_id uuid;
BEGIN
    SELECT posted_by INTO v_poster_id FROM public.gigs WHERE id = p_gig_id;
    IF v_poster_id IS NOT NULL THEN
        UPDATE public.user_gamification
        SET points = points + 50,
            badges = CASE 
                WHEN NOT ('Gig Pioneer' = ANY(badges)) THEN array_append(badges, 'Gig Pioneer')
                ELSE badges 
            END
        WHERE user_id = v_poster_id;
    END IF;
END;
$$;


ALTER FUNCTION "public"."award_xp_for_gig_creation"("p_gig_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."award_xp_for_job_application"("p_application_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    v_applicant_id uuid;
BEGIN
    SELECT user_id INTO v_applicant_id FROM public.job_applications WHERE id = p_application_id;
    IF v_applicant_id IS NOT NULL THEN
        UPDATE public.user_gamification
        SET points = points + 25
        WHERE user_id = v_applicant_id;
    END IF;
END;
$$;


ALTER FUNCTION "public"."award_xp_for_job_application"("p_application_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."award_xp_internal"("p_user_id" "uuid", "p_amount" integer) RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF p_amount <= 0 OR p_amount > 200 THEN
    RAISE EXCEPTION 'Invalid XP amount';
  END IF;
  INSERT INTO user_gamification (user_id, points, level, badges)
  VALUES (p_user_id, p_amount, 1, ARRAY[]::text[])
  ON CONFLICT (user_id) DO UPDATE SET points = user_gamification.points + p_amount;
END $$;


ALTER FUNCTION "public"."award_xp_internal"("p_user_id" "uuid", "p_amount" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."award_xp_internal"("p_user_id" "uuid", "p_amount" integer, "p_reason" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF p_amount <= 0 OR p_amount > 200 THEN
    RAISE EXCEPTION 'Invalid XP amount';
  END IF;
  INSERT INTO user_gamification (user_id, points, level, badges)
  VALUES (p_user_id, p_amount, 1, ARRAY[]::text[])
  ON CONFLICT (user_id) DO UPDATE SET points = user_gamification.points + p_amount;
  INSERT INTO xp_history (user_id, amount, reason) VALUES (p_user_id, p_amount, p_reason);
END $$;


ALTER FUNCTION "public"."award_xp_internal"("p_user_id" "uuid", "p_amount" integer, "p_reason" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."complete_gig_application"("p_application_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_applicant_id UUID;
  v_gig_id UUID;
  v_gig_title TEXT;
  v_poster_id UUID;
BEGIN
  SELECT ga.applicant_id, ga.gig_id, g.title, g.posted_by
  INTO v_applicant_id, v_gig_id, v_gig_title, v_poster_id
  FROM public.gig_applications ga
  LEFT JOIN public.gigs g ON g.id = ga.gig_id
  WHERE ga.id = p_application_id;

  IF v_applicant_id IS NULL THEN RAISE EXCEPTION 'Application not found: %', p_application_id; END IF;
  IF auth.uid() != v_poster_id THEN RAISE EXCEPTION 'Only the gig poster can mark an application as complete'; END IF;

  UPDATE public.gig_applications SET status = 'Completed', updated_at = NOW() WHERE id = p_application_id;

  INSERT INTO public.user_gamification (user_id, points, level, badges)
  VALUES (v_applicant_id, 100, 1, ARRAY[]::text[])
  ON CONFLICT (user_id) DO UPDATE SET points = user_gamification.points + 100;

  PERFORM public.create_notification(
    p_user_id  := v_applicant_id,
    p_type     := 'gig_completed',
    p_title    := '🎉 Gig Completed!',
    p_body     := 'Your work on "' || COALESCE(v_gig_title, 'the gig') || '" has been marked complete. +100 XP!',
    p_link     := '/earn'
  );
END;
$$;


ALTER FUNCTION "public"."complete_gig_application"("p_application_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_settings"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.notification_preferences (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO public.privacy_settings (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO public.user_preferences (user_id) VALUES (NEW.id) ON CONFLICT DO NOTHING;
  INSERT INTO public.subscriptions (user_id, plan_name) VALUES (NEW.id, 'Free') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_default_settings"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_body" "text" DEFAULT NULL::"text", "p_link" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.notifications (user_id, type, title, body, link)
  values (p_user_id, p_type, p_title, p_body, p_link);
end;
$$;


ALTER FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_body" "text", "p_link" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_withdrawal_request"("p_upi_id" "text") RETURNS TABLE("withdrawal_id" "uuid", "amount" numeric, "contract_count" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_seller_id uuid := auth.uid();
  v_withdrawal_id uuid;
  v_amount numeric;
  v_ids uuid[];
begin
  if v_seller_id is null then
    raise exception 'Not authenticated';
  end if;
  if p_upi_id is null or length(trim(p_upi_id)) = 0 then
    raise exception 'UPI ID is required';
  end if;

  with eligible as (
    select id
    from gig_contracts
    where seller_id = v_seller_id
      and status = 'approved'
      and payout_status = 'unwithdrawn'
      and approved_at <= now() - interval '7 days'
    for update
  ),
  claimed as (
    update gig_contracts
    set payout_status = 'requested'
    from eligible
    where gig_contracts.id = eligible.id
    returning gig_contracts.id, gig_contracts.seller_net_amount
  )
  select array_agg(id), coalesce(sum(seller_net_amount), 0)
  into v_ids, v_amount
  from claimed;

  if v_ids is null or array_length(v_ids, 1) is null then
    raise exception 'No eligible earnings to withdraw yet';
  end if;

  insert into withdrawals (seller_id, amount, status, bank_details_snapshot, requested_at, expected_by)
  values (v_seller_id, v_amount, 'requested', jsonb_build_object('upi_id', p_upi_id), now(), now() + interval '24 hours')
  returning id into v_withdrawal_id;

  update gig_contracts
  set withdrawal_id = v_withdrawal_id
  where id = any(v_ids);

  return query select v_withdrawal_id, v_amount, array_length(v_ids, 1);
end;
$$;


ALTER FUNCTION "public"."create_withdrawal_request"("p_upi_id" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."delete_channel"("p_channel_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_created_by uuid;
  v_conversation_id uuid;
  v_is_admin boolean;
BEGIN
  SELECT created_by, conversation_id INTO v_created_by, v_conversation_id
  FROM community_channels WHERE id = p_channel_id;

  IF NOT FOUND THEN
    RETURN false; -- channel doesn't exist
  END IF;

  SELECT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()) INTO v_is_admin;

  IF v_created_by IS DISTINCT FROM auth.uid() AND NOT v_is_admin THEN
    RAISE EXCEPTION 'Not authorized to delete this channel';
  END IF;

  IF v_conversation_id IS NOT NULL THEN
    DELETE FROM messages WHERE conversation_id = v_conversation_id;
    DELETE FROM conversation_participants WHERE conversation_id = v_conversation_id;
    DELETE FROM conversations WHERE id = v_conversation_id;
  END IF;

  DELETE FROM community_channels WHERE id = p_channel_id;

  RETURN true;
END;
$$;


ALTER FUNCTION "public"."delete_channel"("p_channel_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."deliver_work"("p_contract_id" "uuid", "p_delivery_message" "text" DEFAULT NULL::"text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update gig_contracts
  set status = 'submitted', work_submitted_at = now(), delivery_message = p_delivery_message
  where id = p_contract_id and seller_id = auth.uid() and status = 'in_progress';

  if not found then
    raise exception 'Contract not found, not yours, or not in progress';
  end if;
end;
$$;


ALTER FUNCTION "public"."deliver_work"("p_contract_id" "uuid", "p_delivery_message" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_dashboard_stats"() RETURNS TABLE("total_users" bigint, "new_users_today" bigint, "active_users" bigint, "total_communities" bigint, "total_jobs" bigint, "total_gigs" bigint, "total_events" bigint, "total_courses" bigint, "total_scholarships" bigint, "pending_gig_verification" bigint, "pending_reports" bigint)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Admin access required'; END IF;
  RETURN QUERY SELECT
    (SELECT COUNT(*) FROM profiles),
    (SELECT COUNT(*) FROM profiles WHERE created_at::date = CURRENT_DATE),
    (SELECT COUNT(*) FROM profiles WHERE last_active_at > now() - interval '7 days'),
    (SELECT COUNT(*) FROM communities),
    (SELECT COUNT(*) FROM jobs),
    (SELECT COUNT(*) FROM gigs),
    (SELECT COUNT(*) FROM events),
    (SELECT COUNT(*) FROM courses),
    (SELECT COUNT(*) FROM scholarships),
    (SELECT COUNT(*) FROM gigs WHERE verified = false),
    (SELECT COUNT(*) FROM reports_moderation WHERE status = 'Pending');
END $$;


ALTER FUNCTION "public"."get_admin_dashboard_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_landing_stats"() RETURNS TABLE("student_count" bigint, "live_event_count" bigint, "community_count" bigint)
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT
    (SELECT COUNT(*) FROM profiles) AS student_count,
    (SELECT COUNT(*) FROM events WHERE status IN ('live','coming_soon')) AS live_event_count,
    (SELECT COUNT(*) FROM communities) AS community_count;
$$;


ALTER FUNCTION "public"."get_landing_stats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_community_member_leave"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    DELETE FROM public.conversation_participants
    WHERE user_id = OLD.user_id 
    AND conversation_id IN (
        SELECT conversation_id 
        FROM public.community_channels 
        WHERE community_id = OLD.community_id
    );
    RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."handle_community_member_leave"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_event_registration"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  perform public.create_notification(
    new.user_id, 'event', 'Registration confirmed',
    'You''re registered for ' || (select title from public.events where id = new.event_id) || '.',
    '/events/' || new.event_id
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_event_registration"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_gig_application_completed"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  if lower(new.status) = 'completed' and lower(old.status) <> 'completed' then
    perform public.create_notification(
      (select posted_by from public.gigs where id = new.gig_id),
      'gig_completed', 'Gig marked completed',
      (select full_name from public.profiles where id = new.applicant_id)
        || ' marked "' || (select title from public.gigs where id = new.gig_id) || '" as completed.',
      '/earn/gigs/' || new.gig_id
    );
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_gig_application_completed"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_gig_proposal"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_conversation_id UUID;
  v_gig_poster_id UUID;
BEGIN
  SELECT posted_by INTO v_gig_poster_id FROM public.gigs WHERE id = NEW.gig_id;
  IF v_gig_poster_id IS NULL OR v_gig_poster_id = NEW.applicant_id THEN RETURN NEW; END IF;

  SELECT cp1.conversation_id INTO v_conversation_id
  FROM public.conversation_participants cp1
  INNER JOIN public.conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = v_gig_poster_id AND cp2.user_id = NEW.applicant_id
  LIMIT 1;

  IF v_conversation_id IS NULL THEN
    INSERT INTO public.conversations (created_at) VALUES (NOW()) RETURNING id INTO v_conversation_id;
    INSERT INTO public.conversation_participants (conversation_id, user_id)
    VALUES (v_conversation_id, v_gig_poster_id), (v_conversation_id, NEW.applicant_id)
    ON CONFLICT (conversation_id, user_id) DO NOTHING;
  END IF;

  NEW.conversation_id := v_conversation_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_gig_proposal"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_gig_verified"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  if new.verified = true and old.verified = false then
    perform public.create_notification(
      new.posted_by, 'gig_approved', 'Your gig was approved',
      'Your listing "' || new.title || '" is now live on Chavee.',
      '/earn/gigs/' || new.id
    );
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_gig_verified"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_comment"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare post_owner uuid;
begin
  select user_id into post_owner from public.posts where id = new.post_id;
  if post_owner is not null and post_owner <> new.user_id then
    perform public.create_notification(
      post_owner, 'comment', 'New comment',
      (select full_name from public.profiles where id = new.user_id) || ' commented on your post.',
      '/posts/' || new.post_id
    );
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_comment"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_community"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare new_conv_id uuid;
begin
  insert into public.conversations default values returning id into new_conv_id;
  update public.communities set conversation_id = new_conv_id where id = new.id;
  if new.created_by is not null then
    insert into public.conversation_participants (conversation_id, user_id)
    values (new_conv_id, new.created_by)
    on conflict do nothing;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_community"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_community_channel"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  insert into public.community_channels (community_id, name, description, conversation_id)
  values (new.id, 'General', 'Main discussion for this community', new.conversation_id);
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_community_channel"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_community_member"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare conv_id uuid;
begin
  select conversation_id into conv_id from public.communities where id = new.community_id;
  if conv_id is not null then
    insert into public.conversation_participants (conversation_id, user_id)
    values (conv_id, new.user_id)
    on conflict do nothing;
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_community_member"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_connection_request"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM create_notification(NEW.receiver_id, 'connection_request', 'New connection request',
    (SELECT full_name FROM profiles WHERE id = NEW.sender_id) || ' sent you a connection request.',
    '/profile/' || (SELECT username FROM profiles WHERE id = NEW.sender_id));
  RETURN NEW;
END; $$;


ALTER FUNCTION "public"."handle_new_connection_request"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_follow"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
begin
  perform public.create_notification(
    new.following_id, 'follow', 'New follower',
    (select full_name from public.profiles where id = new.follower_id) || ' started following you.',
    '/profile/' || new.follower_id
  );
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_follow"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_gig_application"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  owner_id uuid;
  conv_id uuid;
begin
  select posted_by into owner_id from public.gigs where id = new.gig_id;

  -- Look for an existing 1:1 conversation between these two people
  select cp1.conversation_id into conv_id
  from public.conversation_participants cp1
  join public.conversation_participants cp2 on cp1.conversation_id = cp2.conversation_id
  where cp1.user_id = new.applicant_id and cp2.user_id = owner_id
  group by cp1.conversation_id
  having count(*) = (
    select count(*) from public.conversation_participants where conversation_id = cp1.conversation_id
  )
  limit 1;

  if conv_id is null then
    insert into public.conversations default values returning id into conv_id;
    insert into public.conversation_participants (conversation_id, user_id)
    values (conv_id, new.applicant_id), (conv_id, owner_id);
  end if;

  update public.gig_applications set conversation_id = conv_id where id = new.id;

  if new.pitch is not null and length(trim(new.pitch)) > 0 then
    insert into public.messages (conversation_id, sender_id, content)
    values (conv_id, new.applicant_id, new.pitch);
  end if;

  perform public.create_notification(
    owner_id, 'gig_application', 'New pitch for your gig',
    (select full_name from public.profiles where id = new.applicant_id)
      || ' sent a pitch for "' || (select title from public.gigs where id = new.gig_id) || '".',
    '/messages/' || conv_id
  );

  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_gig_application"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_like"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare post_owner uuid;
begin
  select user_id into post_owner from public.posts where id = new.post_id;
  if post_owner is not null and post_owner <> new.user_id then
    perform public.create_notification(
      post_owner, 'like', 'New like',
      (select full_name from public.profiles where id = new.user_id) || ' liked your post.',
      '/posts/' || new.post_id
    );
  end if;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_like"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_message"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare recipient uuid;
begin
  for recipient in
    select user_id from public.conversation_participants
    where conversation_id = new.conversation_id and user_id <> new.sender_id
  loop
    perform public.create_notification(
      recipient, 'message', 'New message',
      (select full_name from public.profiles where id = new.sender_id) || ' sent you a message.',
      '/messages/' || new.conversation_id
    );
  end loop;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_message"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
declare
  base_username text;
  final_username text;
begin
  base_username := coalesce(nullif(trim(new.raw_user_meta_data->>'user_name'), ''), split_part(new.email, '@', 1));
  final_username := base_username || '_' || substr(replace(new.id::text, '-', ''), 1, 6);

  insert into public.profiles (id, full_name, username, bio, profile_complete)
  values (
    new.id,
    coalesce(nullif(trim(new.raw_user_meta_data->>'full_name'), ''), split_part(new.email, '@', 1)),
    final_username,
    'New to Chavee!',
    false
  )
  on conflict (id) do nothing;

  insert into public.user_gamification (user_id, points, level, badges)
  values (new.id, 50, 'Bronze', array['Onboarding Explorer'])
  on conflict (user_id) do nothing;

  return new;
exception when others then
  -- Never block signup itself just because profile creation hit an edge case
  raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."hide_conversation"("p_conversation_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  update conversation_participants
  set hidden_at = now()
  where conversation_id = p_conversation_id
    and user_id = auth.uid();

  if not found then
    raise exception 'Conversation not found or you are not a participant';
  end if;
end;
$$;


ALTER FUNCTION "public"."hide_conversation"("p_conversation_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    AS $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_conversation_member"("conv_id" "uuid", "usr_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.conversation_participants
    WHERE conversation_id = conv_id AND user_id = usr_id
  );
$$;


ALTER FUNCTION "public"."is_conversation_member"("conv_id" "uuid", "usr_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_conversation_participant"("conv_id" "uuid") RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1 FROM conversation_participants
    WHERE conversation_id = conv_id
      AND user_id = auth.uid()
  );
$$;


ALTER FUNCTION "public"."is_conversation_participant"("conv_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."join_channel"("p_channel_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_conversation_id uuid;
BEGIN
  -- Get or create the conversation for this channel
  SELECT conversation_id INTO v_conversation_id
  FROM community_channels
  WHERE id = p_channel_id;

  IF v_conversation_id IS NULL THEN
    INSERT INTO conversations (created_at) VALUES (now())
    RETURNING id INTO v_conversation_id;

    UPDATE community_channels
    SET conversation_id = v_conversation_id
    WHERE id = p_channel_id;
  END IF;

  -- Add the calling user as a participant (idempotent)
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES (v_conversation_id, auth.uid())
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  RETURN v_conversation_id;
END;
$$;


ALTER FUNCTION "public"."join_channel"("p_channel_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_admin_action"("p_action" "text", "p_module" "text", "p_target_id" "uuid" DEFAULT NULL::"uuid", "p_details" "jsonb" DEFAULT NULL::"jsonb") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NOT is_admin() THEN RAISE EXCEPTION 'Only admins can log admin actions'; END IF;
  INSERT INTO admin_activity_logs (admin_id, action, module, target_id, details)
  VALUES (auth.uid(), p_action, p_module, p_target_id, p_details);
END $$;


ALTER FUNCTION "public"."log_admin_action"("p_action" "text", "p_module" "text", "p_target_id" "uuid", "p_details" "jsonb") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."log_user_activity"("p_user_id" "uuid", "p_type" "text", "p_description" "text", "p_reference_id" "uuid" DEFAULT NULL::"uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO user_activity (user_id, activity_type, description, reference_id)
  VALUES (p_user_id, p_type, p_description, p_reference_id);
END $$;


ALTER FUNCTION "public"."log_user_activity"("p_user_id" "uuid", "p_type" "text", "p_description" "text", "p_reference_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."manage_event_seats"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_seats_total integer;
  v_seats_filled integer;
  v_waitlist_enabled boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    SELECT seats_total, seats_filled, waitlist_enabled INTO v_seats_total, v_seats_filled, v_waitlist_enabled
    FROM events WHERE id = NEW.event_id FOR UPDATE;

    IF v_seats_total IS NOT NULL AND v_seats_filled >= v_seats_total THEN
      IF v_waitlist_enabled THEN
        NEW.status := 'waitlisted';
      ELSE
        RAISE EXCEPTION 'Event is full';
      END IF;
    END IF;

    IF NEW.status = 'confirmed' THEN
      UPDATE events SET seats_filled = seats_filled + 1 WHERE id = NEW.event_id;
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.status = 'confirmed' THEN
      UPDATE events SET seats_filled = GREATEST(seats_filled - 1, 0) WHERE id = OLD.event_id;
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."manage_event_seats"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_new_support_ticket"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    webhook_secret text;
BEGIN
    SELECT decrypted_secret INTO webhook_secret
    FROM vault.decrypted_secrets WHERE name = 'ticket_webhook_secret';

    PERFORM net.http_post(
        url := 'https://dtokistffdnycrzbmxcr.supabase.co/functions/v1/send-support-ticket-notification',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'x-webhook-secret', webhook_secret
        ),
        body := jsonb_build_object(
            'ticket_id', NEW.ticket_id,
            'subject', NEW.subject,
            'category', NEW.category,
            'message', NEW.message,
            'attachment_url', NEW.attachment_url,
            'created_at', NEW.created_at
        )
    );
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."notify_new_support_ticket"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."notify_waitlist_on_publish"("p_feature_key" "text", "p_title" "text") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    subscriber RECORD;
BEGIN
    FOR subscriber IN 
        SELECT user_id, id 
        FROM public.notify_subscribers 
        WHERE feature_key = p_feature_key 
    LOOP
        BEGIN
            INSERT INTO public.notifications (user_id, title, message, link, is_read)
            VALUES (
                subscriber.user_id, 
                'Now Live: ' || p_title, 
                'The wait is over! "' || p_title || '" is now available. Click here to check it out.', 
                '/education', 
                false
            );
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Failed to insert notification for user %', subscriber.user_id;
        END;
    END LOOP;
    -- ⚠️ DESTRUCTIVE: Removes users from waitlist after notifying
    DELETE FROM public.notify_subscribers WHERE feature_key = p_feature_key;
END;
$$;


ALTER FUNCTION "public"."notify_waitlist_on_publish"("p_feature_key" "text", "p_title" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_banned_user_join"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM community_bans WHERE community_id = NEW.community_id AND user_id = NEW.user_id) THEN
    RAISE EXCEPTION 'User is banned from this community';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_banned_user_join"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."prevent_gig_self_verification"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NEW.verified IS DISTINCT FROM OLD.verified AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only admins can change gig verification status';
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."prevent_gig_self_verification"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."raise_dispute"("p_contract_id" "uuid", "p_category" "text", "p_description" "text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_buyer_id uuid;
  v_payment_status text;
  v_dispute_id uuid;
  v_existing_open uuid;
  v_valid_categories text[] := array['non_delivery', 'quality_issue', 'post_approval_issue', 'other'];
begin
  select buyer_id, payment_status into v_buyer_id, v_payment_status
  from gig_contracts where id = p_contract_id for update;

  if v_buyer_id is null then
    raise exception 'Contract not found';
  end if;
  if auth.uid() != v_buyer_id then
    raise exception 'Not authorized';
  end if;
  if v_payment_status != 'paid' then
    raise exception 'Disputes can only be raised on paid contracts';
  end if;
  if p_category is null or not (p_category = any(v_valid_categories)) then
    raise exception 'Invalid category';
  end if;
  if p_description is null or length(trim(p_description)) = 0 then
    raise exception 'Please describe the issue';
  end if;

  select id into v_existing_open from disputes
  where gig_contract_id = p_contract_id and status = 'open' limit 1;
  if v_existing_open is not null then
    raise exception 'A dispute is already open on this contract';
  end if;

  insert into disputes (gig_contract_id, raised_by, category, description, status)
  values (p_contract_id, v_buyer_id, p_category, p_description, 'open')
  returning id into v_dispute_id;

  return v_dispute_id;
end;
$$;


ALTER FUNCTION "public"."raise_dispute"("p_contract_id" "uuid", "p_category" "text", "p_description" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."remove_admin"("target_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE admin_count int;
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can remove admins';
  END IF;
  IF target_user_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot remove yourself as admin';
  END IF;
  SELECT COUNT(*) INTO admin_count FROM admins;
  IF admin_count <= 1 THEN
    RAISE EXCEPTION 'Cannot remove the last remaining admin';
  END IF;
  DELETE FROM admins WHERE user_id = target_user_id;
END $$;


ALTER FUNCTION "public"."remove_admin"("target_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."request_revision"("p_contract_id" "uuid", "p_notes" "text") RETURNS TABLE("revisions_used" integer, "revisions_allowed" integer, "revisions_remaining" integer)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_buyer_id uuid;
  v_seller_id uuid;
  v_status text;
  v_revisions_used int;
  v_revisions_allowed int;
  v_gig_id uuid;
  v_gig_title text;
  v_conversation_id uuid;
begin
  select gc.buyer_id, gc.seller_id, gc.status, gc.revisions_used, gc.gig_id,
         coalesce(go.revisions, 0)
  into v_buyer_id, v_seller_id, v_status, v_revisions_used, v_gig_id, v_revisions_allowed
  from gig_contracts gc
  join gig_offers go on go.id = gc.gig_offer_id
  where gc.id = p_contract_id
  for update of gc;

  if v_buyer_id is null then
    raise exception 'Contract not found';
  end if;

  if auth.uid() != v_buyer_id then
    raise exception 'Not authorized';
  end if;

  if v_status != 'submitted' then
    raise exception 'Can only request a revision on a submitted delivery';
  end if;

  if v_revisions_used >= v_revisions_allowed then
    raise exception 'No revisions remaining on this offer';
  end if;

  if p_notes is null or length(trim(p_notes)) = 0 then
    raise exception 'Please describe what needs to change';
  end if;

  update gig_contracts
  set status = 'in_progress',
      revisions_used = v_revisions_used + 1,
      revision_notes = p_notes
  where id = p_contract_id;

  select title into v_gig_title from gigs where id = v_gig_id;

  select ga.conversation_id into v_conversation_id
  from gig_offers go
  join gig_applications ga on ga.id = go.gig_application_id
  where go.id = (select gig_offer_id from gig_contracts where id = p_contract_id);

  perform create_notification(
    p_user_id => v_seller_id,
    p_type => 'revision_requested',
    p_title => '🔁 Revision Requested',
    p_body => 'A revision was requested for "' || coalesce(v_gig_title, 'your gig') || '".',
    p_link => '/messages?id=' || v_conversation_id
  );

  return query select (v_revisions_used + 1), v_revisions_allowed, (v_revisions_allowed - v_revisions_used - 1);
end;
$$;


ALTER FUNCTION "public"."request_revision"("p_contract_id" "uuid", "p_notes" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."send_message"("p_conversation_id" "uuid", "p_content" "text", "p_file_url" "text" DEFAULT NULL::"text", "p_file_type" "text" DEFAULT NULL::"text") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
declare
  v_sender_id uuid := auth.uid();
  v_participant_count int;
  v_other_id uuid;
  v_is_gig boolean;
  v_is_connected boolean;
  v_last_sender uuid;
  v_message_id uuid;
begin
  if v_sender_id is null then
    raise exception 'Not authenticated';
  end if;

  if not exists (
    select 1 from conversation_participants
    where conversation_id = p_conversation_id and user_id = v_sender_id
  ) then
    raise exception 'Not a participant in this conversation';
  end if;

  select count(*) into v_participant_count
  from conversation_participants
  where conversation_id = p_conversation_id;

  if v_participant_count = 2 then
    select exists (
      select 1 from gig_applications where conversation_id = p_conversation_id
    ) into v_is_gig;

    if not v_is_gig then
      select user_id into v_other_id
      from conversation_participants
      where conversation_id = p_conversation_id and user_id != v_sender_id
      limit 1;

      select exists (
        select 1 from connections
        where (user_one = v_sender_id and user_two = v_other_id)
           or (user_two = v_sender_id and user_one = v_other_id)
      ) into v_is_connected;

      if not v_is_connected then
        -- FIX: check the LAST message's sender, not the first-ever sender.
        -- The old check let anyone who'd EVER sent one message stay exempt
        -- forever, regardless of who sent most recently. Confirmed real bug.
        select sender_id into v_last_sender
        from messages
        where conversation_id = p_conversation_id
        order by created_at desc limit 1;

        if v_last_sender is not null and v_last_sender != v_sender_id then
          raise exception 'You must be connected to reply in this conversation';
        end if;
      end if;
    end if;
  end if;

  insert into messages (conversation_id, sender_id, content, file_url, file_type)
  values (p_conversation_id, v_sender_id, p_content, p_file_url, p_file_type)
  returning id into v_message_id;

  return v_message_id;
end;
$$;


ALTER FUNCTION "public"."send_message"("p_conversation_id" "uuid", "p_content" "text", "p_file_url" "text", "p_file_type" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."start_direct_conversation"("other_user_id" "uuid") RETURNS "uuid"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  v_conversation_id uuid;
  v_current_user_id uuid;
BEGIN
  -- Get the current authenticated user's ID
  v_current_user_id := auth.uid();
  
  IF v_current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF v_current_user_id = other_user_id THEN
    RAISE EXCEPTION 'Cannot start a conversation with yourself';
  END IF;

  -- 1. Check if a direct conversation already exists between the two users
  SELECT cp1.conversation_id INTO v_conversation_id
  FROM public.conversation_participants cp1
  JOIN public.conversation_participants cp2 ON cp1.conversation_id = cp2.conversation_id
  WHERE cp1.user_id = v_current_user_id 
    AND cp2.user_id = other_user_id;

  -- 2. If it exists, return it
  IF v_conversation_id IS NOT NULL THEN
    RETURN v_conversation_id;
  END IF;

  -- 3. Otherwise, create a new conversation
  INSERT INTO public.conversations (created_at)
  VALUES (now())
  RETURNING id INTO v_conversation_id;

  -- 4. Add both participants to the conversation
  INSERT INTO public.conversation_participants (conversation_id, user_id)
  VALUES 
    (v_conversation_id, v_current_user_id),
    (v_conversation_id, other_user_id);

  RETURN v_conversation_id;
END;
$$;


ALTER FUNCTION "public"."start_direct_conversation"("other_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."test_func"() RETURNS "void"
    LANGUAGE "plpgsql"
    AS $$ BEGIN END; $$;


ALTER FUNCTION "public"."test_func"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."toggle_notify_me"("p_feature_key" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_user_id uuid;
  v_email text;
  v_exists boolean;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RETURN false;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;

  SELECT true INTO v_exists 
  FROM public.notify_subscribers 
  WHERE user_id = v_user_id AND feature_key = p_feature_key;
  
  IF v_exists THEN
    DELETE FROM public.notify_subscribers 
    WHERE user_id = v_user_id AND feature_key = p_feature_key;
    RETURN false;
  ELSE
    INSERT INTO public.notify_subscribers (user_id, email, feature_key) 
    VALUES (v_user_id, v_email, p_feature_key);
    RETURN true;
  END IF;
END;
$$;


ALTER FUNCTION "public"."toggle_notify_me"("p_feature_key" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admin_activity_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "admin_id" "uuid",
    "action" "text" NOT NULL,
    "module" "text",
    "target_id" "uuid",
    "details" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admin_activity_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."admins" (
    "user_id" "uuid" NOT NULL,
    "added_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "role" "text" DEFAULT 'admin'::"text",
    CONSTRAINT "admins_role_check" CHECK (("role" = ANY (ARRAY['super_admin'::"text", 'admin'::"text", 'moderator'::"text", 'content_manager'::"text"])))
);


ALTER TABLE "public"."admins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."badges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "icon_url" "text",
    "requirement_text" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."blogs_deprecated" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "summary" "text",
    "content" "text" NOT NULL,
    "category" "text" NOT NULL,
    "image_url" "text",
    "author" "text" DEFAULT 'Chavee Team'::"text",
    "published" boolean DEFAULT false,
    "slug" "text",
    "seo_title" "text",
    "seo_description" "text",
    "seo_keywords" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."blogs_deprecated" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."certificates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "event_id" "uuid" NOT NULL,
    "certificate_url" "text",
    "issued_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."certificates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."certifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "provider" "text" NOT NULL,
    "logo_url" "text",
    "description" "text",
    "difficulty" "text",
    "duration" "text",
    "category_id" "uuid",
    "is_coming_soon" boolean DEFAULT true,
    "featured" boolean DEFAULT false,
    "published" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "status" "text" DEFAULT 'Draft'::"text",
    "enrollment_url" "text"
);


ALTER TABLE "public"."certifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."communities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "guidelines" "text",
    "is_paid" boolean DEFAULT false NOT NULL,
    "price" numeric DEFAULT 0,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" character varying(50) DEFAULT 'Live'::character varying,
    "emoji" character varying(10) DEFAULT '🤝'::character varying,
    "conversation_id" "uuid",
    "slug" "text",
    "image_url" "text",
    "cover_image_url" "text",
    "short_description" "text",
    "welcome_message" "text",
    "featured" boolean DEFAULT false,
    "visibility" "text" DEFAULT 'public'::"text" NOT NULL,
    "logo_url" "text",
    "location" "text",
    CONSTRAINT "communities_visibility_check" CHECK (("visibility" = ANY (ARRAY['public'::"text", 'private'::"text", 'invite_only'::"text"])))
);


ALTER TABLE "public"."communities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_bans" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "community_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "banned_by" "uuid",
    "reason" "text",
    "banned_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."community_bans" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_channels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "community_id" "uuid",
    "name" "text" NOT NULL,
    "description" "text",
    "conversation_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "rules" "text",
    "is_event_channel" boolean DEFAULT false,
    "event_deadline" timestamp with time zone
);


ALTER TABLE "public"."community_channels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_join_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "community_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    CONSTRAINT "community_join_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."community_join_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_members" (
    "community_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "role" "text" DEFAULT 'member'::"text" NOT NULL,
    CONSTRAINT "community_members_role_check" CHECK (("role" = ANY (ARRAY['admin'::"text", 'moderator'::"text", 'member'::"text"])))
);


ALTER TABLE "public"."community_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."community_resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "community_id" "uuid" NOT NULL,
    "title" "text" NOT NULL,
    "resource_type" "text" NOT NULL,
    "url" "text" NOT NULL,
    "uploaded_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "community_resources_resource_type_check" CHECK (("resource_type" = ANY (ARRAY['pdf'::"text", 'drive_link'::"text", 'external_url'::"text"])))
);


ALTER TABLE "public"."community_resources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."companies" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "logo_url" "text",
    "website" "text",
    "location" "text",
    "description" "text",
    "is_official" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid"
);


ALTER TABLE "public"."companies" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."connected_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "provider" "text" NOT NULL,
    "provider_id" "text",
    "email" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."connected_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."connection_requests" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "receiver_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "responded_at" timestamp with time zone,
    CONSTRAINT "connection_requests_check" CHECK (("sender_id" <> "receiver_id")),
    CONSTRAINT "connection_requests_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'accepted'::"text", 'declined'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."connection_requests" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."connections" (
    "user_one" "uuid" NOT NULL,
    "user_two" "uuid" NOT NULL,
    "connected_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "connections_check" CHECK (("user_one" < "user_two"))
);


ALTER TABLE "public"."connections" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."contact_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "query_type" "text",
    "message" "text" NOT NULL,
    "agreed_to_terms" boolean DEFAULT false NOT NULL,
    "status" "text" DEFAULT 'new'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."contact_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."content" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content_type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text",
    "summary" "text",
    "body" "text",
    "category" "text",
    "author" "text" DEFAULT 'Chavee Team'::"text",
    "image_url" "text",
    "published" boolean DEFAULT false NOT NULL,
    "featured" boolean DEFAULT false NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "scheduled_at" timestamp with time zone,
    "seo_title" "text",
    "seo_description" "text",
    "seo_keywords" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "views" integer DEFAULT 0 NOT NULL,
    CONSTRAINT "content_content_type_check" CHECK (("content_type" = ANY (ARRAY['blog'::"text", 'press_release'::"text", 'announcement'::"text", 'homepage_banner'::"text", 'faq'::"text", 'guideline_section'::"text", 'perk'::"text"]))),
    CONSTRAINT "content_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'scheduled'::"text", 'archived'::"text"])))
);


ALTER TABLE "public"."content" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_participants" (
    "conversation_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "hidden_at" timestamp with time zone
);


ALTER TABLE "public"."conversation_participants" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "type" "text" DEFAULT 'dm'::"text" NOT NULL
);


ALTER TABLE "public"."conversations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "type" "text" NOT NULL,
    "level" "text",
    "instructor_name" "text",
    "schedule" "text",
    "price" numeric DEFAULT 0,
    "status" "text" DEFAULT 'coming_soon'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "category_id" "uuid",
    "banner_url" "text",
    "is_coming_soon" boolean DEFAULT false,
    "is_featured" boolean DEFAULT false,
    "short_description" "text",
    "estimated_launch_date" "text",
    "tags" "text"[] DEFAULT '{}'::"text"[],
    "duration" "text",
    "language" "text"
);


ALTER TABLE "public"."courses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."courses_v2" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "category_id" "uuid",
    "banner_url" "text",
    "thumbnail_url" "text",
    "instructor" "text",
    "duration" "text",
    "difficulty" "text",
    "tags" "text"[],
    "estimated_launch" "date",
    "is_coming_soon" boolean DEFAULT true,
    "featured" boolean DEFAULT false,
    "published" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "courses_v2_difficulty_check" CHECK (("difficulty" = ANY (ARRAY['Beginner'::"text", 'Intermediate'::"text", 'Advanced'::"text"])))
);


ALTER TABLE "public"."courses_v2" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deleted_accounts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "text",
    "reason" "text",
    "scheduled_deletion_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."deleted_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."disputes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "gig_contract_id" "uuid" NOT NULL,
    "raised_by" "uuid" NOT NULL,
    "category" "text" NOT NULL,
    "description" "text",
    "status" "text" DEFAULT 'open'::"text" NOT NULL,
    "resolution" "text",
    "resolved_by" "uuid",
    "resolved_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."disputes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."education_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "group_name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "education_categories_group_name_check" CHECK (("group_name" = ANY (ARRAY['language'::"text", 'skill'::"text", 'technology'::"text", 'business'::"text", 'creative'::"text", 'career'::"text"])))
);


ALTER TABLE "public"."education_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_agenda" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "time_label" "text" NOT NULL,
    "title" "text" NOT NULL,
    "sort_order" integer DEFAULT 0
);


ALTER TABLE "public"."event_agenda" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_faqs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "question" "text" NOT NULL,
    "answer" "text" NOT NULL,
    "sort_order" integer DEFAULT 0
);


ALTER TABLE "public"."event_faqs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_registrations" (
    "event_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "registered_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'confirmed'::"text",
    "ticket_code" "text" DEFAULT "encode"("extensions"."gen_random_bytes"(6), 'hex'::"text"),
    "checked_in" boolean DEFAULT false,
    "id" "uuid" DEFAULT "gen_random_uuid"(),
    "certificate_issued" boolean DEFAULT false,
    "qr_code" "text",
    CONSTRAINT "event_registrations_status_check" CHECK (("status" = ANY (ARRAY['confirmed'::"text", 'waitlisted'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."event_registrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_speakers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "event_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "role" "text",
    "bio" "text",
    "image_url" "text",
    "social_links" "jsonb",
    "sort_order" integer DEFAULT 0
);


ALTER TABLE "public"."event_speakers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "event_date" timestamp with time zone,
    "location" "text" NOT NULL,
    "organizer_id" "uuid" NOT NULL,
    "max_capacity" integer,
    "host_name" "text",
    "price" numeric,
    "seats_total" integer,
    "seats_filled" integer DEFAULT 0,
    "status" "text" DEFAULT 'coming_soon'::"text" NOT NULL,
    "image_url" "text",
    "featured_on_landing" boolean DEFAULT false,
    "payment_link" "text",
    "slug" "text",
    "category" "text",
    "sub_category" "text",
    "thumbnail_url" "text",
    "tags" "text"[],
    "highlights" "text"[],
    "seo_title" "text",
    "seo_description" "text",
    "end_date" timestamp with time zone,
    "timezone" "text" DEFAULT 'Asia/Kolkata'::"text",
    "registration_deadline" timestamp with time zone,
    "certificate_enabled" boolean DEFAULT false,
    "attendance_required" boolean DEFAULT false,
    "venue_type" "text",
    "meeting_link" "text",
    "address" "text",
    "map_link" "text",
    "waitlist_enabled" boolean DEFAULT false,
    "refund_policy" "text",
    "visibility" "text" DEFAULT 'draft'::"text",
    "allow_waitlist" boolean DEFAULT false,
    "mode" "text",
    "community_id" "uuid",
    CONSTRAINT "events_venue_type_check" CHECK (("venue_type" = ANY (ARRAY['online'::"text", 'offline'::"text", 'hybrid'::"text"]))),
    CONSTRAINT "events_visibility_check" CHECK (("visibility" = ANY (ARRAY['draft'::"text", 'published'::"text", 'scheduled'::"text"]))),
    CONSTRAINT "title_length" CHECK (("char_length"("title") >= 3))
);


ALTER TABLE "public"."events" OWNER TO "postgres";


COMMENT ON TABLE "public"."events" IS 'Campus and virtual events managed by students or campus organizers.';



CREATE TABLE IF NOT EXISTS "public"."feature_flags" (
    "key" "text" NOT NULL,
    "enabled" boolean DEFAULT false,
    "coming_soon_text" "text",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "updated_by" "uuid"
);


ALTER TABLE "public"."feature_flags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."follows_deprecated" (
    "follower_id" "uuid" NOT NULL,
    "following_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "follows_check" CHECK (("follower_id" <> "following_id"))
);


ALTER TABLE "public"."follows_deprecated" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gig_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "gig_id" "uuid",
    "applicant_id" "uuid",
    "pitch" "text",
    "conversation_id" "uuid",
    "status" "text" DEFAULT 'applied'::"text" NOT NULL,
    "completed_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "proposed_price" numeric,
    "estimated_days" integer,
    "portfolio_links" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "portfolio_files" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL
);


ALTER TABLE "public"."gig_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gig_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."gig_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gig_contracts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "gig_offer_id" "uuid" NOT NULL,
    "gig_id" "uuid" NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "buyer_id" "uuid" NOT NULL,
    "gig_price" numeric NOT NULL,
    "buyer_fee_amount" numeric NOT NULL,
    "seller_fee_amount" numeric NOT NULL,
    "buyer_total_paid" numeric NOT NULL,
    "seller_net_amount" numeric NOT NULL,
    "cashfree_order_id" "text",
    "payment_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "work_submitted_at" timestamp with time zone,
    "buyer_response_deadline" timestamp with time zone,
    "status" "text" DEFAULT 'awaiting_payment'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "payout_status" "text" DEFAULT 'unwithdrawn'::"text" NOT NULL,
    "payout_completed_at" timestamp with time zone,
    "delivery_message" "text",
    "delivery_file_url" "text",
    "approved_at" timestamp with time zone,
    "vendor_settled_at" timestamp with time zone,
    "vendor_settlement_status" "text",
    "clearing_started_at" timestamp with time zone,
    "available_at" timestamp with time zone,
    "withdrawal_id" "uuid",
    "revisions_used" integer DEFAULT 0 NOT NULL,
    "revision_notes" "text"
);


ALTER TABLE "public"."gig_contracts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gig_delivery_files" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "gig_contract_id" "uuid" NOT NULL,
    "original_path" "text" NOT NULL,
    "preview_path" "text",
    "file_name" "text" NOT NULL,
    "file_type" "text",
    "file_size_bytes" bigint,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."gig_delivery_files" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gig_offer_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "gig_offer_id" "uuid" NOT NULL,
    "description" "text" NOT NULL,
    "price" numeric NOT NULL,
    "sort_order" integer DEFAULT 0 NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."gig_offer_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gig_offers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "gig_application_id" "uuid" NOT NULL,
    "gig_id" "uuid" NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "buyer_id" "uuid" NOT NULL,
    "price" numeric NOT NULL,
    "delivery_days" integer,
    "revisions" integer,
    "terms" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "direction" "text" DEFAULT 'seller_to_buyer'::"text" NOT NULL,
    "parent_offer_id" "uuid",
    "accepted_at" timestamp with time zone
);


ALTER TABLE "public"."gig_offers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gig_tag_assignments" (
    "gig_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."gig_tag_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gig_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."gig_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."gigs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "posted_by" "uuid",
    "title" "text" NOT NULL,
    "category" "text",
    "description" "text",
    "price" numeric,
    "condition" "text",
    "status" "text" DEFAULT 'pending_review'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "verified" boolean DEFAULT false NOT NULL,
    "verified_by" "uuid",
    "verified_at" timestamp with time zone,
    "client_name" character varying(255) DEFAULT 'Student Project'::character varying,
    "location" character varying(255) DEFAULT 'Remote'::character varying,
    "budget_min" numeric,
    "budget_max" numeric,
    "category_id" "uuid",
    "featured" boolean DEFAULT false,
    "views" integer DEFAULT 0,
    "admin_hidden" boolean DEFAULT false,
    "rejection_reason" "text",
    "rejection_note" "text"
);


ALTER TABLE "public"."gigs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_applications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "job_id" "uuid",
    "user_id" "uuid",
    "cv_url" "text",
    "answers" "jsonb",
    "availability" "text",
    "status" "text" DEFAULT 'submitted'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "job_applications_status_check" CHECK (("status" = ANY (ARRAY['submitted'::"text", 'review'::"text", 'interview'::"text", 'selected'::"text", 'rejected'::"text"])))
);


ALTER TABLE "public"."job_applications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_categories" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."job_categories" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_tag_assignments" (
    "job_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."job_tag_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."job_tags" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL
);


ALTER TABLE "public"."job_tags" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."jobs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "company" "text",
    "job_type" "text" NOT NULL,
    "description" "text",
    "apply_url" "text",
    "status" "text" DEFAULT 'live'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "location" character varying(255) DEFAULT 'Remote'::character varying,
    "compensation" character varying(255) DEFAULT 'Negotiable'::character varying,
    "duration" character varying(255) DEFAULT 'Flexible'::character varying,
    "skills" "text" DEFAULT 'General'::"text",
    "logo" character varying(10) DEFAULT '🏢'::character varying,
    "application_type" "text" DEFAULT 'portal'::"text" NOT NULL,
    "application_questions" "jsonb",
    "salary_min" numeric,
    "salary_max" numeric,
    "category_id" "uuid",
    "featured" boolean DEFAULT false,
    "views" integer DEFAULT 0,
    "admin_hidden" boolean DEFAULT false,
    "deadline" timestamp with time zone,
    "company_id" "uuid",
    CONSTRAINT "jobs_status_check" CHECK (("status" = ANY (ARRAY['live'::"text", 'closed'::"text", 'pending_review'::"text"])))
);


ALTER TABLE "public"."jobs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "conversation_id" "uuid",
    "sender_id" "uuid",
    "content" "text",
    "file_url" "text",
    "file_type" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "read_at" timestamp with time zone,
    "is_read" boolean DEFAULT false
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_preferences" (
    "user_id" "uuid" NOT NULL,
    "email_notifications" boolean DEFAULT true,
    "push_notifications" boolean DEFAULT true,
    "community_activity" boolean DEFAULT true,
    "job_notifs" boolean DEFAULT true,
    "event_reminders" boolean DEFAULT true,
    "gig_updates" boolean DEFAULT true,
    "messages" boolean DEFAULT true,
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "platform_notifications" boolean DEFAULT true,
    "course_updates" boolean DEFAULT true,
    "scholarship_alerts" boolean DEFAULT true,
    "mentions" boolean DEFAULT true,
    "comments" boolean DEFAULT true,
    "likes" boolean DEFAULT true,
    "connection_requests" boolean DEFAULT true,
    "weekly_digest" boolean DEFAULT false,
    "monthly_digest" boolean DEFAULT false,
    "marketing_emails" boolean DEFAULT false
);


ALTER TABLE "public"."notification_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "type" "text" NOT NULL,
    "title" "text" NOT NULL,
    "body" "text",
    "link" "text",
    "is_read" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."notifications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notify_subscribers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "email" "text" NOT NULL,
    "feature_key" "text" NOT NULL,
    "notified" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notify_subscribers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "post_id" "uuid",
    "user_id" "uuid",
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."post_comments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."post_likes" (
    "post_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."post_likes" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."posts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "community_id" "uuid",
    "content" "text" NOT NULL,
    "image_url" "text",
    "is_featured" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "feeling" "text",
    "hidden_by_admin" boolean DEFAULT false,
    "attachments" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL
);


ALTER TABLE "public"."posts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."press_releases_deprecated" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text" NOT NULL,
    "image_url" "text",
    "published" boolean DEFAULT false,
    "slug" "text",
    "seo_title" "text",
    "seo_description" "text",
    "seo_keywords" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."press_releases_deprecated" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."privacy_settings" (
    "user_id" "uuid" NOT NULL,
    "profile_visibility" "text" DEFAULT 'public'::"text",
    "hide_email" boolean DEFAULT false,
    "hide_phone" boolean DEFAULT true,
    "hide_college" boolean DEFAULT false,
    "hide_birthday" boolean DEFAULT true,
    "hide_profile_from_search" boolean DEFAULT false,
    "allow_connection_requests" boolean DEFAULT true,
    "allow_messages" boolean DEFAULT true,
    "show_online_status" boolean DEFAULT true,
    "show_last_seen" boolean DEFAULT true,
    "allow_community_invites" boolean DEFAULT true,
    "allow_event_invites" boolean DEFAULT true,
    "allow_mentor_requests" boolean DEFAULT true,
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."privacy_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "full_name" "text" NOT NULL,
    "avatar_url" "text",
    "student_id" "text",
    "major" "text",
    "university" "text" DEFAULT 'CHAVEE University'::"text" NOT NULL,
    "bio" "text",
    "skills" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "website" "text",
    "username" "text",
    "phone_number" "text",
    "college" "text",
    "course" "text",
    "year_of_study" "text",
    "resume_link" "text",
    "date_of_birth" "date",
    "interests" "text"[],
    "motive" "text",
    "profile_complete" boolean DEFAULT false NOT NULL,
    "privacy" "text" DEFAULT 'public'::"text",
    "state" "text",
    "languages" "text"[],
    "career_goal" "text",
    "skill_level" "text",
    "linkedin_url" "text",
    "portfolio_url" "text",
    "profile_visibility" "text" DEFAULT 'public'::"text",
    "hide_email" boolean DEFAULT false,
    "hide_phone" boolean DEFAULT false,
    "status" "text" DEFAULT 'active'::"text",
    "ban_reason" "text",
    "banned_at" timestamp with time zone,
    "banned_by" "uuid",
    "last_active_at" timestamp with time zone,
    "banner_url" "text",
    "phone" "text",
    "country" "text",
    "city" "text",
    "department" "text",
    "github_url" "text",
    "website_url" "text",
    "graduation_year" "text",
    "is_verified" boolean DEFAULT false,
    "cashfree_vendor_id" "text",
    "cashfree_vendor_status" "text",
    "cashfree_kyc_completed_at" timestamp with time zone,
    "cashfree_payout_method" "text",
    "cashfree_pan_number" "text",
    "gig_auto_approve" boolean DEFAULT false NOT NULL,
    CONSTRAINT "profiles_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'inactive'::"text", 'suspended'::"text", 'banned'::"text"]))),
    CONSTRAINT "username_length" CHECK (("char_length"("full_name") >= 2))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


COMMENT ON TABLE "public"."profiles" IS 'Profiles of students and professionals on the CHAVEE platform.';



CREATE OR REPLACE VIEW "public"."public_profiles" AS
 SELECT "id",
    "username",
    "full_name",
    "college",
    "course",
    "year_of_study",
    "bio",
    "skills",
    "interests",
    "avatar_url",
    "created_at"
   FROM "public"."profiles";


ALTER VIEW "public"."public_profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."reports_moderation" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reporter_id" "uuid",
    "reported_user_id" "uuid",
    "message_id" "uuid",
    "post_id" "uuid",
    "gig_id" "uuid",
    "reason" "text" NOT NULL,
    "status" "text" DEFAULT 'Pending'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "resolution_notes" "text",
    "resolved_by" "uuid",
    "resolved_at" timestamp with time zone,
    "job_id" "uuid",
    CONSTRAINT "reports_moderation_status_check" CHECK (("status" = ANY (ARRAY['Pending'::"text", 'In Review'::"text", 'Resolved'::"text", 'Dismissed'::"text"])))
);


ALTER TABLE "public"."reports_moderation" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."resources" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "category" "text",
    "thumbnail_url" "text",
    "description" "text",
    "is_coming_soon" boolean DEFAULT true,
    "featured" boolean DEFAULT false,
    "published" boolean DEFAULT false,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "icon" "text",
    "status" "text" DEFAULT 'Draft'::"text"
);


ALTER TABLE "public"."resources" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "item_type" "text" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "saved_items_item_type_check" CHECK (("item_type" = ANY (ARRAY['job'::"text", 'gig'::"text", 'event'::"text", 'course'::"text", 'scholarship'::"text", 'community'::"text", 'post'::"text", 'certification'::"text", 'resource'::"text"])))
);


ALTER TABLE "public"."saved_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."scholarships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "eligibility" "text",
    "apply_url" "text",
    "featured_month" "date",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" character varying(50) DEFAULT 'Coming Soon'::character varying,
    "income_limit" numeric DEFAULT 600000,
    "provider" "text",
    "deadline" "date",
    "amount" "text",
    "scholarship_type" "text",
    "state" "text",
    "country" "text",
    "education_level" "text",
    "category" "text",
    "funding_type" "text",
    "deadline_date" "date",
    "region" "text",
    CONSTRAINT "scholarships_scholarship_type_check" CHECK (("scholarship_type" = ANY (ARRAY['domestic'::"text", 'international'::"text"])))
);


ALTER TABLE "public"."scholarships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."security_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "action" "text" NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."security_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "plan_name" "text" DEFAULT 'Free'::"text",
    "status" "text" DEFAULT 'active'::"text",
    "current_period_end" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."support_ticket_number_seq"
    START WITH 1000
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."support_ticket_number_seq" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."support_tickets" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "category" "text",
    "subject" "text" NOT NULL,
    "message" "text" NOT NULL,
    "status" "text" DEFAULT 'new'::"text",
    "admin_reply" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "ticket_number" bigint DEFAULT "nextval"('"public"."support_ticket_number_seq"'::"regclass") NOT NULL,
    "ticket_id" "text" GENERATED ALWAYS AS (('CHV-'::"text" || "ticket_number")) STORED,
    "attachment_url" "text",
    CONSTRAINT "support_tickets_category_check" CHECK ((("category" IS NULL) OR ("category" = ANY (ARRAY['account_issue'::"text", 'technical_problem'::"text", 'user_behaviour'::"text", 'community_issue'::"text", 'job_listing'::"text", 'gig_transaction'::"text", 'payment'::"text", 'content_violation'::"text", 'privacy_concern'::"text", 'security_concern'::"text", 'other'::"text"])))),
    CONSTRAINT "support_tickets_status_check" CHECK (("status" = ANY (ARRAY['new'::"text", 'in_review'::"text", 'waiting_for_user'::"text", 'resolved'::"text", 'closed'::"text"])))
);


ALTER TABLE "public"."support_tickets" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."testimonials" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "rating" integer,
    "feedback_text" "text" NOT NULL,
    "featured" boolean DEFAULT false,
    "approved" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "display_name" "text",
    "role_label" "text",
    "photo_url" "text",
    CONSTRAINT "testimonials_rating_check" CHECK ((("rating" >= 1) AND ("rating" <= 5)))
);


ALTER TABLE "public"."testimonials" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_activity" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "activity_type" "text" NOT NULL,
    "description" "text",
    "reference_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "metadata" "jsonb"
);


ALTER TABLE "public"."user_activity" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_badges" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "badge_id" "uuid",
    "earned_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_badges" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_blocks" (
    "blocker_id" "uuid" NOT NULL,
    "blocked_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "user_blocks_check" CHECK (("blocker_id" <> "blocked_id"))
);


ALTER TABLE "public"."user_blocks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_gamification" (
    "user_id" "uuid" NOT NULL,
    "points" integer DEFAULT 0 NOT NULL,
    "level" "text" DEFAULT 'Bronze'::"text" NOT NULL,
    "badges" "text"[] DEFAULT '{}'::"text"[] NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."user_gamification" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_preferences" (
    "user_id" "uuid" NOT NULL,
    "theme" "text" DEFAULT 'system'::"text",
    "language" "text" DEFAULT 'English'::"text",
    "timezone" "text" DEFAULT 'Asia/Kolkata'::"text",
    "currency" "text" DEFAULT 'INR'::"text",
    "date_format" "text" DEFAULT 'DD-MM-YYYY'::"text",
    "homepage_default" "text" DEFAULT 'dashboard'::"text",
    "remember_sidebar_state" boolean DEFAULT true,
    "compact_mode" boolean DEFAULT false,
    "animations" boolean DEFAULT true,
    "accessibility_mode" boolean DEFAULT false,
    "font_size" "text" DEFAULT 'medium'::"text",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_preferences" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."user_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "device" "text",
    "browser" "text",
    "os" "text",
    "ip_address" "text",
    "country" "text",
    "login_time" timestamp with time zone DEFAULT "now"(),
    "last_active" timestamp with time zone DEFAULT "now"(),
    "is_current" boolean DEFAULT false
);


ALTER TABLE "public"."user_sessions" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."waitlist_counts" AS
 SELECT "feature_key",
    "count"(*) AS "waitlist_count"
   FROM "public"."notify_subscribers"
  GROUP BY "feature_key";


ALTER VIEW "public"."waitlist_counts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."withdrawals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "seller_id" "uuid" NOT NULL,
    "amount" numeric NOT NULL,
    "status" "text" DEFAULT 'requested'::"text" NOT NULL,
    "bank_details_snapshot" "jsonb",
    "utr_reference" "text",
    "requested_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "expected_by" timestamp with time zone,
    "paid_at" timestamp with time zone,
    "hold_reason" "text"
);


ALTER TABLE "public"."withdrawals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."xp_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "amount" integer NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."xp_history" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admin_activity_logs"
    ADD CONSTRAINT "admin_activity_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_key_key" UNIQUE ("key");



ALTER TABLE ONLY "public"."badges"
    ADD CONSTRAINT "badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blogs_deprecated"
    ADD CONSTRAINT "blogs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."blogs_deprecated"
    ADD CONSTRAINT "blogs_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_user_id_event_id_key" UNIQUE ("user_id", "event_id");



ALTER TABLE ONLY "public"."certifications"
    ADD CONSTRAINT "certifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."communities"
    ADD CONSTRAINT "communities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."communities"
    ADD CONSTRAINT "communities_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."community_bans"
    ADD CONSTRAINT "community_bans_community_id_user_id_key" UNIQUE ("community_id", "user_id");



ALTER TABLE ONLY "public"."community_bans"
    ADD CONSTRAINT "community_bans_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_channels"
    ADD CONSTRAINT "community_channels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_join_requests"
    ADD CONSTRAINT "community_join_requests_community_id_user_id_key" UNIQUE ("community_id", "user_id");



ALTER TABLE ONLY "public"."community_join_requests"
    ADD CONSTRAINT "community_join_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."community_members"
    ADD CONSTRAINT "community_members_pkey" PRIMARY KEY ("community_id", "user_id");



ALTER TABLE ONLY "public"."community_resources"
    ADD CONSTRAINT "community_resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."connected_accounts"
    ADD CONSTRAINT "connected_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."connected_accounts"
    ADD CONSTRAINT "connected_accounts_user_id_provider_key" UNIQUE ("user_id", "provider");



ALTER TABLE ONLY "public"."connection_requests"
    ADD CONSTRAINT "connection_requests_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."connections"
    ADD CONSTRAINT "connections_pkey" PRIMARY KEY ("user_one", "user_two");



ALTER TABLE ONLY "public"."contact_submissions"
    ADD CONSTRAINT "contact_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content"
    ADD CONSTRAINT "content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."content"
    ADD CONSTRAINT "content_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("conversation_id", "user_id");



ALTER TABLE ONLY "public"."conversations"
    ADD CONSTRAINT "conversations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses"
    ADD CONSTRAINT "courses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."courses_v2"
    ADD CONSTRAINT "courses_v2_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deleted_accounts"
    ADD CONSTRAINT "deleted_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."education_categories"
    ADD CONSTRAINT "education_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_agenda"
    ADD CONSTRAINT "event_agenda_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_faqs"
    ADD CONSTRAINT "event_faqs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."event_registrations"
    ADD CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("event_id", "user_id");



ALTER TABLE ONLY "public"."event_registrations"
    ADD CONSTRAINT "event_registrations_ticket_code_key" UNIQUE ("ticket_code");



ALTER TABLE ONLY "public"."event_speakers"
    ADD CONSTRAINT "event_speakers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."feature_flags"
    ADD CONSTRAINT "feature_flags_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."follows_deprecated"
    ADD CONSTRAINT "follows_pkey" PRIMARY KEY ("follower_id", "following_id");



ALTER TABLE ONLY "public"."gig_applications"
    ADD CONSTRAINT "gig_applications_gig_id_applicant_id_key" UNIQUE ("gig_id", "applicant_id");



ALTER TABLE ONLY "public"."gig_applications"
    ADD CONSTRAINT "gig_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gig_categories"
    ADD CONSTRAINT "gig_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."gig_categories"
    ADD CONSTRAINT "gig_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gig_categories"
    ADD CONSTRAINT "gig_categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."gig_contracts"
    ADD CONSTRAINT "gig_contracts_gig_offer_id_unique" UNIQUE ("gig_offer_id");



ALTER TABLE ONLY "public"."gig_contracts"
    ADD CONSTRAINT "gig_contracts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gig_delivery_files"
    ADD CONSTRAINT "gig_delivery_files_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gig_offer_items"
    ADD CONSTRAINT "gig_offer_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gig_offers"
    ADD CONSTRAINT "gig_offers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gig_tag_assignments"
    ADD CONSTRAINT "gig_tag_assignments_pkey" PRIMARY KEY ("gig_id", "tag_id");



ALTER TABLE ONLY "public"."gig_tags"
    ADD CONSTRAINT "gig_tags_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."gig_tags"
    ADD CONSTRAINT "gig_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."gigs"
    ADD CONSTRAINT "gigs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_applications"
    ADD CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_categories"
    ADD CONSTRAINT "job_categories_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."job_categories"
    ADD CONSTRAINT "job_categories_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."job_categories"
    ADD CONSTRAINT "job_categories_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."job_tag_assignments"
    ADD CONSTRAINT "job_tag_assignments_pkey" PRIMARY KEY ("job_id", "tag_id");



ALTER TABLE ONLY "public"."job_tags"
    ADD CONSTRAINT "job_tags_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."job_tags"
    ADD CONSTRAINT "job_tags_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notify_subscribers"
    ADD CONSTRAINT "notify_subscribers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notify_subscribers"
    ADD CONSTRAINT "notify_subscribers_user_feature_unique" UNIQUE ("user_id", "feature_key");



ALTER TABLE ONLY "public"."notify_subscribers"
    ADD CONSTRAINT "notify_subscribers_user_id_feature_key_key" UNIQUE ("user_id", "feature_key");



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_pkey" PRIMARY KEY ("post_id", "user_id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."press_releases_deprecated"
    ADD CONSTRAINT "press_releases_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."press_releases_deprecated"
    ADD CONSTRAINT "press_releases_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."privacy_settings"
    ADD CONSTRAINT "privacy_settings_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_student_id_key" UNIQUE ("student_id");



ALTER TABLE ONLY "public"."reports_moderation"
    ADD CONSTRAINT "reports_moderation_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."resources"
    ADD CONSTRAINT "resources_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_items"
    ADD CONSTRAINT "saved_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_items"
    ADD CONSTRAINT "saved_items_user_id_item_type_item_id_key" UNIQUE ("user_id", "item_type", "item_id");



ALTER TABLE ONLY "public"."scholarships"
    ADD CONSTRAINT "scholarships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."security_logs"
    ADD CONSTRAINT "security_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."testimonials"
    ADD CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_activity"
    ADD CONSTRAINT "user_activity_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_user_id_badge_id_key" UNIQUE ("user_id", "badge_id");



ALTER TABLE ONLY "public"."user_blocks"
    ADD CONSTRAINT "user_blocks_pkey" PRIMARY KEY ("blocker_id", "blocked_id");



ALTER TABLE ONLY "public"."user_gamification"
    ADD CONSTRAINT "user_gamification_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_pkey" PRIMARY KEY ("user_id");



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."withdrawals"
    ADD CONSTRAINT "withdrawals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."xp_history"
    ADD CONSTRAINT "xp_history_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_content_slug" ON "public"."content" USING "btree" ("slug");



CREATE INDEX "idx_content_type_status" ON "public"."content" USING "btree" ("content_type", "status");



CREATE INDEX "idx_gig_offers_parent_id" ON "public"."gig_offers" USING "btree" ("parent_offer_id");



CREATE INDEX "idx_messages_conversation_id" ON "public"."messages" USING "btree" ("conversation_id");



CREATE INDEX "idx_messages_is_read" ON "public"."messages" USING "btree" ("conversation_id", "is_read", "sender_id");



CREATE UNIQUE INDEX "support_tickets_ticket_id_key" ON "public"."support_tickets" USING "btree" ("ticket_id");



CREATE UNIQUE INDEX "uniq_pending_request" ON "public"."connection_requests" USING "btree" (LEAST("sender_id", "receiver_id"), GREATEST("sender_id", "receiver_id")) WHERE ("status" = 'pending'::"text");



CREATE OR REPLACE TRIGGER "on_community_created" AFTER INSERT ON "public"."communities" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_community"();



CREATE OR REPLACE TRIGGER "on_community_created_add_channel" AFTER UPDATE OF "conversation_id" ON "public"."communities" FOR EACH ROW WHEN ((("new"."conversation_id" IS NOT NULL) AND ("old"."conversation_id" IS NULL))) EXECUTE FUNCTION "public"."handle_new_community_channel"();



CREATE OR REPLACE TRIGGER "on_community_member_joined" AFTER INSERT ON "public"."community_members" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_community_member"();



CREATE OR REPLACE TRIGGER "on_community_member_leave" AFTER DELETE ON "public"."community_members" FOR EACH ROW EXECUTE FUNCTION "public"."handle_community_member_leave"();



CREATE OR REPLACE TRIGGER "on_event_registered" AFTER INSERT ON "public"."event_registrations" FOR EACH ROW EXECUTE FUNCTION "public"."handle_event_registration"();



CREATE OR REPLACE TRIGGER "on_follow_created" AFTER INSERT ON "public"."follows_deprecated" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_follow"();



CREATE OR REPLACE TRIGGER "on_gig_application_completed" AFTER UPDATE ON "public"."gig_applications" FOR EACH ROW EXECUTE FUNCTION "public"."handle_gig_application_completed"();



CREATE OR REPLACE TRIGGER "on_gig_application_created" AFTER INSERT ON "public"."gig_applications" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_gig_application"();



CREATE OR REPLACE TRIGGER "on_gig_application_insert" BEFORE INSERT ON "public"."gig_applications" FOR EACH ROW EXECUTE FUNCTION "public"."handle_gig_proposal"();



CREATE OR REPLACE TRIGGER "on_gig_verified" AFTER UPDATE ON "public"."gigs" FOR EACH ROW EXECUTE FUNCTION "public"."handle_gig_verified"();



CREATE OR REPLACE TRIGGER "on_message_created" AFTER INSERT ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_message"();



CREATE OR REPLACE TRIGGER "on_post_commented" AFTER INSERT ON "public"."post_comments" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_comment"();



CREATE OR REPLACE TRIGGER "on_post_liked" AFTER INSERT ON "public"."post_likes" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_like"();



CREATE OR REPLACE TRIGGER "on_profile_created_settings" AFTER INSERT ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."create_default_settings"();



CREATE OR REPLACE TRIGGER "trg_manage_event_seats" BEFORE INSERT OR DELETE ON "public"."event_registrations" FOR EACH ROW EXECUTE FUNCTION "public"."manage_event_seats"();



CREATE OR REPLACE TRIGGER "trg_new_connection_request" AFTER INSERT ON "public"."connection_requests" FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_connection_request"();



CREATE OR REPLACE TRIGGER "trg_notify_new_support_ticket" AFTER INSERT ON "public"."support_tickets" FOR EACH ROW EXECUTE FUNCTION "public"."notify_new_support_ticket"();



CREATE OR REPLACE TRIGGER "trg_prevent_banned_join" BEFORE INSERT ON "public"."community_members" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_banned_user_join"();



CREATE OR REPLACE TRIGGER "trg_prevent_gig_self_verification" BEFORE UPDATE ON "public"."gigs" FOR EACH ROW EXECUTE FUNCTION "public"."prevent_gig_self_verification"();



ALTER TABLE ONLY "public"."admin_activity_logs"
    ADD CONSTRAINT "admin_activity_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."certificates"
    ADD CONSTRAINT "certificates_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."certifications"
    ADD CONSTRAINT "certifications_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."education_categories"("id");



ALTER TABLE ONLY "public"."communities"
    ADD CONSTRAINT "communities_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id");



ALTER TABLE ONLY "public"."communities"
    ADD CONSTRAINT "communities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."community_bans"
    ADD CONSTRAINT "community_bans_banned_by_fkey" FOREIGN KEY ("banned_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."community_bans"
    ADD CONSTRAINT "community_bans_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_bans"
    ADD CONSTRAINT "community_bans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_channels"
    ADD CONSTRAINT "community_channels_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_channels"
    ADD CONSTRAINT "community_channels_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_channels"
    ADD CONSTRAINT "community_channels_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."community_join_requests"
    ADD CONSTRAINT "community_join_requests_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_join_requests"
    ADD CONSTRAINT "community_join_requests_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."community_join_requests"
    ADD CONSTRAINT "community_join_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_members"
    ADD CONSTRAINT "community_members_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_members"
    ADD CONSTRAINT "community_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_resources"
    ADD CONSTRAINT "community_resources_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."community_resources"
    ADD CONSTRAINT "community_resources_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."companies"
    ADD CONSTRAINT "companies_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."connected_accounts"
    ADD CONSTRAINT "connected_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."connection_requests"
    ADD CONSTRAINT "connection_requests_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."connection_requests"
    ADD CONSTRAINT "connection_requests_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."connections"
    ADD CONSTRAINT "connections_user_one_fkey" FOREIGN KEY ("user_one") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."connections"
    ADD CONSTRAINT "connections_user_two_fkey" FOREIGN KEY ("user_two") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."content"
    ADD CONSTRAINT "content_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_participants"
    ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."courses_v2"
    ADD CONSTRAINT "courses_v2_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."education_categories"("id");



ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_gig_contract_id_fkey" FOREIGN KEY ("gig_contract_id") REFERENCES "public"."gig_contracts"("id");



ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_raised_by_fkey" FOREIGN KEY ("raised_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."disputes"
    ADD CONSTRAINT "disputes_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."event_agenda"
    ADD CONSTRAINT "event_agenda_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_faqs"
    ADD CONSTRAINT "event_faqs_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_registrations"
    ADD CONSTRAINT "event_registrations_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_registrations"
    ADD CONSTRAINT "event_registrations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."event_speakers"
    ADD CONSTRAINT "event_speakers_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id");



ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."feature_flags"
    ADD CONSTRAINT "feature_flags_updated_by_fkey" FOREIGN KEY ("updated_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "fk_post_comments_user_id" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "fk_posts_profiles" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."follows_deprecated"
    ADD CONSTRAINT "follows_follower_id_fkey" FOREIGN KEY ("follower_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."follows_deprecated"
    ADD CONSTRAINT "follows_following_id_fkey" FOREIGN KEY ("following_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gig_applications"
    ADD CONSTRAINT "gig_applications_applicant_id_fkey" FOREIGN KEY ("applicant_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gig_applications"
    ADD CONSTRAINT "gig_applications_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id");



ALTER TABLE ONLY "public"."gig_applications"
    ADD CONSTRAINT "gig_applications_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gig_contracts"
    ADD CONSTRAINT "gig_contracts_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."gig_contracts"
    ADD CONSTRAINT "gig_contracts_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id");



ALTER TABLE ONLY "public"."gig_contracts"
    ADD CONSTRAINT "gig_contracts_gig_offer_id_fkey" FOREIGN KEY ("gig_offer_id") REFERENCES "public"."gig_offers"("id");



ALTER TABLE ONLY "public"."gig_contracts"
    ADD CONSTRAINT "gig_contracts_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."gig_contracts"
    ADD CONSTRAINT "gig_contracts_withdrawal_id_fkey" FOREIGN KEY ("withdrawal_id") REFERENCES "public"."withdrawals"("id");



ALTER TABLE ONLY "public"."gig_delivery_files"
    ADD CONSTRAINT "gig_delivery_files_gig_contract_id_fkey" FOREIGN KEY ("gig_contract_id") REFERENCES "public"."gig_contracts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gig_offer_items"
    ADD CONSTRAINT "gig_offer_items_gig_offer_id_fkey" FOREIGN KEY ("gig_offer_id") REFERENCES "public"."gig_offers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gig_offers"
    ADD CONSTRAINT "gig_offers_buyer_id_fkey" FOREIGN KEY ("buyer_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."gig_offers"
    ADD CONSTRAINT "gig_offers_gig_application_id_fkey" FOREIGN KEY ("gig_application_id") REFERENCES "public"."gig_applications"("id");



ALTER TABLE ONLY "public"."gig_offers"
    ADD CONSTRAINT "gig_offers_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id");



ALTER TABLE ONLY "public"."gig_offers"
    ADD CONSTRAINT "gig_offers_parent_offer_id_fkey" FOREIGN KEY ("parent_offer_id") REFERENCES "public"."gig_offers"("id");



ALTER TABLE ONLY "public"."gig_offers"
    ADD CONSTRAINT "gig_offers_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."gig_tag_assignments"
    ADD CONSTRAINT "gig_tag_assignments_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gig_tag_assignments"
    ADD CONSTRAINT "gig_tag_assignments_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."gig_tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gigs"
    ADD CONSTRAINT "gigs_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."gig_categories"("id");



ALTER TABLE ONLY "public"."gigs"
    ADD CONSTRAINT "gigs_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."gigs"
    ADD CONSTRAINT "gigs_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."job_applications"
    ADD CONSTRAINT "job_applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_applications"
    ADD CONSTRAINT "job_applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_tag_assignments"
    ADD CONSTRAINT "job_tag_assignments_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."job_tag_assignments"
    ADD CONSTRAINT "job_tag_assignments_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."job_tags"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."job_categories"("id");



ALTER TABLE ONLY "public"."jobs"
    ADD CONSTRAINT "jobs_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_preferences"
    ADD CONSTRAINT "notification_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notifications"
    ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notify_subscribers"
    ADD CONSTRAINT "notify_subscribers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_comments"
    ADD CONSTRAINT "post_comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."post_likes"
    ADD CONSTRAINT "post_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id");



ALTER TABLE ONLY "public"."posts"
    ADD CONSTRAINT "posts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."privacy_settings"
    ADD CONSTRAINT "privacy_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_banned_by_fkey" FOREIGN KEY ("banned_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports_moderation"
    ADD CONSTRAINT "reports_moderation_gig_id_fkey" FOREIGN KEY ("gig_id") REFERENCES "public"."gigs"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reports_moderation"
    ADD CONSTRAINT "reports_moderation_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "public"."jobs"("id");



ALTER TABLE ONLY "public"."reports_moderation"
    ADD CONSTRAINT "reports_moderation_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."messages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reports_moderation"
    ADD CONSTRAINT "reports_moderation_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reports_moderation"
    ADD CONSTRAINT "reports_moderation_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."reports_moderation"
    ADD CONSTRAINT "reports_moderation_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."reports_moderation"
    ADD CONSTRAINT "reports_moderation_resolved_by_fkey" FOREIGN KEY ("resolved_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."saved_items"
    ADD CONSTRAINT "saved_items_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."security_logs"
    ADD CONSTRAINT "security_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."support_tickets"
    ADD CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."testimonials"
    ADD CONSTRAINT "testimonials_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_activity"
    ADD CONSTRAINT "user_activity_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "public"."badges"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_badges"
    ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_blocks"
    ADD CONSTRAINT "user_blocks_blocked_id_fkey" FOREIGN KEY ("blocked_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_blocks"
    ADD CONSTRAINT "user_blocks_blocker_id_fkey" FOREIGN KEY ("blocker_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_gamification"
    ADD CONSTRAINT "user_gamification_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_preferences"
    ADD CONSTRAINT "user_preferences_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."user_sessions"
    ADD CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."withdrawals"
    ADD CONSTRAINT "withdrawals_seller_id_fkey" FOREIGN KEY ("seller_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."xp_history"
    ADD CONSTRAINT "xp_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage all channels" ON "public"."community_channels" USING ("public"."is_admin"());



CREATE POLICY "Admins can manage any gig" ON "public"."gigs" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can manage any post" ON "public"."posts" FOR UPDATE USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Admins can update application status" ON "public"."job_applications" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "Admins can update report status" ON "public"."reports_moderation" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "Admins can view all gig applications" ON "public"."gig_applications" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins can view all reports" ON "public"."reports_moderation" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "Admins list is readable by any authenticated user" ON "public"."admins" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Agenda viewable by everyone" ON "public"."event_agenda" FOR SELECT USING (true);



CREATE POLICY "Allow public read access on resources" ON "public"."resources" FOR SELECT USING (true);



CREATE POLICY "Allow users to insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Allow users to update their own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "Anyone can submit the contact form" ON "public"."contact_submissions" FOR INSERT WITH CHECK (true);



CREATE POLICY "Applicants can view their own applications" ON "public"."gig_applications" FOR SELECT USING (("auth"."uid"() = "applicant_id"));



CREATE POLICY "Authenticated users can start a conversation" ON "public"."conversations" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Buyer can create contract" ON "public"."gig_contracts" FOR INSERT WITH CHECK (("auth"."uid"() = "buyer_id"));



CREATE POLICY "Buyer can update offer status" ON "public"."gig_offers" FOR UPDATE USING ((("auth"."uid"() = "buyer_id") OR ("auth"."uid"() = "seller_id")));



CREATE POLICY "Channels viewable by everyone" ON "public"."community_channels" FOR SELECT USING (true);



CREATE POLICY "Comments viewable by everyone" ON "public"."post_comments" FOR SELECT USING (true);



CREATE POLICY "Communities viewable by everyone" ON "public"."communities" FOR SELECT USING (true);



CREATE POLICY "Community admins/mods can delete their channels" ON "public"."community_channels" FOR DELETE USING (("auth"."uid"() IN ( SELECT "community_members"."user_id"
   FROM "public"."community_members"
  WHERE (("community_members"."community_id" = "community_channels"."community_id") AND ("community_members"."role" = ANY (ARRAY['admin'::"text", 'moderator'::"text"]))))));



CREATE POLICY "Community members viewable by everyone" ON "public"."community_members" FOR SELECT USING (true);



CREATE POLICY "Companies viewable by everyone" ON "public"."companies" FOR SELECT USING (true);



CREATE POLICY "Contract participants can raise disputes" ON "public"."disputes" FOR INSERT WITH CHECK ((("auth"."uid"() = "raised_by") AND (EXISTS ( SELECT 1
   FROM "public"."gig_contracts" "gc"
  WHERE (("gc"."id" = "disputes"."gig_contract_id") AND (("gc"."buyer_id" = "auth"."uid"()) OR ("gc"."seller_id" = "auth"."uid"())))))));



CREATE POLICY "Contract participants can view disputes" ON "public"."disputes" FOR SELECT USING (((EXISTS ( SELECT 1
   FROM "public"."gig_contracts" "gc"
  WHERE (("gc"."id" = "disputes"."gig_contract_id") AND (("gc"."buyer_id" = "auth"."uid"()) OR ("gc"."seller_id" = "auth"."uid"()))))) OR (EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."user_id" = "auth"."uid"())))));



CREATE POLICY "Courses viewable by everyone" ON "public"."courses" FOR SELECT USING (true);



CREATE POLICY "Events viewable by everyone" ON "public"."events" FOR SELECT USING (true);



CREATE POLICY "FAQs viewable by everyone" ON "public"."event_faqs" FOR SELECT USING (true);



CREATE POLICY "Follows are viewable by everyone" ON "public"."follows_deprecated" FOR SELECT USING (true);



CREATE POLICY "Gamification viewable by everyone" ON "public"."user_gamification" FOR SELECT USING (true);



CREATE POLICY "Gig owners and admins can update applications" ON "public"."gig_applications" FOR UPDATE USING ((("auth"."uid"() = ( SELECT "gigs"."posted_by"
   FROM "public"."gigs"
  WHERE ("gigs"."id" = "gig_applications"."gig_id"))) OR "public"."is_admin"()));



CREATE POLICY "Gig owners can view applications to their gigs" ON "public"."gig_applications" FOR SELECT USING (("auth"."uid"() = ( SELECT "gigs"."posted_by"
   FROM "public"."gigs"
  WHERE ("gigs"."id" = "gig_applications"."gig_id"))));



CREATE POLICY "Gigs viewable based on status" ON "public"."gigs" FOR SELECT USING (((("verified" = true) AND (COALESCE("status", 'active'::"text") = 'active'::"text")) OR ("posted_by" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "Insert deleted_accounts" ON "public"."deleted_accounts" FOR INSERT WITH CHECK (true);



CREATE POLICY "Insert own security_logs" ON "public"."security_logs" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Jobs viewable by everyone" ON "public"."jobs" FOR SELECT USING (true);



CREATE POLICY "Likes viewable by everyone" ON "public"."post_likes" FOR SELECT USING (true);



CREATE POLICY "Manage own connected_accounts" ON "public"."connected_accounts" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Manage own notification_preferences" ON "public"."notification_preferences" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Manage own privacy_settings" ON "public"."privacy_settings" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Manage own support_tickets" ON "public"."support_tickets" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Manage own user_preferences" ON "public"."user_preferences" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Manage own user_sessions" ON "public"."user_sessions" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Members can create channels in their communities" ON "public"."community_channels" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "community_members"."user_id"
   FROM "public"."community_members"
  WHERE ("community_members"."community_id" = "community_channels"."community_id"))));



CREATE POLICY "Offer creator can insert items" ON "public"."gig_offer_items" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."gig_offers" "o"
  WHERE (("o"."id" = "gig_offer_items"."gig_offer_id") AND (("o"."buyer_id" = "auth"."uid"()) OR ("o"."seller_id" = "auth"."uid"()))))));



CREATE POLICY "Only admins can create events" ON "public"."events" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Only admins can manage communities" ON "public"."communities" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Only admins can manage companies" ON "public"."companies" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Only admins can manage contact submissions" ON "public"."contact_submissions" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Only admins can manage courses" ON "public"."courses" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Only admins can manage events" ON "public"."events" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Only admins can manage jobs" ON "public"."jobs" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Only admins can manage scholarships" ON "public"."scholarships" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "Only admins can resolve disputes" ON "public"."disputes" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."user_id" = "auth"."uid"()))));



CREATE POLICY "Only admins issue certificates" ON "public"."certificates" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "Only admins manage FAQs" ON "public"."event_faqs" USING ("public"."is_admin"());



CREATE POLICY "Only admins manage agenda" ON "public"."event_agenda" USING ("public"."is_admin"());



CREATE POLICY "Only admins manage speakers" ON "public"."event_speakers" USING ("public"."is_admin"());



CREATE POLICY "Participants can create offers" ON "public"."gig_offers" FOR INSERT WITH CHECK (((("auth"."uid"() = "seller_id") AND ("direction" = 'seller_to_buyer'::"text")) OR (("auth"."uid"() = "buyer_id") AND ("direction" = 'buyer_to_seller'::"text"))));



CREATE POLICY "Participants can send messages" ON "public"."messages" FOR INSERT WITH CHECK ((("sender_id" = "auth"."uid"()) AND "public"."is_conversation_participant"("conversation_id")));



CREATE POLICY "Participants can view messages" ON "public"."messages" FOR SELECT USING ("public"."is_conversation_participant"("conversation_id"));



CREATE POLICY "Participants can view offer items" ON "public"."gig_offer_items" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."gig_offers" "o"
  WHERE (("o"."id" = "gig_offer_items"."gig_offer_id") AND (("o"."buyer_id" = "auth"."uid"()) OR ("o"."seller_id" = "auth"."uid"()))))));



CREATE POLICY "Participants can view their contracts" ON "public"."gig_contracts" FOR SELECT USING ((("auth"."uid"() = "buyer_id") OR ("auth"."uid"() = "seller_id") OR (EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."user_id" = "auth"."uid"())))));



CREATE POLICY "Participants can view their delivery files" ON "public"."gig_delivery_files" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."gig_contracts" "c"
  WHERE (("c"."id" = "gig_delivery_files"."gig_contract_id") AND (("c"."buyer_id" = "auth"."uid"()) OR ("c"."seller_id" = "auth"."uid"()))))));



CREATE POLICY "Participants can view their offers" ON "public"."gig_offers" FOR SELECT USING ((("auth"."uid"() = "buyer_id") OR ("auth"."uid"() = "seller_id")));



CREATE POLICY "Participants or admin can update contract" ON "public"."gig_contracts" FOR UPDATE USING ((("auth"."uid"() = "buyer_id") OR ("auth"."uid"() = "seller_id") OR (EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."user_id" = "auth"."uid"())))));



CREATE POLICY "Read own security_logs" ON "public"."security_logs" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Read own subscriptions" ON "public"."subscriptions" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Recipients can mark messages as read" ON "public"."messages" FOR UPDATE USING ("public"."is_conversation_participant"("conversation_id"));



CREATE POLICY "Registrations viewable by everyone" ON "public"."event_registrations" FOR SELECT USING (true);



CREATE POLICY "Scholarships viewable by everyone" ON "public"."scholarships" FOR SELECT USING (true);



CREATE POLICY "Seller can insert delivery files" ON "public"."gig_delivery_files" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."gig_contracts" "c"
  WHERE (("c"."id" = "gig_delivery_files"."gig_contract_id") AND ("c"."seller_id" = "auth"."uid"())))));



CREATE POLICY "Sellers can request withdrawals" ON "public"."withdrawals" FOR INSERT WITH CHECK (("seller_id" = "auth"."uid"()));



CREATE POLICY "Sellers can view their own withdrawals" ON "public"."withdrawals" FOR SELECT USING (("seller_id" = "auth"."uid"()));



CREATE POLICY "Speakers viewable by everyone" ON "public"."event_speakers" FOR SELECT USING (true);



CREATE POLICY "Users can add participants" ON "public"."conversation_participants" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can add participants (to start/add to a DM)" ON "public"."conversation_participants" FOR INSERT WITH CHECK (("auth"."uid"() IS NOT NULL));



CREATE POLICY "Users can apply to open verified gigs that aren't their own" ON "public"."gig_applications" FOR INSERT WITH CHECK ((("auth"."uid"() = "applicant_id") AND (EXISTS ( SELECT 1
   FROM "public"."gigs" "g"
  WHERE (("g"."id" = "gig_applications"."gig_id") AND ("g"."verified" = true) AND (COALESCE("g"."status", 'active'::"text") = 'active'::"text") AND ("g"."posted_by" <> "auth"."uid"()))))));



CREATE POLICY "Users can cancel their own registration" ON "public"."event_registrations" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can comment as themselves" ON "public"."post_comments" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own comments" ON "public"."post_comments" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can delete their own gigs" ON "public"."gigs" FOR DELETE USING (("auth"."uid"() = "posted_by"));



CREATE POLICY "Users can follow others themselves" ON "public"."follows_deprecated" FOR INSERT WITH CHECK (("auth"."uid"() = "follower_id"));



CREATE POLICY "Users can join communities themselves" ON "public"."community_members" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can leave communities themselves" ON "public"."community_members" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can like/unlike posts themselves" ON "public"."post_likes" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can mark their own notifications read" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can post their own gigs" ON "public"."gigs" FOR INSERT WITH CHECK (("auth"."uid"() = "posted_by"));



CREATE POLICY "Users can register themselves" ON "public"."event_registrations" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can remove their own like" ON "public"."post_likes" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can submit reports" ON "public"."reports_moderation" FOR INSERT WITH CHECK (("auth"."uid"() = "reporter_id"));



CREATE POLICY "Users can submit their own applications" ON "public"."job_applications" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can unfollow themselves" ON "public"."follows_deprecated" FOR DELETE USING (("auth"."uid"() = "follower_id"));



CREATE POLICY "Users can update/delete their own gigs" ON "public"."gigs" FOR UPDATE USING (("auth"."uid"() = "posted_by"));



CREATE POLICY "Users can view their own applications" ON "public"."job_applications" FOR SELECT USING ((("auth"."uid"() = "user_id") OR "public"."is_admin"()));



CREATE POLICY "Users can view their own notifications" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users view own certificates" ON "public"."certificates" FOR SELECT USING ((("auth"."uid"() = "user_id") OR "public"."is_admin"()));



ALTER TABLE "public"."admin_activity_logs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_logs_select_admin" ON "public"."admin_activity_logs" FOR SELECT USING ("public"."is_admin"());



ALTER TABLE "public"."admins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."badges" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "badges_select_all" ON "public"."badges" FOR SELECT USING (true);



CREATE POLICY "blogs_delete_policy" ON "public"."blogs_deprecated" FOR DELETE USING (("auth"."uid"() IN ( SELECT "admins"."user_id"
   FROM "public"."admins")));



ALTER TABLE "public"."blogs_deprecated" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "blogs_insert_policy" ON "public"."blogs_deprecated" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "admins"."user_id"
   FROM "public"."admins")));



CREATE POLICY "blogs_select_policy" ON "public"."blogs_deprecated" FOR SELECT USING ((("published" = true) OR ("auth"."uid"() IN ( SELECT "admins"."user_id"
   FROM "public"."admins"))));



CREATE POLICY "blogs_update_policy" ON "public"."blogs_deprecated" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "admins"."user_id"
   FROM "public"."admins"))) WITH CHECK (("auth"."uid"() IN ( SELECT "admins"."user_id"
   FROM "public"."admins")));



CREATE POLICY "cb_manage" ON "public"."community_bans" USING (("public"."is_admin"() OR ("auth"."uid"() IN ( SELECT "community_members"."user_id"
   FROM "public"."community_members"
  WHERE (("community_members"."community_id" = "community_bans"."community_id") AND ("community_members"."role" = 'admin'::"text"))))));



CREATE POLICY "cb_select" ON "public"."community_bans" FOR SELECT USING (("public"."is_admin"() OR ("auth"."uid"() IN ( SELECT "community_members"."user_id"
   FROM "public"."community_members"
  WHERE (("community_members"."community_id" = "community_bans"."community_id") AND ("community_members"."role" = ANY (ARRAY['admin'::"text", 'moderator'::"text"])))))));



ALTER TABLE "public"."certificates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."certifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "certifications_admin_write" ON "public"."certifications" USING ("public"."is_admin"());



CREATE POLICY "certifications_select_published" ON "public"."certifications" FOR SELECT USING ((("published" = true) OR "public"."is_admin"()));



CREATE POLICY "cjr_insert" ON "public"."community_join_requests" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "cjr_select" ON "public"."community_join_requests" FOR SELECT USING ((("auth"."uid"() = "user_id") OR "public"."is_admin"() OR ("auth"."uid"() IN ( SELECT "community_members"."user_id"
   FROM "public"."community_members"
  WHERE (("community_members"."community_id" = "community_join_requests"."community_id") AND ("community_members"."role" = ANY (ARRAY['admin'::"text", 'moderator'::"text"])))))));



CREATE POLICY "cjr_update" ON "public"."community_join_requests" FOR UPDATE USING (("public"."is_admin"() OR ("auth"."uid"() IN ( SELECT "community_members"."user_id"
   FROM "public"."community_members"
  WHERE (("community_members"."community_id" = "community_join_requests"."community_id") AND ("community_members"."role" = ANY (ARRAY['admin'::"text", 'moderator'::"text"])))))));



ALTER TABLE "public"."communities" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_bans" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_channels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_join_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."community_resources" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."companies" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conn_delete" ON "public"."connections" FOR DELETE USING ((("auth"."uid"() = "user_one") OR ("auth"."uid"() = "user_two")));



CREATE POLICY "conn_insert" ON "public"."connections" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_one") OR ("auth"."uid"() = "user_two")));



CREATE POLICY "conn_select" ON "public"."connections" FOR SELECT USING ((("auth"."uid"() = "user_one") OR ("auth"."uid"() = "user_two")));



ALTER TABLE "public"."connected_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."connection_requests" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."connections" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."contact_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."content" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "content_delete_policy" ON "public"."content" FOR DELETE USING (("auth"."uid"() IN ( SELECT "admins"."user_id"
   FROM "public"."admins")));



CREATE POLICY "content_insert_policy" ON "public"."content" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "admins"."user_id"
   FROM "public"."admins")));



CREATE POLICY "content_select_policy" ON "public"."content" FOR SELECT USING ((("published" = true) OR ("auth"."uid"() IN ( SELECT "admins"."user_id"
   FROM "public"."admins"))));



CREATE POLICY "content_update_policy" ON "public"."content" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "admins"."user_id"
   FROM "public"."admins")));



CREATE POLICY "conv_insert_auth" ON "public"."conversations" FOR INSERT TO "authenticated" WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "conv_part_select_own_conversations" ON "public"."conversation_participants" FOR SELECT USING ("public"."is_conversation_participant"("conversation_id"));



CREATE POLICY "conv_select_participant" ON "public"."conversations" FOR SELECT TO "authenticated" USING ("public"."is_conversation_member"("id", "auth"."uid"()));



ALTER TABLE "public"."conversation_participants" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversations" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "conversations_select_participants" ON "public"."conversations" FOR SELECT USING ("public"."is_conversation_participant"("id"));



ALTER TABLE "public"."courses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."courses_v2" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "courses_v2_admin_write" ON "public"."courses_v2" USING ("public"."is_admin"());



CREATE POLICY "courses_v2_select_published" ON "public"."courses_v2" FOR SELECT USING ((("published" = true) OR "public"."is_admin"()));



CREATE POLICY "cp_insert_auth" ON "public"."conversation_participants" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "user_id") OR "public"."is_conversation_member"("conversation_id", "auth"."uid"())));



CREATE POLICY "cr_insert" ON "public"."connection_requests" FOR INSERT WITH CHECK (("auth"."uid"() = "sender_id"));



CREATE POLICY "cr_manage" ON "public"."community_resources" USING (("public"."is_admin"() OR ("auth"."uid"() IN ( SELECT "community_members"."user_id"
   FROM "public"."community_members"
  WHERE (("community_members"."community_id" = "community_resources"."community_id") AND ("community_members"."role" = ANY (ARRAY['admin'::"text", 'moderator'::"text"])))))));



CREATE POLICY "cr_select" ON "public"."community_resources" FOR SELECT USING (true);



CREATE POLICY "cr_select" ON "public"."connection_requests" FOR SELECT USING ((("auth"."uid"() = "sender_id") OR ("auth"."uid"() = "receiver_id")));



CREATE POLICY "cr_update_receiver" ON "public"."connection_requests" FOR UPDATE USING (("auth"."uid"() = "receiver_id"));



CREATE POLICY "cr_update_sender_cancel" ON "public"."connection_requests" FOR UPDATE USING (("auth"."uid"() = "sender_id"));



ALTER TABLE "public"."deleted_accounts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."disputes" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "edu_categories_admin_write" ON "public"."education_categories" USING ("public"."is_admin"());



CREATE POLICY "edu_categories_select_all" ON "public"."education_categories" FOR SELECT USING (true);



ALTER TABLE "public"."education_categories" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_agenda" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_faqs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_registrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."event_speakers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."feature_flags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "feature_flags_select_all" ON "public"."feature_flags" FOR SELECT USING (true);



CREATE POLICY "feature_flags_update_admin" ON "public"."feature_flags" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "follows_delete_own" ON "public"."follows_deprecated" FOR DELETE USING (("auth"."uid"() = "follower_id"));



ALTER TABLE "public"."follows_deprecated" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "follows_insert_own" ON "public"."follows_deprecated" FOR INSERT WITH CHECK (("auth"."uid"() = "follower_id"));



CREATE POLICY "follows_select_auth" ON "public"."follows_deprecated" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "gig_app_insert" ON "public"."gig_applications" FOR INSERT WITH CHECK (("auth"."uid"() = "applicant_id"));



CREATE POLICY "gig_app_select" ON "public"."gig_applications" FOR SELECT USING ((("auth"."uid"() = "applicant_id") OR ("auth"."uid"() IN ( SELECT "gigs"."posted_by"
   FROM "public"."gigs"
  WHERE ("gigs"."id" = "gig_applications"."gig_id")))));



CREATE POLICY "gig_app_update_owner" ON "public"."gig_applications" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "gigs"."posted_by"
   FROM "public"."gigs"
  WHERE ("gigs"."id" = "gig_applications"."gig_id"))));



ALTER TABLE "public"."gig_applications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gig_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "gig_categories_select_all" ON "public"."gig_categories" FOR SELECT USING (true);



CREATE POLICY "gig_categories_write_admin" ON "public"."gig_categories" USING ("public"."is_admin"());



ALTER TABLE "public"."gig_contracts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gig_delivery_files" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gig_offer_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gig_offers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "gig_tag_assign_select_all" ON "public"."gig_tag_assignments" FOR SELECT USING (true);



CREATE POLICY "gig_tag_assign_write" ON "public"."gig_tag_assignments" USING (("public"."is_admin"() OR ("auth"."uid"() IN ( SELECT "gigs"."posted_by"
   FROM "public"."gigs"
  WHERE ("gigs"."id" = "gig_tag_assignments"."gig_id")))));



ALTER TABLE "public"."gig_tag_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."gig_tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "gig_tags_select_all" ON "public"."gig_tags" FOR SELECT USING (true);



CREATE POLICY "gig_tags_write_admin" ON "public"."gig_tags" USING ("public"."is_admin"());



ALTER TABLE "public"."gigs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "gigs_delete_own_or_admin" ON "public"."gigs" FOR DELETE USING ((("posted_by" = "auth"."uid"()) OR "public"."is_admin"()));



CREATE POLICY "gigs_insert_own" ON "public"."gigs" FOR INSERT WITH CHECK (("posted_by" = "auth"."uid"()));



CREATE POLICY "gigs_select_verified_or_own" ON "public"."gigs" FOR SELECT USING ((("verified" = true) OR ("posted_by" = "auth"."uid"())));



CREATE POLICY "gigs_update_own_or_admin" ON "public"."gigs" FOR UPDATE USING ((("posted_by" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."job_applications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "job_apps_insert_own" ON "public"."job_applications" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "job_apps_select_own" ON "public"."job_applications" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."job_categories" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "job_categories_select_all" ON "public"."job_categories" FOR SELECT USING (true);



CREATE POLICY "job_categories_write_admin" ON "public"."job_categories" USING ("public"."is_admin"());



CREATE POLICY "job_tag_assign_select_all" ON "public"."job_tag_assignments" FOR SELECT USING (true);



CREATE POLICY "job_tag_assign_write_admin" ON "public"."job_tag_assignments" USING ("public"."is_admin"());



ALTER TABLE "public"."job_tag_assignments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."job_tags" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "job_tags_select_all" ON "public"."job_tags" FOR SELECT USING (true);



CREATE POLICY "job_tags_write_admin" ON "public"."job_tags" USING ("public"."is_admin"());



ALTER TABLE "public"."jobs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "messages_select_participants" ON "public"."messages" FOR SELECT USING ("public"."is_conversation_participant"("conversation_id"));



CREATE POLICY "msg_insert_participant" ON "public"."messages" FOR INSERT WITH CHECK ((("auth"."uid"() = "sender_id") AND ("conversation_id" IN ( SELECT "conversation_participants"."conversation_id"
   FROM "public"."conversation_participants"
  WHERE ("conversation_participants"."user_id" = "auth"."uid"())))));



CREATE POLICY "msg_select_participant" ON "public"."messages" FOR SELECT USING (("conversation_id" IN ( SELECT "conversation_participants"."conversation_id"
   FROM "public"."conversation_participants"
  WHERE ("conversation_participants"."user_id" = "auth"."uid"()))));



CREATE POLICY "msg_update_participant" ON "public"."messages" FOR UPDATE USING (("conversation_id" IN ( SELECT "conversation_participants"."conversation_id"
   FROM "public"."conversation_participants"
  WHERE ("conversation_participants"."user_id" = "auth"."uid"()))));



CREATE POLICY "notif_insert_auth" ON "public"."notifications" FOR INSERT WITH CHECK (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "notif_prefs_select_own" ON "public"."notification_preferences" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "notif_prefs_update_own" ON "public"."notification_preferences" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "notif_prefs_upsert_own" ON "public"."notification_preferences" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "notif_select_own" ON "public"."notifications" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "notif_update_own" ON "public"."notifications" FOR UPDATE USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."notification_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."notifications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notify_insert_own" ON "public"."notify_subscribers" FOR INSERT WITH CHECK ((("auth"."uid"() = "user_id") OR ("user_id" IS NULL)));



CREATE POLICY "notify_select_admin" ON "public"."notify_subscribers" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "notify_select_own" ON "public"."notify_subscribers" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."notify_subscribers" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "notify_subscribers_delete_auth" ON "public"."notify_subscribers" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "notify_subscribers_insert_auth" ON "public"."notify_subscribers" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "notify_subscribers_select_auth" ON "public"."notify_subscribers" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "notify_subscribers_update_auth" ON "public"."notify_subscribers" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "notify_update_admin" ON "public"."notify_subscribers" FOR UPDATE USING ("public"."is_admin"());



ALTER TABLE "public"."post_comments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."post_likes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."posts" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "posts_delete_own" ON "public"."posts" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "posts_insert_own" ON "public"."posts" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "posts_select_auth" ON "public"."posts" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "posts_select_visible" ON "public"."posts" FOR SELECT USING (((COALESCE("hidden_by_admin", false) = false) OR ("auth"."uid"() = "user_id") OR "public"."is_admin"()));



CREATE POLICY "posts_update_own" ON "public"."posts" FOR UPDATE USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "press_releases_delete_policy" ON "public"."press_releases_deprecated" FOR DELETE USING (("auth"."uid"() IN ( SELECT "admins"."user_id"
   FROM "public"."admins")));



ALTER TABLE "public"."press_releases_deprecated" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "press_releases_insert_policy" ON "public"."press_releases_deprecated" FOR INSERT WITH CHECK (("auth"."uid"() IN ( SELECT "admins"."user_id"
   FROM "public"."admins")));



CREATE POLICY "press_releases_select_policy" ON "public"."press_releases_deprecated" FOR SELECT USING ((("published" = true) OR ("auth"."uid"() IN ( SELECT "admins"."user_id"
   FROM "public"."admins"))));



CREATE POLICY "press_releases_update_policy" ON "public"."press_releases_deprecated" FOR UPDATE USING (("auth"."uid"() IN ( SELECT "admins"."user_id"
   FROM "public"."admins"))) WITH CHECK (("auth"."uid"() IN ( SELECT "admins"."user_id"
   FROM "public"."admins")));



ALTER TABLE "public"."privacy_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "profiles_insert_own" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "profiles_select_admin" ON "public"."profiles" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "profiles_select_all_auth" ON "public"."profiles" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "profiles_select_own" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "profiles_select_public_testimonial" ON "public"."profiles" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."testimonials" "t"
  WHERE (("t"."user_id" = "profiles"."id") AND ("t"."approved" = true) AND ("t"."featured" = true)))));



CREATE POLICY "profiles_update_own" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



ALTER TABLE "public"."reports_moderation" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."resources" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "resources_admin_write" ON "public"."resources" USING ("public"."is_admin"());



CREATE POLICY "resources_select_published" ON "public"."resources" FOR SELECT USING ((("published" = true) OR "public"."is_admin"()));



ALTER TABLE "public"."saved_items" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "saved_items_delete_own" ON "public"."saved_items" FOR DELETE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "saved_items_insert_own" ON "public"."saved_items" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "saved_items_select_own" ON "public"."saved_items" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."scholarships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."security_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."support_tickets" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."testimonials" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "testimonials_delete_admin" ON "public"."testimonials" FOR DELETE USING ("public"."is_admin"());



CREATE POLICY "testimonials_insert_admin" ON "public"."testimonials" FOR INSERT WITH CHECK ("public"."is_admin"());



CREATE POLICY "testimonials_insert_own" ON "public"."testimonials" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "testimonials_select_admin" ON "public"."testimonials" FOR SELECT USING ("public"."is_admin"());



CREATE POLICY "testimonials_select_own" ON "public"."testimonials" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "testimonials_select_public" ON "public"."testimonials" FOR SELECT USING ((("approved" = true) AND ("featured" = true)));



CREATE POLICY "testimonials_update_admin" ON "public"."testimonials" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "tickets_insert_own" ON "public"."support_tickets" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "tickets_select_own" ON "public"."support_tickets" FOR SELECT USING ((("auth"."uid"() = "user_id") OR "public"."is_admin"()));



CREATE POLICY "tickets_update_admin" ON "public"."support_tickets" FOR UPDATE USING ("public"."is_admin"());



CREATE POLICY "ub_delete" ON "public"."user_blocks" FOR DELETE USING (("auth"."uid"() = "blocker_id"));



CREATE POLICY "ub_insert" ON "public"."user_blocks" FOR INSERT WITH CHECK (("auth"."uid"() = "blocker_id"));



CREATE POLICY "ub_select" ON "public"."user_blocks" FOR SELECT USING (("auth"."uid"() = "blocker_id"));



ALTER TABLE "public"."user_activity" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_activity_select_own" ON "public"."user_activity" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."user_badges" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "user_badges_select_all" ON "public"."user_badges" FOR SELECT USING (true);



ALTER TABLE "public"."user_blocks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_gamification" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_preferences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."user_sessions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."withdrawals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."xp_history" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "xp_history_select_own" ON "public"."xp_history" FOR SELECT USING ((("auth"."uid"() = "user_id") OR "public"."is_admin"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."conversations";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."messages";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";























































































































































































































































































































































































GRANT ALL ON FUNCTION "public"."accept_connection_request"("p_request_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."accept_connection_request"("p_request_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."accept_connection_request"("p_request_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."add_admin"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."add_admin"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."add_admin"("target_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_mark_withdrawal_paid"("p_withdrawal_id" "uuid", "p_utr_reference" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_mark_withdrawal_paid"("p_withdrawal_id" "uuid", "p_utr_reference" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_mark_withdrawal_paid"("p_withdrawal_id" "uuid", "p_utr_reference" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_mark_withdrawal_paid"("p_withdrawal_id" "uuid", "p_utr_reference" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_moderate_gig"("p_gig_id" "uuid", "p_action" "text", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_moderate_gig"("p_gig_id" "uuid", "p_action" "text", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_moderate_gig"("p_gig_id" "uuid", "p_action" "text", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_moderate_job"("p_job_id" "uuid", "p_action" "text", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_moderate_job"("p_job_id" "uuid", "p_action" "text", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_moderate_job"("p_job_id" "uuid", "p_action" "text", "p_reason" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_resolve_dispute"("p_dispute_id" "uuid", "p_resolution" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_resolve_dispute"("p_dispute_id" "uuid", "p_resolution" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_resolve_dispute"("p_dispute_id" "uuid", "p_resolution" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_resolve_dispute"("p_dispute_id" "uuid", "p_resolution" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."admin_set_gig_auto_approve"("p_user_id" "uuid", "p_value" boolean) FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."admin_set_gig_auto_approve"("p_user_id" "uuid", "p_value" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_set_gig_auto_approve"("p_user_id" "uuid", "p_value" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_set_gig_auto_approve"("p_user_id" "uuid", "p_value" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_set_job_application_status"("p_application_id" "uuid", "p_status" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_set_job_application_status"("p_application_id" "uuid", "p_status" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_set_job_application_status"("p_application_id" "uuid", "p_status" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_set_user_status"("p_user_id" "uuid", "p_status" "text", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_set_user_status"("p_user_id" "uuid", "p_status" "text", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_set_user_status"("p_user_id" "uuid", "p_status" "text", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_toggle_report_content"("p_report_id" "uuid", "p_hide" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."admin_toggle_report_content"("p_report_id" "uuid", "p_hide" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_toggle_report_content"("p_report_id" "uuid", "p_hide" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."admin_update_report_status"("p_report_id" "uuid", "p_status" "text", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."admin_update_report_status"("p_report_id" "uuid", "p_status" "text", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."admin_update_report_status"("p_report_id" "uuid", "p_status" "text", "p_notes" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."approve_work"("p_contract_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."approve_work"("p_contract_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."approve_work"("p_contract_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."approve_work"("p_contract_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."award_xp_for_gig_creation"("p_gig_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."award_xp_for_gig_creation"("p_gig_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."award_xp_for_gig_creation"("p_gig_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."award_xp_for_job_application"("p_application_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."award_xp_for_job_application"("p_application_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."award_xp_for_job_application"("p_application_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."award_xp_internal"("p_user_id" "uuid", "p_amount" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."award_xp_internal"("p_user_id" "uuid", "p_amount" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."award_xp_internal"("p_user_id" "uuid", "p_amount" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."award_xp_internal"("p_user_id" "uuid", "p_amount" integer, "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."award_xp_internal"("p_user_id" "uuid", "p_amount" integer, "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."award_xp_internal"("p_user_id" "uuid", "p_amount" integer, "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."complete_gig_application"("p_application_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."complete_gig_application"("p_application_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."complete_gig_application"("p_application_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_settings"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_settings"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_settings"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_body" "text", "p_link" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_body" "text", "p_link" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_notification"("p_user_id" "uuid", "p_type" "text", "p_title" "text", "p_body" "text", "p_link" "text") TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_withdrawal_request"("p_upi_id" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_withdrawal_request"("p_upi_id" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_withdrawal_request"("p_upi_id" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_withdrawal_request"("p_upi_id" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."delete_channel"("p_channel_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."delete_channel"("p_channel_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."delete_channel"("p_channel_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."deliver_work"("p_contract_id" "uuid", "p_delivery_message" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."deliver_work"("p_contract_id" "uuid", "p_delivery_message" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."deliver_work"("p_contract_id" "uuid", "p_delivery_message" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."deliver_work"("p_contract_id" "uuid", "p_delivery_message" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_dashboard_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_dashboard_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_dashboard_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_landing_stats"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_landing_stats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_landing_stats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_community_member_leave"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_community_member_leave"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_community_member_leave"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_event_registration"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_event_registration"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_event_registration"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_gig_application_completed"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_gig_application_completed"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_gig_application_completed"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_gig_proposal"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_gig_proposal"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_gig_proposal"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_gig_verified"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_gig_verified"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_gig_verified"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_comment"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_comment"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_comment"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_community"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_community"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_community"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_community_channel"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_community_channel"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_community_channel"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_community_member"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_community_member"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_community_member"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_connection_request"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_connection_request"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_connection_request"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_follow"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_follow"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_follow"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_gig_application"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_gig_application"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_gig_application"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_like"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_like"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_like"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_message"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_message"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_message"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."hide_conversation"("p_conversation_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."hide_conversation"("p_conversation_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."hide_conversation"("p_conversation_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."hide_conversation"("p_conversation_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_conversation_member"("conv_id" "uuid", "usr_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_conversation_member"("conv_id" "uuid", "usr_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_conversation_member"("conv_id" "uuid", "usr_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."is_conversation_participant"("conv_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_conversation_participant"("conv_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_conversation_participant"("conv_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."join_channel"("p_channel_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."join_channel"("p_channel_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."join_channel"("p_channel_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_admin_action"("p_action" "text", "p_module" "text", "p_target_id" "uuid", "p_details" "jsonb") TO "anon";
GRANT ALL ON FUNCTION "public"."log_admin_action"("p_action" "text", "p_module" "text", "p_target_id" "uuid", "p_details" "jsonb") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_admin_action"("p_action" "text", "p_module" "text", "p_target_id" "uuid", "p_details" "jsonb") TO "service_role";



GRANT ALL ON FUNCTION "public"."log_user_activity"("p_user_id" "uuid", "p_type" "text", "p_description" "text", "p_reference_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."log_user_activity"("p_user_id" "uuid", "p_type" "text", "p_description" "text", "p_reference_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_user_activity"("p_user_id" "uuid", "p_type" "text", "p_description" "text", "p_reference_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."manage_event_seats"() TO "anon";
GRANT ALL ON FUNCTION "public"."manage_event_seats"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."manage_event_seats"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_new_support_ticket"() TO "anon";
GRANT ALL ON FUNCTION "public"."notify_new_support_ticket"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_new_support_ticket"() TO "service_role";



GRANT ALL ON FUNCTION "public"."notify_waitlist_on_publish"("p_feature_key" "text", "p_title" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."notify_waitlist_on_publish"("p_feature_key" "text", "p_title" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."notify_waitlist_on_publish"("p_feature_key" "text", "p_title" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_banned_user_join"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_banned_user_join"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_banned_user_join"() TO "service_role";



GRANT ALL ON FUNCTION "public"."prevent_gig_self_verification"() TO "anon";
GRANT ALL ON FUNCTION "public"."prevent_gig_self_verification"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."prevent_gig_self_verification"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."raise_dispute"("p_contract_id" "uuid", "p_category" "text", "p_description" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."raise_dispute"("p_contract_id" "uuid", "p_category" "text", "p_description" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."raise_dispute"("p_contract_id" "uuid", "p_category" "text", "p_description" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."raise_dispute"("p_contract_id" "uuid", "p_category" "text", "p_description" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."remove_admin"("target_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."remove_admin"("target_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."remove_admin"("target_user_id" "uuid") TO "service_role";



REVOKE ALL ON FUNCTION "public"."request_revision"("p_contract_id" "uuid", "p_notes" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."request_revision"("p_contract_id" "uuid", "p_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."request_revision"("p_contract_id" "uuid", "p_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."request_revision"("p_contract_id" "uuid", "p_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."send_message"("p_conversation_id" "uuid", "p_content" "text", "p_file_url" "text", "p_file_type" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."send_message"("p_conversation_id" "uuid", "p_content" "text", "p_file_url" "text", "p_file_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."send_message"("p_conversation_id" "uuid", "p_content" "text", "p_file_url" "text", "p_file_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."send_message"("p_conversation_id" "uuid", "p_content" "text", "p_file_url" "text", "p_file_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."start_direct_conversation"("other_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."start_direct_conversation"("other_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."start_direct_conversation"("other_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."test_func"() TO "anon";
GRANT ALL ON FUNCTION "public"."test_func"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."test_func"() TO "service_role";



GRANT ALL ON FUNCTION "public"."toggle_notify_me"("p_feature_key" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."toggle_notify_me"("p_feature_key" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."toggle_notify_me"("p_feature_key" "text") TO "service_role";



























GRANT ALL ON TABLE "public"."admin_activity_logs" TO "anon";
GRANT ALL ON TABLE "public"."admin_activity_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."admin_activity_logs" TO "service_role";



GRANT ALL ON TABLE "public"."admins" TO "anon";
GRANT ALL ON TABLE "public"."admins" TO "authenticated";
GRANT ALL ON TABLE "public"."admins" TO "service_role";



GRANT ALL ON TABLE "public"."badges" TO "anon";
GRANT ALL ON TABLE "public"."badges" TO "authenticated";
GRANT ALL ON TABLE "public"."badges" TO "service_role";



GRANT ALL ON TABLE "public"."blogs_deprecated" TO "anon";
GRANT ALL ON TABLE "public"."blogs_deprecated" TO "authenticated";
GRANT ALL ON TABLE "public"."blogs_deprecated" TO "service_role";



GRANT ALL ON TABLE "public"."certificates" TO "anon";
GRANT ALL ON TABLE "public"."certificates" TO "authenticated";
GRANT ALL ON TABLE "public"."certificates" TO "service_role";



GRANT ALL ON TABLE "public"."certifications" TO "anon";
GRANT ALL ON TABLE "public"."certifications" TO "authenticated";
GRANT ALL ON TABLE "public"."certifications" TO "service_role";



GRANT ALL ON TABLE "public"."communities" TO "anon";
GRANT ALL ON TABLE "public"."communities" TO "authenticated";
GRANT ALL ON TABLE "public"."communities" TO "service_role";



GRANT ALL ON TABLE "public"."community_bans" TO "anon";
GRANT ALL ON TABLE "public"."community_bans" TO "authenticated";
GRANT ALL ON TABLE "public"."community_bans" TO "service_role";



GRANT ALL ON TABLE "public"."community_channels" TO "anon";
GRANT ALL ON TABLE "public"."community_channels" TO "authenticated";
GRANT ALL ON TABLE "public"."community_channels" TO "service_role";



GRANT ALL ON TABLE "public"."community_join_requests" TO "anon";
GRANT ALL ON TABLE "public"."community_join_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."community_join_requests" TO "service_role";



GRANT ALL ON TABLE "public"."community_members" TO "anon";
GRANT ALL ON TABLE "public"."community_members" TO "authenticated";
GRANT ALL ON TABLE "public"."community_members" TO "service_role";



GRANT ALL ON TABLE "public"."community_resources" TO "anon";
GRANT ALL ON TABLE "public"."community_resources" TO "authenticated";
GRANT ALL ON TABLE "public"."community_resources" TO "service_role";



GRANT ALL ON TABLE "public"."companies" TO "anon";
GRANT ALL ON TABLE "public"."companies" TO "authenticated";
GRANT ALL ON TABLE "public"."companies" TO "service_role";



GRANT ALL ON TABLE "public"."connected_accounts" TO "anon";
GRANT ALL ON TABLE "public"."connected_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."connected_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."connection_requests" TO "anon";
GRANT ALL ON TABLE "public"."connection_requests" TO "authenticated";
GRANT ALL ON TABLE "public"."connection_requests" TO "service_role";



GRANT ALL ON TABLE "public"."connections" TO "anon";
GRANT ALL ON TABLE "public"."connections" TO "authenticated";
GRANT ALL ON TABLE "public"."connections" TO "service_role";



GRANT ALL ON TABLE "public"."contact_submissions" TO "anon";
GRANT ALL ON TABLE "public"."contact_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."contact_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."content" TO "anon";
GRANT ALL ON TABLE "public"."content" TO "authenticated";
GRANT ALL ON TABLE "public"."content" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_participants" TO "anon";
GRANT ALL ON TABLE "public"."conversation_participants" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_participants" TO "service_role";



GRANT ALL ON TABLE "public"."conversations" TO "anon";
GRANT ALL ON TABLE "public"."conversations" TO "authenticated";
GRANT ALL ON TABLE "public"."conversations" TO "service_role";



GRANT ALL ON TABLE "public"."courses" TO "anon";
GRANT ALL ON TABLE "public"."courses" TO "authenticated";
GRANT ALL ON TABLE "public"."courses" TO "service_role";



GRANT ALL ON TABLE "public"."courses_v2" TO "anon";
GRANT ALL ON TABLE "public"."courses_v2" TO "authenticated";
GRANT ALL ON TABLE "public"."courses_v2" TO "service_role";



GRANT ALL ON TABLE "public"."deleted_accounts" TO "anon";
GRANT ALL ON TABLE "public"."deleted_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."deleted_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."disputes" TO "anon";
GRANT ALL ON TABLE "public"."disputes" TO "authenticated";
GRANT ALL ON TABLE "public"."disputes" TO "service_role";



GRANT ALL ON TABLE "public"."education_categories" TO "anon";
GRANT ALL ON TABLE "public"."education_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."education_categories" TO "service_role";



GRANT ALL ON TABLE "public"."event_agenda" TO "anon";
GRANT ALL ON TABLE "public"."event_agenda" TO "authenticated";
GRANT ALL ON TABLE "public"."event_agenda" TO "service_role";



GRANT ALL ON TABLE "public"."event_faqs" TO "anon";
GRANT ALL ON TABLE "public"."event_faqs" TO "authenticated";
GRANT ALL ON TABLE "public"."event_faqs" TO "service_role";



GRANT ALL ON TABLE "public"."event_registrations" TO "anon";
GRANT ALL ON TABLE "public"."event_registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."event_registrations" TO "service_role";



GRANT ALL ON TABLE "public"."event_speakers" TO "anon";
GRANT ALL ON TABLE "public"."event_speakers" TO "authenticated";
GRANT ALL ON TABLE "public"."event_speakers" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON TABLE "public"."feature_flags" TO "anon";
GRANT ALL ON TABLE "public"."feature_flags" TO "authenticated";
GRANT ALL ON TABLE "public"."feature_flags" TO "service_role";



GRANT ALL ON TABLE "public"."follows_deprecated" TO "anon";
GRANT ALL ON TABLE "public"."follows_deprecated" TO "authenticated";
GRANT ALL ON TABLE "public"."follows_deprecated" TO "service_role";



GRANT ALL ON TABLE "public"."gig_applications" TO "anon";
GRANT ALL ON TABLE "public"."gig_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."gig_applications" TO "service_role";



GRANT ALL ON TABLE "public"."gig_categories" TO "anon";
GRANT ALL ON TABLE "public"."gig_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."gig_categories" TO "service_role";



GRANT ALL ON TABLE "public"."gig_contracts" TO "anon";
GRANT SELECT,INSERT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN ON TABLE "public"."gig_contracts" TO "authenticated";
GRANT ALL ON TABLE "public"."gig_contracts" TO "service_role";



GRANT ALL ON TABLE "public"."gig_delivery_files" TO "anon";
GRANT ALL ON TABLE "public"."gig_delivery_files" TO "authenticated";
GRANT ALL ON TABLE "public"."gig_delivery_files" TO "service_role";



GRANT ALL ON TABLE "public"."gig_offer_items" TO "anon";
GRANT ALL ON TABLE "public"."gig_offer_items" TO "authenticated";
GRANT ALL ON TABLE "public"."gig_offer_items" TO "service_role";



GRANT ALL ON TABLE "public"."gig_offers" TO "anon";
GRANT ALL ON TABLE "public"."gig_offers" TO "authenticated";
GRANT ALL ON TABLE "public"."gig_offers" TO "service_role";



GRANT ALL ON TABLE "public"."gig_tag_assignments" TO "anon";
GRANT ALL ON TABLE "public"."gig_tag_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."gig_tag_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."gig_tags" TO "anon";
GRANT ALL ON TABLE "public"."gig_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."gig_tags" TO "service_role";



GRANT ALL ON TABLE "public"."gigs" TO "anon";
GRANT ALL ON TABLE "public"."gigs" TO "authenticated";
GRANT ALL ON TABLE "public"."gigs" TO "service_role";



GRANT ALL ON TABLE "public"."job_applications" TO "anon";
GRANT ALL ON TABLE "public"."job_applications" TO "authenticated";
GRANT ALL ON TABLE "public"."job_applications" TO "service_role";



GRANT ALL ON TABLE "public"."job_categories" TO "anon";
GRANT ALL ON TABLE "public"."job_categories" TO "authenticated";
GRANT ALL ON TABLE "public"."job_categories" TO "service_role";



GRANT ALL ON TABLE "public"."job_tag_assignments" TO "anon";
GRANT ALL ON TABLE "public"."job_tag_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."job_tag_assignments" TO "service_role";



GRANT ALL ON TABLE "public"."job_tags" TO "anon";
GRANT ALL ON TABLE "public"."job_tags" TO "authenticated";
GRANT ALL ON TABLE "public"."job_tags" TO "service_role";



GRANT ALL ON TABLE "public"."jobs" TO "anon";
GRANT ALL ON TABLE "public"."jobs" TO "authenticated";
GRANT ALL ON TABLE "public"."jobs" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT SELECT,REFERENCES,DELETE,TRIGGER,TRUNCATE,MAINTAIN,UPDATE ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."notification_preferences" TO "anon";
GRANT ALL ON TABLE "public"."notification_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."notifications" TO "anon";
GRANT ALL ON TABLE "public"."notifications" TO "authenticated";
GRANT ALL ON TABLE "public"."notifications" TO "service_role";



GRANT ALL ON TABLE "public"."notify_subscribers" TO "anon";
GRANT ALL ON TABLE "public"."notify_subscribers" TO "authenticated";
GRANT ALL ON TABLE "public"."notify_subscribers" TO "service_role";



GRANT ALL ON TABLE "public"."post_comments" TO "anon";
GRANT ALL ON TABLE "public"."post_comments" TO "authenticated";
GRANT ALL ON TABLE "public"."post_comments" TO "service_role";



GRANT ALL ON TABLE "public"."post_likes" TO "anon";
GRANT ALL ON TABLE "public"."post_likes" TO "authenticated";
GRANT ALL ON TABLE "public"."post_likes" TO "service_role";



GRANT ALL ON TABLE "public"."posts" TO "anon";
GRANT ALL ON TABLE "public"."posts" TO "authenticated";
GRANT ALL ON TABLE "public"."posts" TO "service_role";



GRANT ALL ON TABLE "public"."press_releases_deprecated" TO "anon";
GRANT ALL ON TABLE "public"."press_releases_deprecated" TO "authenticated";
GRANT ALL ON TABLE "public"."press_releases_deprecated" TO "service_role";



GRANT ALL ON TABLE "public"."privacy_settings" TO "anon";
GRANT ALL ON TABLE "public"."privacy_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."privacy_settings" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."public_profiles" TO "anon";
GRANT ALL ON TABLE "public"."public_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."public_profiles" TO "service_role";



GRANT ALL ON TABLE "public"."reports_moderation" TO "anon";
GRANT ALL ON TABLE "public"."reports_moderation" TO "authenticated";
GRANT ALL ON TABLE "public"."reports_moderation" TO "service_role";



GRANT ALL ON TABLE "public"."resources" TO "anon";
GRANT ALL ON TABLE "public"."resources" TO "authenticated";
GRANT ALL ON TABLE "public"."resources" TO "service_role";



GRANT ALL ON TABLE "public"."saved_items" TO "anon";
GRANT ALL ON TABLE "public"."saved_items" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_items" TO "service_role";



GRANT ALL ON TABLE "public"."scholarships" TO "anon";
GRANT ALL ON TABLE "public"."scholarships" TO "authenticated";
GRANT ALL ON TABLE "public"."scholarships" TO "service_role";



GRANT ALL ON TABLE "public"."security_logs" TO "anon";
GRANT ALL ON TABLE "public"."security_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."security_logs" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."support_ticket_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."support_ticket_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."support_ticket_number_seq" TO "service_role";



GRANT ALL ON TABLE "public"."support_tickets" TO "anon";
GRANT ALL ON TABLE "public"."support_tickets" TO "authenticated";
GRANT ALL ON TABLE "public"."support_tickets" TO "service_role";



GRANT ALL ON TABLE "public"."testimonials" TO "anon";
GRANT ALL ON TABLE "public"."testimonials" TO "authenticated";
GRANT ALL ON TABLE "public"."testimonials" TO "service_role";



GRANT ALL ON TABLE "public"."user_activity" TO "anon";
GRANT ALL ON TABLE "public"."user_activity" TO "authenticated";
GRANT ALL ON TABLE "public"."user_activity" TO "service_role";



GRANT ALL ON TABLE "public"."user_badges" TO "anon";
GRANT ALL ON TABLE "public"."user_badges" TO "authenticated";
GRANT ALL ON TABLE "public"."user_badges" TO "service_role";



GRANT ALL ON TABLE "public"."user_blocks" TO "anon";
GRANT ALL ON TABLE "public"."user_blocks" TO "authenticated";
GRANT ALL ON TABLE "public"."user_blocks" TO "service_role";



GRANT ALL ON TABLE "public"."user_gamification" TO "anon";
GRANT ALL ON TABLE "public"."user_gamification" TO "authenticated";
GRANT ALL ON TABLE "public"."user_gamification" TO "service_role";



GRANT ALL ON TABLE "public"."user_preferences" TO "anon";
GRANT ALL ON TABLE "public"."user_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."user_preferences" TO "service_role";



GRANT ALL ON TABLE "public"."user_sessions" TO "anon";
GRANT ALL ON TABLE "public"."user_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."user_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."waitlist_counts" TO "anon";
GRANT ALL ON TABLE "public"."waitlist_counts" TO "authenticated";
GRANT ALL ON TABLE "public"."waitlist_counts" TO "service_role";



GRANT ALL ON TABLE "public"."withdrawals" TO "anon";
GRANT ALL ON TABLE "public"."withdrawals" TO "authenticated";
GRANT ALL ON TABLE "public"."withdrawals" TO "service_role";



GRANT ALL ON TABLE "public"."xp_history" TO "anon";
GRANT ALL ON TABLE "public"."xp_history" TO "authenticated";
GRANT ALL ON TABLE "public"."xp_history" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































