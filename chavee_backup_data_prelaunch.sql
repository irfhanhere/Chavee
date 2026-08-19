SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict 8PyQC6WJMKongVgcH496CVljdqHiErXAc66T1TogYOa0sjMtmjo7Mt2wselERcs

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

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
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at", "invite_token", "referrer", "oauth_client_state_id", "linking_target_id", "email_optional") VALUES
	('192dbd0a-f795-47ac-a449-337388336351', NULL, NULL, NULL, NULL, 'google', '', '', '2026-07-21 13:56:05.364436+00', '2026-07-21 13:56:05.364436+00', 'oauth', NULL, NULL, 'https://chavee.in/dashboard', NULL, NULL, false),
	('eda36ae8-d8fb-49e6-be5b-3dbba6241402', NULL, NULL, NULL, NULL, 'google', '', '', '2026-08-11 17:12:22.73929+00', '2026-08-11 17:12:22.73929+00', 'oauth', NULL, NULL, 'http://localhost:5173/dashboard', NULL, NULL, false),
	('b4fdabf9-5aea-4e1c-8f86-9f6b2b090149', NULL, NULL, NULL, NULL, 'google', '', '', '2026-07-23 10:55:13.328452+00', '2026-07-23 10:55:13.328452+00', 'oauth', NULL, NULL, 'https://chavee.in/dashboard', NULL, NULL, false),
	('ff5c72b0-44e3-4115-9c02-a300f0cbe321', NULL, NULL, NULL, NULL, 'google', '', '', '2026-07-23 10:56:33.96317+00', '2026-07-23 10:56:33.96317+00', 'oauth', NULL, NULL, 'https://chavee.in/dashboard', NULL, NULL, false),
	('0f2bd648-21f6-42ac-9eba-6dd17964fe64', NULL, NULL, NULL, NULL, 'google', '', '', '2026-07-24 13:45:41.960164+00', '2026-07-24 13:45:41.960164+00', 'oauth', NULL, NULL, 'https://chavee.in/dashboard', NULL, NULL, false),
	('5c8c2c9b-db56-4f22-b8f1-fa82c74009fb', NULL, NULL, NULL, NULL, 'google', '', '', '2026-07-25 17:37:03.022277+00', '2026-07-25 17:37:03.022277+00', 'oauth', NULL, NULL, 'https://chavee.in/dashboard', NULL, NULL, false),
	('cabae8a1-586c-49c2-a624-a74d81b79960', NULL, NULL, NULL, NULL, 'google', '', '', '2026-07-25 19:28:07.404375+00', '2026-07-25 19:28:07.404375+00', 'oauth', NULL, NULL, 'https://chavee.in', NULL, NULL, false),
	('366657b4-cfd5-4a17-8cd7-c05a299e6fd8', NULL, NULL, NULL, NULL, 'google', '', '', '2026-08-14 09:53:32.149019+00', '2026-08-14 09:53:32.149019+00', 'oauth', NULL, NULL, 'http://localhost:5173/dashboard', NULL, NULL, false),
	('660c2495-0ac1-457c-bb09-41b04e66fd54', NULL, NULL, NULL, NULL, 'google', '', '', '2026-07-28 11:33:16.832997+00', '2026-07-28 11:33:16.832997+00', 'oauth', NULL, NULL, 'https://chavee.in/dashboard', NULL, NULL, false),
	('195333e3-36a4-4cef-9ee1-7e3e301af06d', NULL, NULL, NULL, NULL, 'google', '', '', '2026-07-29 08:17:07.148645+00', '2026-07-29 08:17:07.148645+00', 'oauth', NULL, NULL, 'https://chavee.in/dashboard', NULL, NULL, false),
	('83ecf38e-21a7-469a-b454-81f2a552f327', NULL, NULL, NULL, NULL, 'google', '', '', '2026-07-30 15:42:23.832148+00', '2026-07-30 15:42:23.832148+00', 'oauth', NULL, NULL, 'https://chavee.in/dashboard', NULL, NULL, false),
	('3366c711-f6f0-47e1-a74d-1ba56afc5c3f', NULL, NULL, NULL, NULL, 'google', '', '', '2026-08-02 16:51:25.119469+00', '2026-08-02 16:51:25.119469+00', 'oauth', NULL, NULL, 'https://chavee.in/chavee/onboarding', NULL, NULL, false);


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '0f53f9b7-a987-43da-b70d-a49dd9170f09', 'authenticated', 'authenticated', 'dreamwalk757@gmail.com', NULL, '2026-08-17 04:17:06.96751+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-17 04:17:06.977983+00', '{"provider": "google", "providers": ["google"]}', '{"iss": "https://accounts.google.com", "sub": "113505477303620287932", "name": "Neeraj", "email": "dreamwalk757@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJeYYBqQWcitpjHJ_vlgz3yCUullPsHcOwrmWRY4LQEEcuK1hU=s96-c", "full_name": "Neeraj", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJeYYBqQWcitpjHJ_vlgz3yCUullPsHcOwrmWRY4LQEEcuK1hU=s96-c", "provider_id": "113505477303620287932", "email_verified": true, "phone_verified": false}', NULL, '2026-08-17 04:17:06.87394+00', '2026-08-17 04:17:07.026857+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'authenticated', 'authenticated', 'akshayepni@gmail.com', '$2a$10$xpHJEmisvm4VQQovkNSokOY5hCRxyfkpbVqdPDZjVURIF5p0gjzlq', '2026-07-12 18:24:17.041506+00', NULL, '', NULL, '', NULL, '', '', NULL, '2026-08-12 06:30:02.878519+00', '{"provider": "email", "providers": ["email", "google"]}', '{"iss": "https://accounts.google.com", "sub": "117360002691133723017", "name": "AKSHAY E", "email": "akshayepni@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJydx7XGcXuq_MmCHbojL_MtSEJBRp1ltp6p9l4pc_5xrQKgUXGCQ=s96-c", "full_name": "AKSHAY E", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJydx7XGcXuq_MmCHbojL_MtSEJBRp1ltp6p9l4pc_5xrQKgUXGCQ=s96-c", "provider_id": "117360002691133723017", "email_verified": true, "phone_verified": false}', NULL, '2026-07-12 18:24:03.585455+00', '2026-08-17 04:37:48.709039+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'authenticated', 'authenticated', 'headspace730@gmail.com', '$2a$10$uKkc4XyEKkDl093JFiWvHOVR.fplXOeXMY1VgxJ1hJD3uYMybQhza', '2026-07-12 15:35:55.834715+00', NULL, '', NULL, 'd01429939b5cb0609baa4ba042d1d6928506f62229bece3a903e5ad9', '2026-08-16 17:40:09.814506+00', '', '', NULL, '2026-08-18 04:56:56.196214+00', '{"provider": "email", "providers": ["email", "google"]}', '{"iss": "https://accounts.google.com", "sub": "113135662477507461337", "name": "Irfhan", "email": "headspace730@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLAwxptZ0pPBxRZUB_xkMD4bhGWGg_0woaDGyGLXozGiConlUoF=s96-c", "full_name": "Irfhan", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLAwxptZ0pPBxRZUB_xkMD4bhGWGg_0woaDGyGLXozGiConlUoF=s96-c", "provider_id": "113135662477507461337", "email_verified": true, "phone_verified": false}', NULL, '2026-07-12 15:35:26.589499+00', '2026-08-18 04:56:56.278831+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('4cc6de1f-4783-4946-aba7-91e4782d3818', '4cc6de1f-4783-4946-aba7-91e4782d3818', '{"sub": "4cc6de1f-4783-4946-aba7-91e4782d3818", "email": "headspace730@gmail.com", "email_verified": true, "phone_verified": false}', 'email', '2026-07-12 15:35:26.633681+00', '2026-07-12 15:35:26.633744+00', '2026-07-12 15:35:26.633744+00', 'acc5dca4-512b-45c0-bfed-2d4d77a34ae0'),
	('2b1734b5-4b93-4603-ba71-1a6120ccd502', '2b1734b5-4b93-4603-ba71-1a6120ccd502', '{"sub": "2b1734b5-4b93-4603-ba71-1a6120ccd502", "email": "akshayepni@gmail.com", "full_name": "akshay", "email_verified": true, "phone_verified": false}', 'email', '2026-07-12 18:24:03.619982+00', '2026-07-12 18:24:03.620043+00', '2026-07-12 18:24:03.620043+00', 'cf854459-c7ed-4750-afe0-a971dfb2c63a'),
	('117360002691133723017', '2b1734b5-4b93-4603-ba71-1a6120ccd502', '{"iss": "https://accounts.google.com", "sub": "117360002691133723017", "name": "AKSHAY E", "email": "akshayepni@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJydx7XGcXuq_MmCHbojL_MtSEJBRp1ltp6p9l4pc_5xrQKgUXGCQ=s96-c", "full_name": "AKSHAY E", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJydx7XGcXuq_MmCHbojL_MtSEJBRp1ltp6p9l4pc_5xrQKgUXGCQ=s96-c", "provider_id": "117360002691133723017", "email_verified": true, "phone_verified": false}', 'google', '2026-07-21 09:28:22.395021+00', '2026-07-21 09:28:22.39511+00', '2026-08-12 06:30:02.873892+00', '79f6222a-28d7-41af-a5d9-607becfee548'),
	('113505477303620287932', '0f53f9b7-a987-43da-b70d-a49dd9170f09', '{"iss": "https://accounts.google.com", "sub": "113505477303620287932", "name": "Neeraj", "email": "dreamwalk757@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocJeYYBqQWcitpjHJ_vlgz3yCUullPsHcOwrmWRY4LQEEcuK1hU=s96-c", "full_name": "Neeraj", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocJeYYBqQWcitpjHJ_vlgz3yCUullPsHcOwrmWRY4LQEEcuK1hU=s96-c", "provider_id": "113505477303620287932", "email_verified": true, "phone_verified": false}', 'google', '2026-08-17 04:17:06.95153+00', '2026-08-17 04:17:06.951596+00', '2026-08-17 04:17:06.951596+00', 'bafc8b53-98cc-46b4-b23a-3a0b0072d2ed'),
	('113135662477507461337', '4cc6de1f-4783-4946-aba7-91e4782d3818', '{"iss": "https://accounts.google.com", "sub": "113135662477507461337", "name": "Irfhan", "email": "headspace730@gmail.com", "picture": "https://lh3.googleusercontent.com/a/ACg8ocLAwxptZ0pPBxRZUB_xkMD4bhGWGg_0woaDGyGLXozGiConlUoF=s96-c", "full_name": "Irfhan", "avatar_url": "https://lh3.googleusercontent.com/a/ACg8ocLAwxptZ0pPBxRZUB_xkMD4bhGWGg_0woaDGyGLXozGiConlUoF=s96-c", "provider_id": "113135662477507461337", "email_verified": true, "phone_verified": false}', 'google', '2026-07-12 16:23:02.672502+00', '2026-07-12 16:23:02.67258+00', '2026-08-10 08:19:04.371602+00', 'afed8a63-8a27-47f5-a9fd-d343e89334ad');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") VALUES
	('bf7ea318-5879-48f9-82aa-4a45392b170c', '0f53f9b7-a987-43da-b70d-a49dd9170f09', '2026-08-17 04:17:06.97921+00', '2026-08-17 04:17:06.97921+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36', '49.37.232.177', NULL, NULL, NULL, NULL, NULL),
	('bf816ef1-a535-4062-b81d-7f6bdb6e68af', '2b1734b5-4b93-4603-ba71-1a6120ccd502', '2026-08-03 05:54:37.438561+00', '2026-08-03 05:54:37.438561+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36', '27.60.135.135', NULL, NULL, NULL, NULL, NULL),
	('60fcc8c3-2d85-45bc-a791-f2fa5c0b0e4c', '2b1734b5-4b93-4603-ba71-1a6120ccd502', '2026-08-03 06:19:07.398838+00', '2026-08-03 06:19:07.398838+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '27.60.135.135', NULL, NULL, NULL, NULL, NULL),
	('83feda6f-707f-4701-a700-e9a6e84e779f', '2b1734b5-4b93-4603-ba71-1a6120ccd502', '2026-08-04 10:30:07.08537+00', '2026-08-04 10:30:07.08537+00', NULL, 'aal1', NULL, NULL, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36 Edg/145.0.0.0', '223.188.115.77', NULL, NULL, NULL, NULL, NULL),
	('cacea360-336e-46d7-9aa5-a61b6ebb70de', '2b1734b5-4b93-4603-ba71-1a6120ccd502', '2026-08-12 06:29:09.753317+00', '2026-08-12 06:29:31.79174+00', NULL, 'aal1', NULL, '2026-08-12 06:29:31.791603', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '27.60.134.194', NULL, NULL, NULL, NULL, NULL),
	('68ab9fc1-b44e-4261-bba6-82b16ebf678f', '2b1734b5-4b93-4603-ba71-1a6120ccd502', '2026-08-12 06:30:02.878609+00', '2026-08-17 04:37:48.751848+00', NULL, 'aal1', NULL, '2026-08-17 04:37:48.751728', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '111.92.80.121', NULL, NULL, NULL, NULL, NULL),
	('51aaf47d-bb29-47fc-955f-53d1350aeb62', '2b1734b5-4b93-4603-ba71-1a6120ccd502', '2026-08-04 20:17:04.438707+00', '2026-08-09 13:15:16.44968+00', NULL, 'aal1', NULL, '2026-08-09 13:15:16.449565', 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36', '223.188.164.40', NULL, NULL, NULL, NULL, NULL),
	('6dfc17a7-adc1-4fbf-a0ec-ef7c27059e36', '2b1734b5-4b93-4603-ba71-1a6120ccd502', '2026-08-12 06:29:43.181877+00', '2026-08-12 06:29:47.872464+00', NULL, 'aal1', NULL, '2026-08-12 06:29:47.872342', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36 Edg/151.0.0.0', '27.60.134.194', NULL, NULL, NULL, NULL, NULL);


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") VALUES
	('bf7ea318-5879-48f9-82aa-4a45392b170c', '2026-08-17 04:17:07.028304+00', '2026-08-17 04:17:07.028304+00', 'oauth', 'c171cde0-44bb-4731-9aa5-f33119bed344'),
	('bf816ef1-a535-4062-b81d-7f6bdb6e68af', '2026-08-03 05:54:37.494495+00', '2026-08-03 05:54:37.494495+00', 'oauth', '84ce1fae-681c-40c0-8a8c-2958bdc805e0'),
	('60fcc8c3-2d85-45bc-a791-f2fa5c0b0e4c', '2026-08-03 06:19:07.405495+00', '2026-08-03 06:19:07.405495+00', 'oauth', '55086879-18ae-4ff8-82ca-e19b427b8ee0'),
	('83feda6f-707f-4701-a700-e9a6e84e779f', '2026-08-04 10:30:07.146282+00', '2026-08-04 10:30:07.146282+00', 'oauth', '0045543d-7388-4eac-a9f0-9f683263110b'),
	('51aaf47d-bb29-47fc-955f-53d1350aeb62', '2026-08-04 20:17:04.496235+00', '2026-08-04 20:17:04.496235+00', 'oauth', '9db6d42b-6611-4f94-a042-24638cf8081d'),
	('cacea360-336e-46d7-9aa5-a61b6ebb70de', '2026-08-12 06:29:09.818411+00', '2026-08-12 06:29:09.818411+00', 'oauth', '98bbf34e-02b9-4f46-8214-d06427257d4e'),
	('6dfc17a7-adc1-4fbf-a0ec-ef7c27059e36', '2026-08-12 06:29:43.194098+00', '2026-08-12 06:29:43.194098+00', 'oauth', 'ae8a948a-0c4a-4b8a-ad4e-90febe7169cd'),
	('68ab9fc1-b44e-4261-bba6-82b16ebf678f', '2026-08-12 06:30:02.882512+00', '2026-08-12 06:30:02.882512+00', 'oauth', '8b805729-7ae2-4726-87c6-e2a6b9ef3249');


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at") VALUES
	('c112f268-88a7-410c-a33c-3874f39628c8', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'recovery_token', 'd01429939b5cb0609baa4ba042d1d6928506f62229bece3a903e5ad9', 'headspace730@gmail.com', '2026-08-16 17:40:12.589138', '2026-08-16 17:40:12.589138');


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") VALUES
	('00000000-0000-0000-0000-000000000000', 432, '4l5arzxv7o4m', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-09 09:05:53.785289+00', '2026-08-09 13:15:16.400709+00', 't7an56dqkxnn', '51aaf47d-bb29-47fc-955f-53d1350aeb62'),
	('00000000-0000-0000-0000-000000000000', 456, 'aonjksah246g', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:09.777009+00', '2026-08-12 06:29:10.721926+00', NULL, 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 457, 'zkrc76vmcepg', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:10.725094+00', '2026-08-12 06:29:11.054612+00', 'aonjksah246g', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 458, 'ye6zeyqpdx3s', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:11.055338+00', '2026-08-12 06:29:11.335782+00', 'zkrc76vmcepg', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 459, '4nc5b2wqgs5y', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:11.336738+00', '2026-08-12 06:29:12.0569+00', 'ye6zeyqpdx3s', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 460, 'swt5qanurwcs', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:12.057933+00', '2026-08-12 06:29:12.384549+00', '4nc5b2wqgs5y', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 461, '6ljf7j5of6zi', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:12.386162+00', '2026-08-12 06:29:12.765194+00', 'swt5qanurwcs', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 462, 'nuddn2v326k5', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:12.766498+00', '2026-08-12 06:29:13.14824+00', '6ljf7j5of6zi', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 463, 'vsttppyt23j5', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:13.148664+00', '2026-08-12 06:29:22.799271+00', 'nuddn2v326k5', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 464, 'xzoj7o2atl4l', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:22.799702+00', '2026-08-12 06:29:23.044013+00', 'vsttppyt23j5', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 465, 'avbsgl4anla2', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:23.044358+00', '2026-08-12 06:29:23.284304+00', 'xzoj7o2atl4l', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 466, 'hr2y6eny4jbb', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:23.284807+00', '2026-08-12 06:29:23.556037+00', 'avbsgl4anla2', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 467, 'aovbmnjwohtv', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:23.556428+00', '2026-08-12 06:29:23.86521+00', 'hr2y6eny4jbb', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 468, 'xk7wtewtcwwz', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:23.868428+00', '2026-08-12 06:29:24.172882+00', 'aovbmnjwohtv', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 514, '7psjv6xa43gn', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:30:34.419588+00', '2026-08-12 06:30:34.656644+00', 'p5pq63s26ifl', '68ab9fc1-b44e-4261-bba6-82b16ebf678f'),
	('00000000-0000-0000-0000-000000000000', 589, '6yiutrg65hra', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-15 17:30:10.420788+00', '2026-08-17 04:37:48.686963+00', 't37wsyfes5o4', '68ab9fc1-b44e-4261-bba6-82b16ebf678f'),
	('00000000-0000-0000-0000-000000000000', 376, 't7an56dqkxnn', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-05 00:10:44.525195+00', '2026-08-09 09:05:53.780508+00', 'cvoeat2qgnkd', '51aaf47d-bb29-47fc-955f-53d1350aeb62'),
	('00000000-0000-0000-0000-000000000000', 439, '3cnskosr7dux', '2b1734b5-4b93-4603-ba71-1a6120ccd502', false, '2026-08-09 13:15:16.420704+00', '2026-08-09 13:15:16.420704+00', '4l5arzxv7o4m', '51aaf47d-bb29-47fc-955f-53d1350aeb62'),
	('00000000-0000-0000-0000-000000000000', 469, 'r5rq7nplgyti', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:24.173266+00', '2026-08-12 06:29:24.506417+00', 'xk7wtewtcwwz', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 470, 'mnfcutqcztfb', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:24.506866+00', '2026-08-12 06:29:24.740463+00', 'r5rq7nplgyti', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 471, 's7oeh6snqh3e', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:24.740939+00', '2026-08-12 06:29:24.949454+00', 'mnfcutqcztfb', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 364, 'umwl6ikq5km3', '2b1734b5-4b93-4603-ba71-1a6120ccd502', false, '2026-08-03 05:54:37.46466+00', '2026-08-03 05:54:37.46466+00', NULL, 'bf816ef1-a535-4062-b81d-7f6bdb6e68af'),
	('00000000-0000-0000-0000-000000000000', 367, '2tbawz7xo637', '2b1734b5-4b93-4603-ba71-1a6120ccd502', false, '2026-08-03 06:19:07.401132+00', '2026-08-03 06:19:07.401132+00', NULL, '60fcc8c3-2d85-45bc-a791-f2fa5c0b0e4c'),
	('00000000-0000-0000-0000-000000000000', 373, 'hvlbtgft4eyk', '2b1734b5-4b93-4603-ba71-1a6120ccd502', false, '2026-08-04 10:30:07.115176+00', '2026-08-04 10:30:07.115176+00', NULL, '83feda6f-707f-4701-a700-e9a6e84e779f'),
	('00000000-0000-0000-0000-000000000000', 375, 'cvoeat2qgnkd', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-04 20:17:04.463084+00', '2026-08-05 00:10:44.502102+00', NULL, '51aaf47d-bb29-47fc-955f-53d1350aeb62'),
	('00000000-0000-0000-0000-000000000000', 619, 'pstoq3dij3v7', '0f53f9b7-a987-43da-b70d-a49dd9170f09', false, '2026-08-17 04:17:07.002651+00', '2026-08-17 04:17:07.002651+00', NULL, 'bf7ea318-5879-48f9-82aa-4a45392b170c'),
	('00000000-0000-0000-0000-000000000000', 472, 'qy4dk74arok5', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:24.949798+00', '2026-08-12 06:29:25.193746+00', 's7oeh6snqh3e', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 473, 'k3udzufs63er', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:25.194145+00', '2026-08-12 06:29:25.452049+00', 'qy4dk74arok5', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 474, 've23znyfl2bn', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:25.45245+00', '2026-08-12 06:29:25.6793+00', 'k3udzufs63er', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 475, 'xqc62xybxx5e', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:25.682211+00', '2026-08-12 06:29:26.250591+00', 've23znyfl2bn', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 476, 'x5m3dcdwmlsn', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:26.250972+00', '2026-08-12 06:29:26.832644+00', 'xqc62xybxx5e', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 477, '3lcyzyu33eam', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:26.833257+00', '2026-08-12 06:29:27.112888+00', 'x5m3dcdwmlsn', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 478, 'py2ulqsmv7w4', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:27.113409+00', '2026-08-12 06:29:27.359731+00', '3lcyzyu33eam', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 479, '4grvetjzlckk', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:27.360457+00', '2026-08-12 06:29:27.590593+00', 'py2ulqsmv7w4', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 480, 'nlbir6wuxr44', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:27.590953+00', '2026-08-12 06:29:27.903191+00', '4grvetjzlckk', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 481, 'bxoutyfdhubg', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:27.903622+00', '2026-08-12 06:29:28.175506+00', 'nlbir6wuxr44', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 482, '6kcoqrkaxrk4', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:28.177239+00', '2026-08-12 06:29:28.465733+00', 'bxoutyfdhubg', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 483, 'keyh46vh2pty', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:28.466922+00', '2026-08-12 06:29:28.719689+00', '6kcoqrkaxrk4', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 484, 'cnnzgfwusrpw', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:28.722339+00', '2026-08-12 06:29:28.982888+00', 'keyh46vh2pty', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 485, '3c2dl6fowtfo', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:28.983331+00', '2026-08-12 06:29:29.240251+00', 'cnnzgfwusrpw', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 486, '3o43hljbtwv2', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:29.24067+00', '2026-08-12 06:29:29.495083+00', '3c2dl6fowtfo', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 487, '5xdluiwxatbv', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:29.495652+00', '2026-08-12 06:29:29.743307+00', '3o43hljbtwv2', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 488, 'rlcanvk3qcv7', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:29.743787+00', '2026-08-12 06:29:29.98736+00', '5xdluiwxatbv', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 489, 'mcumdr3rk3id', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:29.988141+00', '2026-08-12 06:29:30.21589+00', 'rlcanvk3qcv7', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 490, 'y7j6j5l7tnev', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:30.216415+00', '2026-08-12 06:29:30.462612+00', 'mcumdr3rk3id', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 491, '4acm5vvkggcd', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:30.463545+00', '2026-08-12 06:29:30.72642+00', 'y7j6j5l7tnev', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 492, 'qyvekx5jhbzx', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:30.727066+00', '2026-08-12 06:29:30.954457+00', '4acm5vvkggcd', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 493, 'swjsotdkiafu', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:30.955576+00', '2026-08-12 06:29:31.240925+00', 'qyvekx5jhbzx', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 494, 'if7x3aydwjsu', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:31.241735+00', '2026-08-12 06:29:31.517275+00', 'swjsotdkiafu', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 495, 'xdnjq6jqulmy', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:31.518248+00', '2026-08-12 06:29:31.780976+00', 'if7x3aydwjsu', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 496, 'onomxculc2kq', '2b1734b5-4b93-4603-ba71-1a6120ccd502', false, '2026-08-12 06:29:31.78478+00', '2026-08-12 06:29:31.78478+00', 'xdnjq6jqulmy', 'cacea360-336e-46d7-9aa5-a61b6ebb70de'),
	('00000000-0000-0000-0000-000000000000', 497, 'oryjyvlzlx3f', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:43.190512+00', '2026-08-12 06:29:43.92167+00', NULL, '6dfc17a7-adc1-4fbf-a0ec-ef7c27059e36'),
	('00000000-0000-0000-0000-000000000000', 498, 'zlvsqo7cy7f4', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:43.922076+00', '2026-08-12 06:29:44.132308+00', 'oryjyvlzlx3f', '6dfc17a7-adc1-4fbf-a0ec-ef7c27059e36'),
	('00000000-0000-0000-0000-000000000000', 499, 'aaru5ruz5kc3', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:44.132818+00', '2026-08-12 06:29:44.365703+00', 'zlvsqo7cy7f4', '6dfc17a7-adc1-4fbf-a0ec-ef7c27059e36'),
	('00000000-0000-0000-0000-000000000000', 500, 'rjyyd4vy4sgm', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:44.366699+00', '2026-08-12 06:29:44.840462+00', 'aaru5ruz5kc3', '6dfc17a7-adc1-4fbf-a0ec-ef7c27059e36'),
	('00000000-0000-0000-0000-000000000000', 501, 'aehhp4wprqjj', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:44.840825+00', '2026-08-12 06:29:45.194051+00', 'rjyyd4vy4sgm', '6dfc17a7-adc1-4fbf-a0ec-ef7c27059e36'),
	('00000000-0000-0000-0000-000000000000', 513, 'p5pq63s26ifl', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:30:06.117477+00', '2026-08-12 06:30:34.416135+00', 'lyd5cpywc2te', '68ab9fc1-b44e-4261-bba6-82b16ebf678f'),
	('00000000-0000-0000-0000-000000000000', 502, 'yyuis36nkdyu', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:45.195159+00', '2026-08-12 06:29:45.669882+00', 'aehhp4wprqjj', '6dfc17a7-adc1-4fbf-a0ec-ef7c27059e36'),
	('00000000-0000-0000-0000-000000000000', 515, 'i644faqc2cdr', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:30:34.657089+00', '2026-08-12 06:31:05.076832+00', '7psjv6xa43gn', '68ab9fc1-b44e-4261-bba6-82b16ebf678f'),
	('00000000-0000-0000-0000-000000000000', 503, 'cihl65uaggdh', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:45.67025+00', '2026-08-12 06:29:47.657864+00', 'yyuis36nkdyu', '6dfc17a7-adc1-4fbf-a0ec-ef7c27059e36'),
	('00000000-0000-0000-0000-000000000000', 546, 'mv4i4tdyzjcx', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-14 07:29:49.111699+00', '2026-08-14 15:13:36.058919+00', 'dfe6lszfhqou', '68ab9fc1-b44e-4261-bba6-82b16ebf678f'),
	('00000000-0000-0000-0000-000000000000', 504, 'sgjifwdnur3l', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:29:47.658231+00', '2026-08-12 06:29:47.869581+00', 'cihl65uaggdh', '6dfc17a7-adc1-4fbf-a0ec-ef7c27059e36'),
	('00000000-0000-0000-0000-000000000000', 505, 'fhpjsgz6ojwk', '2b1734b5-4b93-4603-ba71-1a6120ccd502', false, '2026-08-12 06:29:47.869946+00', '2026-08-12 06:29:47.869946+00', 'sgjifwdnur3l', '6dfc17a7-adc1-4fbf-a0ec-ef7c27059e36'),
	('00000000-0000-0000-0000-000000000000', 516, 'ifqrvawfxucb', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:31:05.077359+00', '2026-08-12 06:31:05.324774+00', 'i644faqc2cdr', '68ab9fc1-b44e-4261-bba6-82b16ebf678f'),
	('00000000-0000-0000-0000-000000000000', 506, 'zc5io64mv6tt', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:30:02.880279+00', '2026-08-12 06:30:04.37851+00', NULL, '68ab9fc1-b44e-4261-bba6-82b16ebf678f'),
	('00000000-0000-0000-0000-000000000000', 620, 'o5asfzmxv5kk', '2b1734b5-4b93-4603-ba71-1a6120ccd502', false, '2026-08-17 04:37:48.699744+00', '2026-08-17 04:37:48.699744+00', '6yiutrg65hra', '68ab9fc1-b44e-4261-bba6-82b16ebf678f'),
	('00000000-0000-0000-0000-000000000000', 507, 'seir2uyyfadu', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:30:04.378898+00', '2026-08-12 06:30:04.62774+00', 'zc5io64mv6tt', '68ab9fc1-b44e-4261-bba6-82b16ebf678f'),
	('00000000-0000-0000-0000-000000000000', 517, 'zx6fzsahtp6w', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:31:05.325343+00', '2026-08-12 06:31:34.758801+00', 'ifqrvawfxucb', '68ab9fc1-b44e-4261-bba6-82b16ebf678f'),
	('00000000-0000-0000-0000-000000000000', 508, 'takbizv3ajhu', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:30:04.628164+00', '2026-08-12 06:30:04.881149+00', 'seir2uyyfadu', '68ab9fc1-b44e-4261-bba6-82b16ebf678f'),
	('00000000-0000-0000-0000-000000000000', 509, '6imh7dh727de', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:30:04.883237+00', '2026-08-12 06:30:05.22699+00', 'takbizv3ajhu', '68ab9fc1-b44e-4261-bba6-82b16ebf678f'),
	('00000000-0000-0000-0000-000000000000', 518, 'adexyt6lfjb7', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:31:34.759854+00', '2026-08-12 06:31:35.018968+00', 'zx6fzsahtp6w', '68ab9fc1-b44e-4261-bba6-82b16ebf678f'),
	('00000000-0000-0000-0000-000000000000', 510, 'qie5d56owly4', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:30:05.22756+00', '2026-08-12 06:30:05.528354+00', '6imh7dh727de', '68ab9fc1-b44e-4261-bba6-82b16ebf678f'),
	('00000000-0000-0000-0000-000000000000', 511, 'dke6ksshzyyt', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:30:05.528783+00', '2026-08-12 06:30:05.854312+00', 'qie5d56owly4', '68ab9fc1-b44e-4261-bba6-82b16ebf678f'),
	('00000000-0000-0000-0000-000000000000', 519, 'k57izwlk47ho', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:31:35.019345+00', '2026-08-12 06:32:04.978266+00', 'adexyt6lfjb7', '68ab9fc1-b44e-4261-bba6-82b16ebf678f'),
	('00000000-0000-0000-0000-000000000000', 512, 'lyd5cpywc2te', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:30:05.855442+00', '2026-08-12 06:30:06.116551+00', 'dke6ksshzyyt', '68ab9fc1-b44e-4261-bba6-82b16ebf678f'),
	('00000000-0000-0000-0000-000000000000', 555, 'k4mx5adzo3xe', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-14 15:13:36.082386+00', '2026-08-15 01:41:30.763657+00', 'mv4i4tdyzjcx', '68ab9fc1-b44e-4261-bba6-82b16ebf678f'),
	('00000000-0000-0000-0000-000000000000', 520, 'z4kihs3uvcuz', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:32:04.993834+00', '2026-08-12 06:32:05.67954+00', 'k57izwlk47ho', '68ab9fc1-b44e-4261-bba6-82b16ebf678f'),
	('00000000-0000-0000-0000-000000000000', 521, '7n2fc4tvabgy', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 06:32:05.686064+00', '2026-08-12 08:54:54.887257+00', 'z4kihs3uvcuz', '68ab9fc1-b44e-4261-bba6-82b16ebf678f'),
	('00000000-0000-0000-0000-000000000000', 565, 't37wsyfes5o4', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-15 01:41:30.788904+00', '2026-08-15 17:30:10.40327+00', 'k4mx5adzo3xe', '68ab9fc1-b44e-4261-bba6-82b16ebf678f'),
	('00000000-0000-0000-0000-000000000000', 523, 'r7gdsjtse2hm', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-12 08:54:54.905309+00', '2026-08-13 18:11:25.968618+00', '7n2fc4tvabgy', '68ab9fc1-b44e-4261-bba6-82b16ebf678f'),
	('00000000-0000-0000-0000-000000000000', 544, 'dfe6lszfhqou', '2b1734b5-4b93-4603-ba71-1a6120ccd502', true, '2026-08-13 18:11:25.98074+00', '2026-08-14 07:29:49.086141+00', 'r7gdsjtse2hm', '68ab9fc1-b44e-4261-bba6-82b16ebf678f');


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "updated_at", "created_at", "full_name", "avatar_url", "student_id", "major", "university", "bio", "skills", "website", "username", "phone_number", "college", "course", "year_of_study", "resume_link", "date_of_birth", "interests", "motive", "profile_complete", "privacy", "state", "languages", "career_goal", "skill_level", "linkedin_url", "portfolio_url", "profile_visibility", "hide_email", "hide_phone", "status", "ban_reason", "banned_at", "banned_by", "last_active_at", "banner_url", "phone", "country", "city", "department", "github_url", "website_url", "graduation_year", "is_verified", "cashfree_vendor_id", "cashfree_vendor_status", "cashfree_kyc_completed_at", "cashfree_payout_method", "cashfree_pan_number", "gig_auto_approve") VALUES
	('0f53f9b7-a987-43da-b70d-a49dd9170f09', '2026-08-17 04:17:06.840344+00', '2026-08-17 04:17:06.840344+00', 'Neeraj', NULL, NULL, NULL, 'CHAVEE University', 'New to Chavee!', '{}', NULL, 'dreamwalk757_0f53f9', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, 'public', NULL, NULL, NULL, NULL, NULL, NULL, 'public', false, false, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, false),
	('2b1734b5-4b93-4603-ba71-1a6120ccd502', '2026-07-22 19:35:26.726+00', '2026-07-21 15:13:33.084181+00', 'Akshay Ennazhiyil ', NULL, NULL, NULL, 'CHAVEE University', 'Student ready to level up!', '{React,JavaScript}', NULL, 'akshayepni', NULL, 'KMCT Art''s and science college ', 'BSW', NULL, '', NULL, '{Mentoring}', 'Meet people', false, 'public', NULL, NULL, NULL, NULL, NULL, NULL, 'public', false, false, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, false),
	('4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-03 06:21:42.737747+00', '2026-08-03 06:21:42.737747+00', 'headspace730', '', NULL, NULL, 'CHAVEE University', '', '{}', NULL, NULL, NULL, 'iit', 'bttm', '', NULL, NULL, '{Finance,Engineering,Medical,Law}', NULL, true, 'public', 'kerala', NULL, 'test', 'Beginner', NULL, NULL, 'public', false, false, 'active', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, false, NULL, NULL, NULL, NULL, NULL, true);


--
-- Data for Name: admin_activity_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."admin_activity_logs" ("id", "admin_id", "action", "module", "target_id", "details", "created_at") VALUES
	('869457ce-adb4-4c4a-baf2-10889ff7aa9e', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'report_content_hide', 'reports', 'e518b34d-ecec-40b3-90ad-9781139f7a89', NULL, '2026-08-01 19:19:57.547825+00'),
	('37fd2566-e90f-472e-874b-4e69f14329a5', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'gig_verify', 'gigs', '716e9036-14c3-46c3-812a-2924ae1a6334', '{"reason": null}', '2026-08-02 10:49:31.212356+00'),
	('55e1e16d-661b-45d8-ae60-f925900ef492', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_verify', 'gigs', 'e1c9613c-e39b-4e09-959c-f85eb107f24c', '{"reason": null}', '2026-08-03 06:22:39.779325+00'),
	('d0214d45-d305-4e2f-9126-8d4e3f19419e', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_suspend', 'gigs', '716e9036-14c3-46c3-812a-2924ae1a6334', '{"reason": null}', '2026-08-03 06:22:47.770955+00'),
	('8e6bdf07-99cf-4b00-910d-d97e2f0a870c', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_hide', 'gigs', '716e9036-14c3-46c3-812a-2924ae1a6334', '{"reason": null}', '2026-08-03 06:22:52.578477+00'),
	('6473bd5d-2bd8-41ef-b62f-75c38cc84620', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_suspend', 'gigs', '8ea1209f-1504-4f34-b11c-a878edc8ca27', '{"reason": null}', '2026-08-03 06:45:23.784963+00'),
	('01bb14ab-f962-418d-8cf8-686f290d44bd', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_verify', 'gigs', '93a8316d-3375-47fd-9ec8-11710ed6f408', '{"reason": null}', '2026-08-03 06:45:27.858408+00'),
	('8baf1c4a-b3d7-4077-8879-2fbf7d7ebd31', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_verify', 'gigs', 'ffb934b6-b89e-4615-8dc0-aec3a14a96b1', '{"reason": null}', '2026-08-05 19:45:34.114743+00'),
	('b1e51249-8b87-44d3-a9ac-89805a60d616', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_verify', 'gigs', '72c133ce-a9fd-4267-bf2b-db8e76760260', '{"reason": null}', '2026-08-05 20:10:06.015386+00'),
	('0e6bdedd-34c9-49c8-b789-6224dc6ab1a2', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_verify', 'gigs', 'ea34dc4d-f626-4002-ac62-22673e1dc020', '{"reason": null}', '2026-08-08 08:27:01.543366+00'),
	('2c5bfe4e-737e-4fa0-9ad7-12038b036a36', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_verify', 'gigs', 'cb5e34d2-0510-490b-ac9d-46c7b5a5267e', '{"reason": null}', '2026-08-08 10:02:34.233551+00'),
	('f63144f6-7a75-446e-93f7-4bc329dbe22f', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_verify', 'gigs', 'ee611370-f2a7-4e87-9052-ef39fd7df0c5', '{"reason": null}', '2026-08-10 08:32:34.176403+00'),
	('5dabf15f-be65-4dac-8667-53474d8802fb', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'job_close', 'jobs', 'fa7e96e3-c342-458c-9d13-6500df9d585a', '{"reason": null}', '2026-08-13 13:36:19.342554+00'),
	('c1fe903b-e0b7-4485-8193-3292ce6e568a', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_verify', 'gigs', 'b7507339-82ea-477b-bd26-34b0bb81fa2b', '{"reason": null}', '2026-08-14 09:36:00.066578+00'),
	('f7afabc7-5711-4de8-b98e-e9d16ffc8d54', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_verify', 'gigs', 'd90f4382-1551-41d8-83d7-55c1aab2cd9e', '{"reason": null}', '2026-08-14 09:40:21.281305+00'),
	('d785c400-749a-4e23-8127-a3b4853afa2d', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_verify', 'gigs', '5eb8700b-1444-446d-98b4-1c870f1e2da5', '{"reason": null}', '2026-08-14 10:22:06.359785+00'),
	('654410fe-90ec-4748-bbcd-0f7b2b05dcbc', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_verify', 'gigs', '6dfe5874-9e57-442a-8d59-5ae3d027d7af', '{"reason": null}', '2026-08-14 10:22:44.753056+00'),
	('0a1d1f88-2a00-4b99-85dc-038eefc4138d', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_reject', 'gigs', '6dfe5874-9e57-442a-8d59-5ae3d027d7af', '{"reason": "test reason string"}', '2026-08-14 10:22:54.79954+00'),
	('b8cea70c-b398-43e2-a562-6eac6ad73bab', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_verify', 'gigs', '7cece6de-028f-431f-aa12-f534798ddf85', '{"reason": null}', '2026-08-14 17:16:56.971955+00'),
	('1c343950-fc75-4290-88d4-f4c81736597b', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_verify', 'gigs', '0b1208a8-7c37-468d-a046-8611441553e6', '{"reason": null}', '2026-08-14 17:18:44.55007+00'),
	('b1e71572-11c7-4a52-b6c9-b85eb76fbf14', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_verify', 'gigs', '3815c384-9605-450a-85a7-e3cbea8e785f', '{"reason": null}', '2026-08-14 17:29:27.492225+00'),
	('a36b690e-8e0d-4d56-87c9-0348bdb6acb8', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_verify', 'gigs', '65c9c774-2574-448f-b056-35413299d5ba', '{"reason": null}', '2026-08-14 17:29:58.80561+00'),
	('095e5b67-5a38-4e8a-ba83-1f5e412976fe', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_verify', 'gigs', '41fb759a-fd83-4ef5-9e43-ddef0d05db35', '{"reason": null}', '2026-08-14 17:30:32.369177+00'),
	('45f11ed3-44b7-4c6e-a48b-1be9495cf1da', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_verify', 'gigs', '3816c50e-8756-43c2-84bf-eb3e1040eac0', '{"reason": null}', '2026-08-14 17:41:07.025544+00'),
	('63e477a0-f441-4928-b945-edcd59d5f680', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_verify', 'gigs', 'aae6d0e3-7a50-483e-ae52-2902b34eea4e', '{"reason": null}', '2026-08-14 17:42:37.960545+00'),
	('ecb7aef1-312e-4708-b2d5-cf0f301d7351', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_verify', 'gigs', 'fa0a84af-5843-4688-937a-cfbb56ab4889', '{"reason": null}', '2026-08-14 17:43:17.20853+00'),
	('d1e82090-66c7-4ab6-ade8-b1a0b3a94108', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_verify', 'gigs', 'e27d9aa2-dedf-4596-b53d-d7a936fdfc2c', '{"reason": null}', '2026-08-14 17:43:55.290889+00');


--
-- Data for Name: admins; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."admins" ("user_id", "added_at", "role") VALUES
	('4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-07-13 08:11:14.407582+00', 'admin'),
	('2b1734b5-4b93-4603-ba71-1a6120ccd502', '2026-07-13 08:11:14.407582+00', 'admin');


--
-- Data for Name: badges; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: blogs_deprecated; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."conversations" ("id", "created_at", "type") VALUES
	('4acd6445-ac60-449e-ab44-ed92447ef016', '2026-07-14 21:57:48.053957+00', 'dm'),
	('009d4da7-cf5b-47f1-9acc-18a3d1957de1', '2026-07-14 21:57:48.053957+00', 'dm'),
	('1b87121f-8cbb-4ba6-93c7-be0279c658ad', '2026-07-14 21:57:48.053957+00', 'dm'),
	('77466028-3947-4fa6-9904-b0745b48605a', '2026-07-14 21:57:48.053957+00', 'dm'),
	('470771a7-4b43-4557-843b-a9596da96838', '2026-07-14 21:57:48.053957+00', 'dm'),
	('12c72e47-981e-44ef-becc-bcbe22050e14', '2026-07-14 21:57:48.053957+00', 'dm'),
	('4b9fc6a4-3932-4109-8609-f2fc5097783b', '2026-08-13 13:11:26.321553+00', 'dm');


--
-- Data for Name: communities; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."communities" ("id", "name", "description", "category", "guidelines", "is_paid", "price", "created_by", "created_at", "status", "emoji", "conversation_id", "slug", "image_url", "cover_image_url", "short_description", "welcome_message", "featured", "visibility", "logo_url", "location") VALUES
	('682a1506-9aea-4a00-835c-65c7019a8f88', 'Language Exchange', 'Korean, Japanese, and Spanish speaking practice partners.', 'Language', NULL, false, 0, NULL, '2026-07-14 10:27:02.837145+00', 'Live', '🗣️', '77466028-3947-4fa6-9904-b0745b48605a', 'language-exchange', NULL, NULL, NULL, NULL, false, 'public', NULL, NULL),
	('c266bf32-ac3b-4bb0-ae26-622aa23f3f09', 'GATE Prep 2026', 'Serious GATE aspirants checking concepts and formulas.', 'Skill', NULL, false, 0, NULL, '2026-07-14 10:27:02.837145+00', 'Coming Soon', '📐', '470771a7-4b43-4557-843b-a9596da96838', 'gate-prep-2026', NULL, NULL, NULL, NULL, false, 'public', NULL, NULL),
	('c6620e05-aa75-40af-ae95-b3a83696bc17', 'Startup Founders Club', 'Early student startup founders networking.', 'General', NULL, false, 0, NULL, '2026-07-14 10:27:02.837145+00', 'Coming Soon', '🌟', '12c72e47-981e-44ef-becc-bcbe22050e14', 'startup-founders-club', NULL, NULL, NULL, NULL, false, 'public', NULL, NULL),
	('22d4350b-c303-4b06-b5a8-55e51dee5e4e', 'Side-Hustle Students', 'Freelancers, gig workers, and early entrepreneurs.', 'General', NULL, false, 0, NULL, '2026-07-14 10:27:02.837145+00', 'Live', '🚀', '1b87121f-8cbb-4ba6-93c7-be0279c658ad', 'side-hustle-students', NULL, NULL, NULL, NULL, false, 'public', NULL, NULL),
	('6f924848-8982-4443-a039-0baf93021d29', 'Design Collective', 'UI/UX designers sharing screen redesigns and Figma feedback.', 'Skill', NULL, false, 0, NULL, '2026-07-14 10:27:02.837145+00', 'Coming Soon', '🎨', '009d4da7-cf5b-47f1-9acc-18a3d1957de1', 'design-collective', NULL, NULL, NULL, NULL, false, 'public', NULL, NULL),
	('097e5827-da10-46bf-bc6c-35b97ef28011', 'Kerala Tech Hub', 'For Kerala CS students building projects together.', 'Skill', NULL, false, 0, NULL, '2026-07-14 10:27:02.837145+00', 'Coming Soon', '💻', '4acd6445-ac60-449e-ab44-ed92447ef016', 'kerala-tech-hub', NULL, NULL, NULL, NULL, false, 'public', NULL, NULL),
	('3a8d3c46-d1ca-4fbe-9794-7a9cec736b75', 'Robotics & IoT Builders', 'A hands-on community for students who love building physical things — robotics kits, Arduino/Raspberry Pi projects, home automation, and competitive robotics. Share build logs, get wiring help, and find teammates for hackathons.', 'Technology', 'Be respectful. Share your build progress and wiring diagrams. No spam or unrelated promotions. Help others debug before asking someone to "just fix it" for you.', false, 0, '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-13 13:11:26.321553+00', 'Live', '💻', '4b9fc6a4-3932-4109-8609-f2fc5097783b', 'robotics-iot-builders', NULL, 'https://dtokistffdnycrzbmxcr.supabase.co/storage/v1/object/public/event-images/communities/1786626567443-njos7ha.png', 'Build robots, sensors and smart devices together — from Arduino basics to full IoT systems.', NULL, false, 'public', 'https://dtokistffdnycrzbmxcr.supabase.co/storage/v1/object/public/event-images/communities/1786626503461-psbfkgm.png', NULL);


--
-- Data for Name: events; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: certificates; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: education_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."education_categories" ("id", "name", "group_name", "created_at") VALUES
	('58cc4ce2-b234-487a-aa74-3c10d27b9f3c', 'Korean', 'language', '2026-08-02 08:35:55.255778+00'),
	('61931e2a-f111-42c5-978f-f4251582390d', 'Japanese', 'language', '2026-08-02 08:35:55.255778+00'),
	('0d69a905-6796-4232-8660-d811042326a6', 'German', 'language', '2026-08-02 08:35:55.255778+00'),
	('f3852435-e30c-4de5-892d-fb413f387bc2', 'French', 'language', '2026-08-02 08:35:55.255778+00'),
	('40dafd68-2190-43e2-9b5d-cb0becef4bfd', 'Spanish', 'language', '2026-08-02 08:35:55.255778+00'),
	('d8c1fc95-8daf-43c7-abd4-4b98405f3382', 'English', 'language', '2026-08-02 08:35:55.255778+00'),
	('ba116c78-8378-4b9b-8bbb-67ca0d5c6abf', 'Communication', 'skill', '2026-08-02 08:35:55.255778+00'),
	('efbcb935-8dec-4a0d-a4ce-561bf0ab644f', 'Leadership', 'skill', '2026-08-02 08:35:55.255778+00'),
	('4bc2275d-326b-40c0-919b-ef10861278b1', 'Public Speaking', 'skill', '2026-08-02 08:35:55.255778+00'),
	('628c6bc4-99c3-40d5-a8f8-97bc4856217e', 'Interview Skills', 'skill', '2026-08-02 08:35:55.255778+00'),
	('9f4bb456-4aa6-46c0-9c82-f2882e42d54a', 'Resume Building', 'skill', '2026-08-02 08:35:55.255778+00'),
	('1d7a254a-cf87-4146-88a8-1ffdc9432d60', 'AI', 'technology', '2026-08-02 08:35:55.255778+00'),
	('ea6dca1a-e619-43fa-a421-6a9d8a08d941', 'Programming', 'technology', '2026-08-02 08:35:55.255778+00'),
	('a3007e28-a65a-427b-8de9-09a9f850d1ed', 'UI/UX', 'technology', '2026-08-02 08:35:55.255778+00'),
	('2381f2a8-cbda-41b9-8b23-3935cb325ea6', 'Cyber Security', 'technology', '2026-08-02 08:35:55.255778+00'),
	('7f202501-2681-4769-bce3-53c3826d11a4', 'Cloud', 'technology', '2026-08-02 08:35:55.255778+00'),
	('4e19b3a4-0bbb-4194-b2bb-6b8f58c0ae00', 'Data Science', 'technology', '2026-08-02 08:35:55.255778+00'),
	('0e9ce80f-1ae6-4f0f-9b6b-bc976eb6f659', 'Marketing', 'business', '2026-08-02 08:35:55.255778+00'),
	('83584ad4-c7d3-4988-b24e-39c677dc2135', 'Sales', 'business', '2026-08-02 08:35:55.255778+00'),
	('d20ee9ec-3b65-4b03-8962-bc9f8dbe215b', 'Finance', 'business', '2026-08-02 08:35:55.255778+00'),
	('ee770382-5b59-4291-9e41-a8479ce5d646', 'Entrepreneurship', 'business', '2026-08-02 08:35:55.255778+00'),
	('e6ad8159-1291-40e4-8d3c-a2bf48b5de94', 'Graphic Design', 'creative', '2026-08-02 08:35:55.255778+00'),
	('5d7f8d63-858e-4b26-a16e-3f555b0c2c20', 'Video Editing', 'creative', '2026-08-02 08:35:55.255778+00'),
	('9f673d5c-1d68-4d00-8c01-e69cc92ab90f', 'Photography', 'creative', '2026-08-02 08:35:55.255778+00'),
	('2c7c8b5d-ccf6-47b0-8dee-cac6cbffb7ec', 'Content Creation', 'creative', '2026-08-02 08:35:55.255778+00'),
	('a3068a60-e515-4f39-a1cb-9e46b789fb50', 'Freelancing', 'career', '2026-08-02 08:35:55.255778+00'),
	('420dafb1-8252-490a-b751-dfcd250c0fa3', 'Career Planning', 'career', '2026-08-02 08:35:55.255778+00'),
	('810cfdb6-1f27-4637-96ec-b0d7036540fe', 'LinkedIn', 'career', '2026-08-02 08:35:55.255778+00'),
	('f6c18a31-44e4-4336-9cd2-ffdf125ea092', 'Personal Branding', 'career', '2026-08-02 08:35:55.255778+00'),
	('d5ad0390-9cef-4842-9143-abab0444590f', 'Mandarin', 'language', '2026-08-02 15:06:49.483951+00');


--
-- Data for Name: certifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."certifications" ("id", "name", "provider", "logo_url", "description", "difficulty", "duration", "category_id", "is_coming_soon", "featured", "published", "created_at", "updated_at", "status", "enrollment_url") VALUES
	('55400376-c082-474a-a5c3-1a7aa7f5f6ea', 'Meta Front-End Developer Professional Certificate', 'Meta', 'https://upload.wikimedia.org/wikipedia/commons/7/7b/Meta_Platforms_Inc._logo.svg', 'Master React, JavaScript, and UI design to build responsive web applications.', 'Intermediate', '7 months', NULL, false, false, true, '2026-08-02 09:05:00.736915+00', '2026-08-02 09:05:00.736915+00', 'Draft', 'https://www.coursera.org/professional-certificates/meta-front-end-developer'),
	('3de7fac0-4c60-4f13-95c8-84ca27b5caf3', 'HubSpot Inbound Marketing Certification', 'HubSpot', 'https://upload.wikimedia.org/wikipedia/commons/c/c5/HubSpot_Logo.png', 'Discover modern marketing techniques to attract and engage customers effectively.', 'Beginner', '1 month', NULL, false, false, true, '2026-08-02 09:05:00.736915+00', '2026-08-02 09:05:00.736915+00', 'Draft', 'https://academy.hubspot.com/courses/inbound-marketing'),
	('b27add7c-68e5-41fb-abd0-5eee08f4cbb8', 'Adobe Certified Professional: Visual Design', 'Adobe', 'https://upload.wikimedia.org/wikipedia/commons/c/c2/Adobe_Corporate_Logo.png', 'Prove your expertise in Photoshop and Illustrator for professional visual design.', 'Intermediate', '4 months', NULL, false, false, true, '2026-08-02 09:05:00.736915+00', '2026-08-02 09:05:00.736915+00', 'Draft', 'https://www.adobe.com/max/certified-professional.html'),
	('b0843c0f-9cab-4169-8ec4-a4e95083c89b', 'IBM Data Science Professional Certificate', 'IBM', 'https://upload.wikimedia.org/wikipedia/commons/5/51/IBM_logo.svg', 'Develop skills in Python, SQL, and machine learning to jumpstart a data career.', 'Beginner', '11 months', NULL, false, false, true, '2026-08-02 09:05:00.736915+00', '2026-08-02 09:05:00.736915+00', 'Draft', 'https://www.coursera.org/professional-certificates/ibm-data-science'),
	('e3a3acdc-b6c1-4eca-9d77-275670579b09', 'AWS Certified Cloud Practitioner', 'AWS', 'https://upload.wikimedia.org/wikipedia/commons/9/93/Amazon_Web_Services_Logo.svg', 'Gain a foundational understanding of AWS Cloud concepts, services, and security.', 'Beginner', '3 months', NULL, false, true, true, '2026-08-02 09:05:00.736915+00', '2026-08-02 09:05:00.736915+00', 'Draft', 'https://aws.amazon.com/certification/certified-cloud-practitioner/'),
	('b4fad893-ba1e-453f-9fe3-640b3e1e0fca', 'Oracle Certified Associate, Java SE 8 Programmer', 'Oracle', 'https://upload.wikimedia.org/wikipedia/commons/5/50/Oracle_logo.svg', 'Validate your foundational knowledge of Java programming and object-oriented concepts.', 'Intermediate', '6 months', NULL, false, false, true, '2026-08-02 09:05:00.736915+00', '2026-08-02 09:05:00.736915+00', 'Draft', 'https://education.oracle.com/oracle-certified-associate-java-se-8-programmer/trackp_333'),
	('9ef0d280-2e4c-4c08-a7de-47518e0854b5', 'Google Data Analytics Professional Certificate', 'Google', 'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg', 'Learn data analysis tools like SQL, R, and Tableau to make data-driven decisions.', 'Beginner', '6 months', NULL, false, false, true, '2026-08-02 09:05:00.736915+00', '2026-08-02 09:05:00.736915+00', 'Draft', 'https://www.coursera.org/professional-certificates/google-data-analytics'),
	('86a38bda-aec4-44e5-932b-7121f3a9a5f4', 'Cisco Certified Network Associate (CCNA)', 'Cisco', 'https://upload.wikimedia.org/wikipedia/commons/6/64/Cisco_logo.svg', 'Master networking fundamentals, IP connectivity, and security basics.', 'Intermediate', '8 months', NULL, false, false, true, '2026-08-02 09:05:00.736915+00', '2026-08-02 09:05:00.736915+00', 'Draft', 'https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccna/index.html'),
	('2ed69e6f-6efb-4f45-a6fb-55269f27ea4b', 'MongoDB Certified Developer Associate', 'MongoDB', 'https://upload.wikimedia.org/wikipedia/en/4/45/MongoDB-Logo.svg', 'Demonstrate your ability to build and deploy applications using MongoDB.', 'Intermediate', '3 months', NULL, false, false, true, '2026-08-02 09:05:00.736915+00', '2026-08-02 09:05:00.736915+00', 'Draft', 'https://www.mongodb.com/certification/associate'),
	('a61f46b3-815f-4d81-aa05-15edb076f42e', 'Microsoft Certified: Azure Fundamentals', 'Microsoft', 'https://upload.wikimedia.org/wikipedia/commons/9/96/Microsoft_logo_%282012%29.svg', 'Learn cloud computing basics, models, and core services within Microsoft Azure.', 'Beginner', '2 months', NULL, false, false, true, '2026-08-02 09:05:00.736915+00', '2026-08-02 09:05:00.736915+00', 'Draft', 'https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/');


--
-- Data for Name: community_bans; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: community_channels; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: community_join_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: community_members; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: community_resources; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."companies" ("id", "name", "logo_url", "website", "location", "description", "is_official", "created_at", "created_by") VALUES
	('a90d3940-d4b2-44c9-83af-4439a72cbe51', 'Chavee', '/logo.png', NULL, NULL, NULL, true, '2026-08-17 09:37:22.646421+00', NULL);


--
-- Data for Name: connected_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: connection_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: connections; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."connections" ("user_one", "user_two", "connected_at") VALUES
	('2b1734b5-4b93-4603-ba71-1a6120ccd502', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-09 09:06:34.795756+00');


--
-- Data for Name: contact_submissions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: content; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."content" ("id", "content_type", "title", "slug", "summary", "body", "category", "author", "image_url", "published", "featured", "status", "scheduled_at", "seo_title", "seo_description", "seo_keywords", "metadata", "created_by", "created_at", "updated_at", "views") VALUES
	('6cc9b1d0-b1f1-4ab5-b4fa-d51badee63d8', 'faq', 'What is Chavee?', 'faq-what-is-chavee', '', 'Chavee is India''s first student-focused social platform. Learn languages, connect with peers, discover gigs and job opportunities, join communities, attend events, and grow your profile — all in one place, built for college students.', 'General', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{"popular": true}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('50d63d52-9b8b-4d4b-aaee-fd99ff767f38', 'faq', 'Who can join Chavee?', 'faq-who-can-join', '', 'Chavee is open to college and university students across India. You sign up with your details during onboarding, and your profile becomes part of the Chavee student community.', 'General', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{"popular": true}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('b95379c1-97e4-4644-9d59-597c110fb63b', 'faq', 'Is Chavee free to use?', 'faq-is-free', '', 'Yes. Core features — profile, communities, messaging, gig applications, and event registration — are free for students. Any future premium features will be clearly labeled with transparent pricing.', 'General', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{"popular": true}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('fcd3668c-1b38-4bc7-8dc7-a9169e74448c', 'faq', 'Does Chavee have a mobile app?', 'faq-mobile-app', '', 'Chavee works as a fully responsive site at chavee.in and can be installed to your phone''s home screen as a Progressive Web App for an app-like experience. A dedicated native app is not available yet.', 'General', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('ffcc62cd-3425-452f-abee-49df23dff791', 'faq', 'How do I create a Chavee account?', 'faq-create-account', '', 'Click "Join Free" on the homepage, enter your details, and complete your profile. It takes a couple of minutes and there''s no cost.', 'Account', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{"popular": true}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('430de392-d6a9-4c24-80c0-91c909d01558', 'faq', 'I forgot my password. How do I reset it?', 'faq-reset-password', '', 'Use "Forgot Password" on the login page. You''ll get a reset link by email — follow it to set a new password and log back in.', 'Account', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('e0877b39-f6af-4b73-aabe-ecf0dcf84600', 'faq', 'How do I edit my profile?', 'faq-edit-profile', '', 'Go to your Profile and select Edit Profile, or open Settings from the profile menu to update your account, preferences, and notification options.', 'Account', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('a01af7d0-cd49-4a92-b6dd-1863252c2937', 'faq', 'How do I delete my account?', 'faq-delete-account', '', 'Go to Profile > Settings > Danger Zone and submit a deletion request. You''ll be signed out once the request is submitted; our team processes account removal from there.', 'Account', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('a5cb0475-3584-4364-874d-486078e2d6a5', 'faq', 'How do I apply for a job on Chavee?', 'faq-apply-job', '', 'Browse open roles under the Earn tab and submit your application directly from the listing — no need to leave the platform.', 'Jobs & Careers', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{"popular": true}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('c8a44e5e-df03-4b10-b493-38682e69ff8a', 'faq', 'Can I see job openings at Chavee itself?', 'faq-chavee-jobs', '', 'Yes — visit our Careers page for current internal openings on the Chavee team, with an in-page application form for each role.', 'Jobs & Careers', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('4feb69d2-3809-419e-82e8-11c1da842335', 'faq', 'What''s the difference between a "gig" and a "job" on Chavee?', 'faq-gig-vs-job', '', 'A job is a traditional listing you apply to directly. A gig is short-term freelance work run through Chavee''s own marketplace — with offers, an escrow-based payment flow, delivery, and approval built in.', 'Jobs & Careers', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('8ba416cd-0176-499f-a27e-1e6c3aafc539', 'faq', 'What are Chavee gigs?', 'faq-what-are-gigs', '', 'Gigs are freelance tasks students post or apply to on the Earn tab — design, writing, tutoring, development, and more — with the whole workflow (offer, payment, delivery, approval) handled inside Chavee.', 'Gigs', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{"popular": true}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('b7868474-6f7c-49dd-a38d-0f64a43103c1', 'faq', 'How does payment protection work on gigs?', 'faq-payment-protection', '', 'When a buyer accepts an offer, payment is collected upfront and held until the work is delivered. The seller submits their delivery, and once the buyer approves it, funds are released to the seller. Funds are never released before the buyer confirms the work.', 'Gigs', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{"popular": true}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('6d18545a-85a4-4a33-9646-32017da22721', 'faq', 'What happens if a buyer and seller disagree on a gig?', 'faq-gig-dispute', '', 'Either side can raise a dispute on the contract. Our team reviews the delivery, messages, and terms of the offer, and makes a resolution — this keeps disagreements from being settled outside the platform.', 'Gigs', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('b5e217b0-572b-4b3e-a467-3d5d6b0dfc93', 'faq', 'How do I withdraw my gig earnings?', 'faq-withdraw-earnings', '', 'Go to Earnings and submit a withdrawal request. Our team reviews and processes withdrawal requests from there.', 'Gigs', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('ebaa67c1-08a1-4bbf-a14c-b5b58c506704', 'faq', 'Can I message a buyer or seller before accepting an offer?', 'faq-gig-messaging', '', 'Yes. Every gig application opens a dedicated Gig Room where buyer and seller can discuss scope, negotiate offers, and message directly before any payment happens.', 'Gigs', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('5f5accdf-6ac4-4567-b37b-aea21160937a', 'faq', 'How do I join a community?', 'faq-join-community', '', 'Open the Network tab, browse live communities, and tap Join. You''ll get access to that community''s discussion channels right away.', 'Communities', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{"popular": true}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('19d2939c-8980-46e5-bae8-293e94efe578', 'faq', 'Can I create my own community?', 'faq-create-community', '', 'Communities on Chavee are currently created and curated by our team to keep them active and well-moderated. You''re welcome to join any live community from the Network tab.', 'Communities', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('c347fa74-1362-4e5b-8394-618adfb96d98', 'faq', 'What are community channels?', 'faq-community-channels', '', 'Channels are focused discussion spaces inside a community — for example a general chat and topic-specific channels — so conversations stay organized instead of one long feed.', 'Communities', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('b0152b4a-0d84-4eaf-a3d7-29cd731cf569', 'faq', 'How do I register for an event?', 'faq-register-event', '', 'Open the Events tab, pick an event, and tap Register. You''ll see your registration status (confirmed or waitlisted) right on the event page.', 'Events & Learning', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{"popular": true}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('cf6c5c15-0607-454e-96f2-5c3e20c73ede', 'faq', 'Are Chavee events free?', 'faq-events-free', '', 'It depends on the event — pricing (free or paid) is shown on each event''s own page before you register.', 'Events & Learning', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('243d9e40-3d18-4153-8504-22674522c41f', 'faq', 'What courses are available on Chavee?', 'faq-courses', '', 'Check the Education tab for our current course catalog — skills and language courses curated for students. Available courses change over time as new ones are added.', 'Events & Learning', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('57f44d61-5741-4003-8f79-f4fc7c303279', 'faq', 'Do I get a certificate after completing a course?', 'faq-certificates', '', 'Select courses offer a certificate on completion — check the individual course page to see if one is included.', 'Events & Learning', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('bc748659-fc0d-4dff-9368-15f0328f500a', 'faq', 'How do I report a user or listing?', 'faq-report-user', '', 'Use the report option available on the profile, post, or listing itself, or reach out through Help & Support. Reports go to our moderation team for review.', 'Safety & Privacy', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{"popular": true}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('bc330d0e-6a4d-4463-b8ca-4c5617c7b82f', 'faq', 'Who can see my profile information?', 'faq-profile-privacy', '', 'You control this from Settings > Privacy. You can manage what''s visible to other students and adjust it any time.', 'Safety & Privacy', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('472e4ed0-6e6d-41fb-9e01-ca57f9122396', 'faq', 'Does Chavee ever ask for my password or OTP?', 'faq-never-ask-password', '', 'No. Chavee staff will never ask for your password, OTP, or bank PIN through chat, email, or any support channel. Never share these with anyone, even if they claim to be from Chavee.', 'Safety & Privacy', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{"popular": true}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('9ff264bd-0792-4bf4-9538-ac6c3087e70c', 'faq', 'How do I block another user?', 'faq-block-user', '', 'Open their profile and use the block option. Once blocked, they can''t message you or see your activity.', 'Safety & Privacy', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('6f412d96-0d8c-4f69-8fe4-658105c51580', 'faq', 'How do I submit a support ticket?', 'faq-support-ticket', '', 'Go to Help & Support and submit your issue with a short description. Our team follows up from there.', 'Safety & Privacy', 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('7f5ce1c9-8c00-4408-96c2-171e49cd067d', 'guideline_section', 'Be Respectful', 'guideline-be-respectful', 'Treat everyone with kindness and respect. No harassment, bullying, hate speech, or discrimination based on race, gender, religion, caste, nationality, disability, sexual orientation, or identity.', 'Chavee is a shared space for students from every background. Treat every member with courtesy, even in disagreement. Harassment, bullying, hate speech, or discrimination of any kind — based on race, gender, religion, caste, nationality, disability, sexual orientation, or identity — is never acceptable and will be acted on.', NULL, 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{"icon": "respect", "order": 1}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('871473b5-9506-4b0b-9519-54a4bab842a2', 'guideline_section', 'Keep It Relevant', 'guideline-keep-relevant', 'Share content that''s helpful, insightful, and relevant to students. Avoid off-topic, low-effort, or repetitive posts.', 'Communities and channels work best when conversations stay useful. Share content that genuinely helps other students — questions, resources, opportunities, discussion. Off-topic spam, low-effort posts, and repetitive content make it harder for everyone to find what matters.', NULL, 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{"icon": "relevant", "order": 2}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('ab708b57-167d-481b-886d-389cfb106d30', 'guideline_section', 'No Harassment or Bullying', 'guideline-no-harassment', 'We do not tolerate harassment, bullying, threats, or any behavior that makes others feel unsafe.', 'Any form of targeted harassment, bullying, intimidation, or threatening behavior toward another student is a serious violation. This includes repeated unwanted contact, pile-ons in comments, and behavior intended to make someone feel unsafe or unwelcome. Reported cases are reviewed and acted on.', NULL, 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{"icon": "harassment", "order": 3}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('13ef9b91-d8e2-4a49-bedb-f0a609ed5e70', 'guideline_section', 'No Spam or Misleading Content', 'guideline-no-spam', 'Do not post spam, fake information, clickbait, scams, or misleading promotions. Keep the platform authentic.', 'Chavee is built on real students helping real students. Spam, fake listings, clickbait, scams, and misleading promotions erode that trust and are removed on sight. Repeated violations lead to account restrictions.', NULL, 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{"icon": "spam", "order": 4}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('92ea406a-1cf4-4d91-9a06-453f212e662e', 'guideline_section', 'Protect Personal Information', 'guideline-protect-info', 'Do not share personal information — yours or others'' — including phone numbers, addresses, and financial details.', 'Avoid posting sensitive personal information publicly — phone numbers, home addresses, ID numbers, or financial details, whether your own or someone else''s. Keep sensitive exchanges (like arranging a gig) inside Chavee''s messaging where they''re part of the record.', NULL, 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{"icon": "privacy", "order": 5}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('0d893a1d-d058-46b4-b03e-91270837ce77', 'guideline_section', 'Keep Transactions Safe', 'guideline-transactions-safe', 'When using jobs or gigs, communicate within Chavee and follow safe practices. Avoid suspicious links or off-platform payments.', 'Keep gig discussions, offers, and payments inside Chavee — this is what keeps our escrow-based payment protection in effect. Never send payment or accept an offer to move a deal off-platform; if someone asks you to, treat it as a red flag and report it.', NULL, 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{"icon": "transactions", "order": 6}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('d24f9967-d8ff-42b0-814d-de12c281a513', 'guideline_section', 'Respect Intellectual Property', 'guideline-respect-ip', 'Do not post or share content that you do not own or have permission to use. Always give credit where it''s due.', 'Only share content you created or have permission to use — for posts, gig deliveries, course material, or anything else. Give credit where it''s due, and don''t submit someone else''s work as your own.', NULL, 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{"icon": "ip", "order": 7}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('8e6894c7-7732-405d-929f-cfa3690118ce', 'guideline_section', 'Report Problems', 'guideline-report-problems', 'If you see something that violates these guidelines, report it. Your reports help us keep the community safe.', 'If you see content or behavior that breaks these guidelines, report it using the report option on the profile, post, or listing, or through Help & Support. Every report is reviewed — you''re helping keep Chavee safe for everyone by speaking up.', NULL, 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{"icon": "report", "order": 8}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0),
	('2c991e89-9e31-4c5a-8524-0c9413b91cce', 'guideline_section', 'What Happens When Rules Are Broken', 'guideline-consequences', 'We may remove content, restrict accounts, or permanently suspend access for violations of these guidelines.', 'Depending on severity and history, violations can lead to content removal, temporary restrictions, or permanent suspension. We aim to be fair and proportionate, but student safety and platform trust come first.', NULL, 'Chavee Team', NULL, true, false, 'published', NULL, NULL, NULL, NULL, '{"icon": "consequences", "order": 9}', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-17 08:17:39.54577+00', '2026-08-17 08:17:39.54577+00', 0);


--
-- Data for Name: conversation_participants; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."conversation_participants" ("conversation_id", "user_id", "hidden_at") VALUES
	('4acd6445-ac60-449e-ab44-ed92447ef016', '2b1734b5-4b93-4603-ba71-1a6120ccd502', NULL),
	('77466028-3947-4fa6-9904-b0745b48605a', '2b1734b5-4b93-4603-ba71-1a6120ccd502', NULL),
	('1b87121f-8cbb-4ba6-93c7-be0279c658ad', '2b1734b5-4b93-4603-ba71-1a6120ccd502', NULL),
	('77466028-3947-4fa6-9904-b0745b48605a', '4cc6de1f-4783-4946-aba7-91e4782d3818', NULL),
	('1b87121f-8cbb-4ba6-93c7-be0279c658ad', '4cc6de1f-4783-4946-aba7-91e4782d3818', NULL),
	('4b9fc6a4-3932-4109-8609-f2fc5097783b', '4cc6de1f-4783-4946-aba7-91e4782d3818', NULL);


--
-- Data for Name: courses; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."courses" ("id", "title", "type", "level", "instructor_name", "schedule", "price", "status", "created_at", "category_id", "banner_url", "is_coming_soon", "is_featured", "short_description", "estimated_launch_date", "tags", "duration", "language") VALUES
	('8559e783-47ec-4c27-b8e1-e3af3539917a', 'Korean K1 — Complete Beginner', 'language', 'Beginner', 'Park Ji-yeon', NULL, 0, 'coming_soon', '2026-07-14 10:27:27.644175+00', '58cc4ce2-b234-487a-aa74-3c10d27b9f3c', NULL, true, false, NULL, NULL, '{}', NULL, NULL),
	('2a2ce86e-cd4d-4c6d-8c46-479a80c624b3', 'Japanese N5 Crash Course', 'language', 'Beginner', 'Tanaka Hiroshi', NULL, 0, 'coming_soon', '2026-07-14 10:27:27.644175+00', '61931e2a-f111-42c5-978f-f4251582390d', NULL, true, false, NULL, NULL, '{}', NULL, NULL),
	('5e91439e-bca2-4173-a44f-ae6c950a210a', 'Spanish A1 — For Beginners', 'language', 'Beginner', 'Maria Garcia', NULL, 0, 'coming_soon', '2026-07-14 10:27:27.644175+00', '40dafd68-2190-43e2-9b5d-cb0becef4bfd', NULL, true, false, NULL, NULL, '{}', NULL, NULL),
	('5aac9f24-e60d-4632-8305-041dcf91a600', 'French DELF B1 Prep', 'language', 'Intermediate', 'Jean Dupont', NULL, 0, 'coming_soon', '2026-07-14 10:27:27.644175+00', 'f3852435-e30c-4de5-892d-fb413f387bc2', NULL, true, false, NULL, NULL, '{}', NULL, NULL),
	('d9f51a12-a1e4-4480-8f77-cccd9398ec55', 'German A1 — Start Speaking', 'language', 'Beginner', 'Klaus Mueller', NULL, 0, 'coming_soon', '2026-07-14 10:27:27.644175+00', '0d69a905-6796-4232-8660-d811042326a6', NULL, true, false, NULL, NULL, '{}', NULL, NULL),
	('244f6895-162e-4255-94f3-4052a4fb8748', 'Mandarin HSK 1 Foundation', 'language', 'Beginner', 'Li Wei', NULL, 0, 'coming_soon', '2026-07-14 10:27:27.644175+00', 'd5ad0390-9cef-4842-9143-abab0444590f', NULL, true, false, NULL, NULL, '{}', NULL, NULL);


--
-- Data for Name: courses_v2; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: deleted_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: gig_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."gig_categories" ("id", "name", "slug", "created_at") VALUES
	('fe050d95-378c-4cd1-9b3c-afdda8624500', 'Graphic Design', 'graphic-design', '2026-08-14 10:16:48.675521+00'),
	('b7e89f8a-e02b-4cc4-bc45-f602dd29cc82', 'Development', 'development', '2026-08-14 10:16:48.675521+00'),
	('3aca9799-3a09-45bf-a979-6b8a8996f17d', 'Writing', 'writing', '2026-08-14 10:16:48.675521+00'),
	('ded5ea4d-28cb-4403-a7a6-0ad86e7b2484', 'Marketing', 'marketing', '2026-08-14 10:16:48.675521+00'),
	('1e3abd14-3402-40af-8cbd-9ac03c9e623f', 'Video Editing', 'video-editing', '2026-08-14 10:16:48.675521+00'),
	('7140e2e5-150e-49ae-8606-d991807b0f01', 'Photography', 'photography', '2026-08-14 10:16:48.675521+00'),
	('4b65c469-57f4-4f0a-ac62-78c68c4c1f83', 'Voice Over', 'voice-over', '2026-08-14 10:16:48.675521+00'),
	('a85224d7-776b-4ffb-b095-6dfbb436b2bb', 'Translation', 'translation', '2026-08-14 10:16:48.675521+00'),
	('002b6f5e-5440-4b03-b0ae-f019dff2d9d1', 'AI', 'ai', '2026-08-14 10:16:48.675521+00'),
	('e84bb122-34b7-4c41-93b8-d735e92339e2', 'Tutoring', 'tutoring', '2026-08-14 10:16:48.675521+00'),
	('1a79036d-955d-41ac-9215-8219d0675b0f', 'Business', 'business', '2026-08-14 10:16:48.675521+00'),
	('fbfaac89-4ec0-4080-a239-131786f0be07', 'Other', 'other', '2026-08-14 10:16:48.675521+00');


--
-- Data for Name: gigs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: gig_applications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: gig_offers; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: withdrawals; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: gig_contracts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: disputes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_agenda; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_faqs; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_registrations; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: event_speakers; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: feature_flags; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."feature_flags" ("key", "enabled", "coming_soon_text", "updated_at", "updated_by") VALUES
	('study_sync', false, 'Peer mentorship matching is launching soon!', '2026-08-01 17:14:46.970855+00', NULL),
	('marketplace', false, 'Coming soon!', '2026-08-01 17:14:46.970855+00', NULL);


--
-- Data for Name: follows_deprecated; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."follows_deprecated" ("follower_id", "following_id", "created_at") VALUES
	('4cc6de1f-4783-4946-aba7-91e4782d3818', '2b1734b5-4b93-4603-ba71-1a6120ccd502', '2026-07-22 19:24:12.747988+00');


--
-- Data for Name: gig_delivery_files; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: gig_offer_items; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: gig_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: gig_tag_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: job_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."job_categories" ("id", "name", "slug", "created_at") VALUES
	('8cb55a75-2173-4d59-b713-02b3ab15a3bb', 'Design', 'design', '2026-08-17 20:45:23.509697+00'),
	('71d4e69b-2ce7-4e79-8f71-5d8d36ec927a', 'Engineering', 'engineering', '2026-08-17 20:45:23.509697+00'),
	('16080229-0e0a-49fd-a6d0-6c18561fc800', 'Marketing', 'marketing', '2026-08-17 20:45:23.509697+00'),
	('ea23b321-3410-48cb-807a-3069cedfa7c1', 'Content & Writing', 'content-writing', '2026-08-17 20:45:23.509697+00'),
	('0508b5ec-bef2-426c-b3c1-27e8c2798546', 'Operations', 'operations', '2026-08-17 20:45:23.509697+00'),
	('02b0f73d-72e0-41ce-9f41-cdd3568dda0c', 'Business & Sales', 'business-sales', '2026-08-17 20:45:23.509697+00'),
	('f88f14c6-d432-4c26-b80b-8a54cb21e4ec', 'Internship', 'internship', '2026-08-17 20:45:23.509697+00');


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."jobs" ("id", "title", "company", "job_type", "description", "apply_url", "status", "created_at", "location", "compensation", "duration", "skills", "logo", "application_type", "application_questions", "salary_min", "salary_max", "category_id", "featured", "views", "admin_hidden", "deadline", "company_id") VALUES
	('fa7e96e3-c342-458c-9d13-6500df9d585a', 'Chavee', 'Chavee', 'Full-Time', 'Chavee', NULL, 'closed', '2026-08-10 08:30:16.718228+00', 'Chavee', 'Chavee', 'Chavee', 'Chavee', '🏢', 'internal', NULL, 1000, 10000, NULL, false, 0, false, NULL, 'a90d3940-d4b2-44c9-83af-4439a72cbe51');


--
-- Data for Name: job_applications; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: job_tags; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: job_tag_assignments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."messages" ("id", "conversation_id", "sender_id", "content", "file_url", "file_type", "created_at", "read_at", "is_read") VALUES
	('339d750a-58de-407c-99f4-00e09ff9c4df', '1b87121f-8cbb-4ba6-93c7-be0279c658ad', '4cc6de1f-4783-4946-aba7-91e4782d3818', '__RPC_LOCKED_TEST_should_be_rejected__', NULL, NULL, '2026-08-16 07:14:01.103545+00', '2026-08-17 04:38:26.933+00', true),
	('41c4143c-8f43-483e-bae7-891852bdc7fc', '77466028-3947-4fa6-9904-b0745b48605a', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'Hi', NULL, NULL, '2026-07-28 14:51:53.582896+00', '2026-08-17 06:53:09.7+00', true),
	('dd238e5d-61fd-462a-b1c6-27f51696e195', '77466028-3947-4fa6-9904-b0745b48605a', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'msg set aayo', NULL, NULL, '2026-08-17 04:38:25.760601+00', '2026-08-17 06:53:09.7+00', true),
	('8878e477-52f5-4873-ad4c-fee90b24404b', '77466028-3947-4fa6-9904-b0745b48605a', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'athokke set an no worries', NULL, NULL, '2026-08-17 06:53:15.877086+00', NULL, false),
	('29e59a3b-67bc-4086-82c5-f3936b7c7228', '4acd6445-ac60-449e-ab44-ed92447ef016', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'Daa', NULL, NULL, '2026-07-28 14:49:26.603451+00', '2026-08-03 17:27:56.668+00', true),
	('3b01ff17-1bfc-4df6-aaaa-67a35d7b6145', '4acd6445-ac60-449e-ab44-ed92447ef016', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'hi', NULL, NULL, '2026-07-31 18:08:34.7775+00', '2026-08-03 17:27:56.668+00', true),
	('502f614a-50e9-4ae8-a0ca-266a37f63d14', '4acd6445-ac60-449e-ab44-ed92447ef016', '2b1734b5-4b93-4603-ba71-1a6120ccd502', '📢 Check out this post on Chavee: "Post Attachment" 

Link: https://chavee.in/dashboard?postId=7148d3cc-be96-496b-9853-a923bb39a4a2', NULL, NULL, '2026-07-28 14:49:01.614592+00', '2026-08-03 17:27:56.668+00', true),
	('5653f97c-b3a9-4746-8761-09b5d82e32cb', '4acd6445-ac60-449e-ab44-ed92447ef016', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'Hi', NULL, NULL, '2026-07-28 14:51:05.058579+00', '2026-08-03 17:27:56.668+00', true),
	('6a010f5b-197e-4384-9edd-917d04bd5fac', '4acd6445-ac60-449e-ab44-ed92447ef016', '2b1734b5-4b93-4603-ba71-1a6120ccd502', '📢 Check out this post on Chavee: "Post Attachment" 

Link: https://chavee.in/dashboard?postId=7148d3cc-be96-496b-9853-a923bb39a4a2', NULL, NULL, '2026-07-31 18:07:48.404904+00', '2026-08-03 17:27:56.668+00', true),
	('70a141b0-3bcf-4b70-9c2b-11ead9726f11', '4acd6445-ac60-449e-ab44-ed92447ef016', '2b1734b5-4b93-4603-ba71-1a6120ccd502', '📢 Check out this post on Chavee: "Post Attachment" 

Link: https://chavee.in/dashboard?postId=7148d3cc-be96-496b-9853-a923bb39a4a2', NULL, NULL, '2026-07-31 18:07:31.894768+00', '2026-08-03 17:27:56.668+00', true),
	('a318e0de-514f-4844-b088-8982ea6058a2', '4acd6445-ac60-449e-ab44-ed92447ef016', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'Hi', NULL, NULL, '2026-07-15 08:26:06.343019+00', '2026-08-03 17:27:56.668+00', true),
	('c2898696-5c06-440b-bc0e-61a6fe2ccd5c', '4acd6445-ac60-449e-ab44-ed92447ef016', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'hi', NULL, NULL, '2026-07-28 08:51:07.91771+00', '2026-08-03 17:27:56.668+00', true),
	('a4cafa08-1ad9-48c4-a9bb-11af3a1369e3', '4acd6445-ac60-449e-ab44-ed92447ef016', '2b1734b5-4b93-4603-ba71-1a6120ccd502', '📢 Check out this post on Chavee: "hi" 

Link: https://chavee.in/dashboard?postId=d6005f32-c9f1-424f-94a7-fe83dc67a592', NULL, NULL, '2026-07-30 15:46:47.534938+00', '2026-08-03 17:27:56.668+00', true),
	('aaf8d7b7-4225-47eb-9d10-8b7e550224fa', '4acd6445-ac60-449e-ab44-ed92447ef016', '2b1734b5-4b93-4603-ba71-1a6120ccd502', '📢 Check out this post on Chavee: "hi" 

Link: https://chavee.in/dashboard?postId=d6005f32-c9f1-424f-94a7-fe83dc67a592', NULL, NULL, '2026-07-30 15:46:46.430402+00', '2026-08-03 17:27:56.668+00', true),
	('c3d34b1a-73a2-49c7-ba1b-bcbbe25bedb1', '4acd6445-ac60-449e-ab44-ed92447ef016', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'hi', NULL, NULL, '2026-07-27 21:32:46.514253+00', '2026-08-03 17:27:56.668+00', true),
	('d5d6b622-6b88-473d-8f40-77361fac84be', '4acd6445-ac60-449e-ab44-ed92447ef016', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'Hiii', NULL, NULL, '2026-07-30 15:40:16.038963+00', '2026-08-03 17:27:56.668+00', true),
	('f8596945-93ce-4f59-b22f-1fe90d2c8c95', '4acd6445-ac60-449e-ab44-ed92447ef016', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'Hi', NULL, NULL, '2026-08-01 19:15:56.579856+00', '2026-08-03 17:27:56.668+00', true),
	('e13eab2f-32b3-44f9-9a65-e6ea228c4144', '77466028-3947-4fa6-9904-b0745b48605a', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'send_message RPC re-verify — real channel message, real UI send.', NULL, NULL, '2026-08-16 07:20:42.773404+00', '2026-08-17 04:38:16.978+00', true),
	('1fc5302c-d4e9-48ba-a789-0e609d417641', '1b87121f-8cbb-4ba6-93c7-be0279c658ad', '4cc6de1f-4783-4946-aba7-91e4782d3818', '__EXPLOIT_TEST_should_be_rejected__', NULL, NULL, '2026-08-16 07:13:46.794829+00', '2026-08-17 04:38:26.933+00', true),
	('f6867e6d-cd4b-4c7f-8221-e3e3bbba4ef3', '1b87121f-8cbb-4ba6-93c7-be0279c658ad', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'test', NULL, NULL, '2026-08-17 04:38:35.794469+00', NULL, false),
	('4ca6951f-4ce8-40fe-965f-4418527da602', '77466028-3947-4fa6-9904-b0745b48605a', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'arulla ini Seo works, LAnding pagesil pagekal create akan nd  setup akki idkanam all for seo', NULL, NULL, '2026-08-17 06:53:46.915675+00', NULL, false);


--
-- Data for Name: notification_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."notification_preferences" ("user_id", "email_notifications", "push_notifications", "community_activity", "job_notifs", "event_reminders", "gig_updates", "messages", "updated_at", "platform_notifications", "course_updates", "scholarship_alerts", "mentions", "comments", "likes", "connection_requests", "weekly_digest", "monthly_digest", "marketing_emails") VALUES
	('2b1734b5-4b93-4603-ba71-1a6120ccd502', true, true, true, true, true, true, true, '2026-08-02 10:00:51.572299+00', true, true, true, true, true, true, true, false, false, false),
	('4cc6de1f-4783-4946-aba7-91e4782d3818', true, true, true, true, true, true, true, '2026-08-03 06:21:42.737747+00', true, true, true, true, true, true, true, true, false, false),
	('0f53f9b7-a987-43da-b70d-a49dd9170f09', true, true, true, true, true, true, true, '2026-08-17 04:17:06.840344+00', true, true, true, true, true, true, true, false, false, false);


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."notifications" ("id", "user_id", "type", "title", "body", "link", "is_read", "created_at") VALUES
	('77642169-84fb-4b92-9fe3-338eb9bcd7ac', NULL, 'gig_approved', 'Your gig was approved', 'Your listing "React Developer for Dashboard" is now live on Chavee.', '/earn/gigs/d0ea1960-57ef-4778-9394-8e873b630b41', false, '2026-07-15 10:08:11.064261+00'),
	('4e32d350-3937-4b7a-b672-c8692c8c3868', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'event', 'Registration confirmed', 'You''re registered for Arduino & Sensors Bootcamp.', '/events/e143499f-27f3-4e15-8d27-f8e13e4ba8c1', false, '2026-08-16 15:42:51.728253+00'),
	('42f85038-7f01-456d-9087-e8510ee721e9', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'message', 'New message', 'Akshay Ennazhiyil  sent you a message.', '/messages/77466028-3947-4fa6-9904-b0745b48605a', false, '2026-08-17 04:38:25.760601+00'),
	('55ca26e6-57b6-415e-b484-374e8910026f', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'gig_approved', '💼 Gig Listing Approved!', 'Your gig "designer" has been reviewed and approved. It is now visible on the marketplace.', '/earn', true, '2026-07-15 10:08:10.978385+00'),
	('3ee69cf5-a9fb-463f-9751-7599b61634bf', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'gig_approved', 'Your gig was approved', 'Your listing "designer" is now live on Chavee.', '/earn/gigs/9202971b-577c-4351-bf20-148e720c82e7', true, '2026-07-15 10:08:10.717605+00'),
	('ec3860eb-5469-41a4-a6fe-d5a50f24cd01', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'gig_approved', 'Your gig was approved', 'Your listing "designer" is now live on Chavee.', '/earn/gigs/9b5df4bc-6122-4d92-bd35-c43b9fd33a74', true, '2026-07-16 10:04:10.658662+00'),
	('bf596e10-d215-4687-9905-9fa19f1ca9c3', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'message', 'New message', NULL, '/messages/f3b6f279-a714-4730-b87b-50a3592abbc0', false, '2026-07-19 18:13:42.524021+00'),
	('fd1ef5c0-a63a-4b80-9fc2-77c10984b97e', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'gig_application', 'New pitch for your gig', NULL, '/messages/f3b6f279-a714-4730-b87b-50a3592abbc0', false, '2026-07-19 18:13:42.524021+00'),
	('5451d801-7127-41be-9691-c888d8bad6dc', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'message', 'New message', NULL, '/messages/f3b6f279-a714-4730-b87b-50a3592abbc0', false, '2026-07-19 18:13:42.524021+00'),
	('6cca4247-0296-4340-b53c-5e43f72761cb', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'gig_proposal', '📩 New Proposal Received', NULL, '/messages?id=f3b6f279-a714-4730-b87b-50a3592abbc0', false, '2026-07-19 18:13:42.524021+00'),
	('bda67546-9270-4c7c-8059-16a0f1a4a17b', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'message', 'New message', NULL, '/messages/279ed4c9-5188-4106-9ede-11a406bd1c45', false, '2026-07-19 18:20:32.975643+00'),
	('fb60e114-ebe2-44d7-8aff-501d5ae6eac0', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'gig_application', 'New pitch for your gig', NULL, '/messages/279ed4c9-5188-4106-9ede-11a406bd1c45', false, '2026-07-19 18:20:32.975643+00'),
	('8e30c13d-5118-4b65-bc7e-da923652fe63', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'message', 'New message', NULL, '/messages/279ed4c9-5188-4106-9ede-11a406bd1c45', false, '2026-07-19 18:20:32.975643+00'),
	('90f45705-6e48-4214-81c9-ffae37575cd1', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'gig_proposal', '📩 New Proposal Received', NULL, '/messages?id=279ed4c9-5188-4106-9ede-11a406bd1c45', false, '2026-07-19 18:20:32.975643+00'),
	('e83eb616-cf67-4437-9cd1-3be180cc166a', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'message', 'New message', NULL, '/messages/f3b6f279-a714-4730-b87b-50a3592abbc0', true, '2026-07-19 18:15:51.369174+00'),
	('e0a87c11-de03-43c1-8c6a-70b69283a12f', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'gig_approved', '💼 Gig Listing Approved!', 'Your gig "designer" has been reviewed and approved. It is now visible on the marketplace.', '/earn', true, '2026-07-16 10:04:11.283347+00'),
	('eef7fe20-009c-41a4-a434-96fddf591a7f', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'follow', 'New follower', 'Savinay hs started following you.', '/profile/703697b4-1ec6-4f27-858f-85279545e34a', true, '2026-07-22 18:32:08.67889+00'),
	('c52e8e90-bf18-43a2-9680-3ca01577cdde', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'follow', 'New follower', 'irfhan works started following you.', '/profile/634aecd8-e610-44cf-bcb9-5d5edfaa9edd', true, '2026-07-21 13:15:36.953554+00'),
	('f271b4f5-fcc6-475e-a5ab-bb4a67ee48b9', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_proposal', '📩 New Proposal Received', NULL, '/messages?id=f3b6f279-a714-4730-b87b-50a3592abbc0', true, '2026-07-19 18:15:51.369174+00'),
	('f0fefc7b-ce61-4686-adc2-2f2d21014469', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'follow', 'New follower', NULL, '/profile/4cc6de1f-4783-4946-aba7-91e4782d3818', true, '2026-07-22 19:24:12.747988+00'),
	('f277463e-5c5b-407d-9159-7caf2b6cef62', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'follow', 'New follower', 'irfhan works started following you.', '/profile/634aecd8-e610-44cf-bcb9-5d5edfaa9edd', true, '2026-07-22 19:28:00.089085+00'),
	('3af8d81d-072c-48f1-9705-6cad570f6f7a', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'message', 'New message', NULL, '/messages/6fc53c91-ed66-4ea8-9c89-baaa226d5e69', true, '2026-07-19 18:15:51.369174+00'),
	('1f75391c-9fb8-4979-9cee-0c1e50d2a968', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'follow', 'New follower', 'tester pro started following you.', '/profile/0ce0aeb7-4790-4994-8d6f-570f5b24a4b3', false, '2026-07-23 11:29:40.148568+00'),
	('041005d6-3b77-4c77-9312-fbb1ff4d3ae4', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_approved', 'Your gig was approved', 'Your listing "React Developer for Dashboard" is now live on Chavee.', '/earn/gigs/85a98728-868c-4abd-9439-3e29d35af1f7', true, '2026-07-15 10:08:11.781386+00'),
	('4dc490fe-1bcf-4156-a6a2-921e7bdf845c', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_approved', '💼 Gig Listing Approved!', 'Your gig "React Developer for Dashboard" has been reviewed and approved. It is now visible on the marketplace.', '/earn', true, '2026-07-15 10:08:12.010918+00'),
	('43891966-0fb2-4633-8d4c-2ff47a32cba8', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'new_message', '💬 New Message from Akshay Ennazhiyil ', 'Akshay Ennazhiyil  sent you a message: "msg set aayo"', '/messages?id=77466028-3947-4fa6-9904-b0745b48605a', false, '2026-08-17 04:38:26.015461+00'),
	('6974e94c-c883-4752-b433-87a34ff3711d', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'message', 'New message', NULL, '/messages/6fc53c91-ed66-4ea8-9c89-baaa226d5e69', true, '2026-07-27 21:33:23.688871+00'),
	('136dd71e-594e-4423-83eb-e6282b6f2bdc', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'gig_approved', '💼 Gig Listing Approved!', 'Your gig "desginer" has been reviewed and approved. It is now visible on the marketplace.', '/earn', false, '2026-07-28 07:53:01.631236+00'),
	('707bd6c2-9b07-40e2-b37f-bc67596b76f4', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'gig_application', 'New pitch for your gig', NULL, '/messages/fd0acb68-388e-49fb-a022-b750c61b4caf', false, '2026-07-28 07:54:05.085365+00'),
	('68ba6f4c-e762-412a-b63c-1c580bbf158a', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'gig_application', '💼 New Gig Proposal Received!', 'Someone applied to your gig "desginer".', '/earn', false, '2026-07-28 07:54:05.354472+00'),
	('69b6b349-5d8a-4cf5-9fe2-3a71113f964b', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'message', 'New message', NULL, '/messages/fd0acb68-388e-49fb-a022-b750c61b4caf', true, '2026-07-28 07:54:05.085365+00'),
	('e665fc87-b492-4802-aca1-b41f9dcc9545', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'message', 'New message', 'irfhan works sent you a message.', '/messages/4acd6445-ac60-449e-ab44-ed92447ef016', false, '2026-07-28 09:12:50.224041+00'),
	('3bf0ae2e-30d9-4747-ae99-2bba91d12e66', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'message', 'New message', 'irfhan works sent you a message.', '/messages/4acd6445-ac60-449e-ab44-ed92447ef016', false, '2026-07-28 10:01:48.834134+00'),
	('9edb87c0-4902-4d75-97e3-2812f40838fa', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'new_message', '💬 New Message', 'Da', '/messages?id=4acd6445-ac60-449e-ab44-ed92447ef016', false, '2026-07-28 10:01:49.072827+00'),
	('2e49f07f-f544-46ee-b175-6e3800f3ba7a', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'message', 'New message', 'Akshay Ennazhiyil  sent you a message.', '/messages/1b87121f-8cbb-4ba6-93c7-be0279c658ad', false, '2026-08-17 04:38:35.794469+00'),
	('a493b9fd-660b-426c-b24b-021a7910f68e', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'new_message', '💬 New Message from Akshay Ennazhiyil ', 'Akshay Ennazhiyil  sent you a message: "test"', '/messages?id=1b87121f-8cbb-4ba6-93c7-be0279c658ad', false, '2026-08-17 04:38:35.989388+00'),
	('1bbb78a1-37b9-4292-92d1-9a2e8a81e938', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'gig_approved', 'Your gig was approved', 'Your listing "desginer" is now live on Chavee.', '/earn/gigs/f153075b-1704-40c3-8100-8b997bf90ad2', true, '2026-07-28 07:53:01.360101+00'),
	('3dd18ed5-5744-4ee1-b0df-4ceb22b814ec', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'message', 'New message', 'headspace730 sent you a message.', '/messages/77466028-3947-4fa6-9904-b0745b48605a', false, '2026-08-17 06:53:15.877086+00'),
	('cd5878cc-58c1-4f88-9928-37d14d6ff7e4', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'message', 'New message', 'irfhan works sent you a message.', '/messages/4acd6445-ac60-449e-ab44-ed92447ef016', false, '2026-07-28 17:11:40.317945+00'),
	('a2c0cc37-0af1-4ccd-b5a4-25900f1dc45e', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'new_message', '💬 New Message', 'ha kitty', '/messages?id=4acd6445-ac60-449e-ab44-ed92447ef016', false, '2026-07-28 17:11:40.684634+00'),
	('a989305c-2e95-47d4-8bed-930ca5cd3741', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'message', 'New message', 'Ajmal Aju sent you a message.', '/messages/77466028-3947-4fa6-9904-b0745b48605a', false, '2026-07-29 07:57:54.248789+00'),
	('b3e2d43d-4c95-4ea6-9256-5700fdd239c7', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'like', 'New like', 'One Legged Pirate liked your post.', '/posts/7148d3cc-be96-496b-9853-a923bb39a4a2', false, '2026-07-29 18:47:13.424989+00'),
	('ad24ed84-bdbf-402a-a5ab-4bf93f2e2ed3', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'post_like', '❤️ Someone liked your post!', 'Your post got a new like on Chavee.', '/dashboard', false, '2026-07-29 18:47:13.590122+00'),
	('79cef09a-5e7c-4aaf-8a26-0585eaa41295', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'message', 'New message', 'One Legged Pirate sent you a message.', '/messages/4acd6445-ac60-449e-ab44-ed92447ef016', false, '2026-07-29 18:47:44.413748+00'),
	('36551f17-115b-44c5-b511-d3b9c94c20ba', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'message', 'New message', 'One Legged Pirate sent you a message.', '/messages/4acd6445-ac60-449e-ab44-ed92447ef016', false, '2026-07-29 18:47:59.895634+00'),
	('9579337a-222a-419d-83cd-9e61ab7415f7', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'new_message', '💬 New Message from headspace730', 'headspace730 sent you a message: "athokke set an no worries"', '/messages?id=77466028-3947-4fa6-9904-b0745b48605a', false, '2026-08-17 06:53:16.186785+00'),
	('fba28f9f-6b3f-4d38-8888-fa60092ba65a', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'message', 'New message', 'headspace730 sent you a message.', '/messages/77466028-3947-4fa6-9904-b0745b48605a', false, '2026-08-17 06:53:46.915675+00'),
	('3a474edf-41b1-49ee-b2d6-785dda3276eb', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'message', 'New message', NULL, '/messages/f3b6f279-a714-4730-b87b-50a3592abbc0', false, '2026-07-30 15:54:00.43015+00'),
	('fa7d1a3f-9064-4118-96b6-1ec30a7f92fa', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'new_message', '💬 New Message', 'hi', '/messages?id=f3b6f279-a714-4730-b87b-50a3592abbc0', false, '2026-07-30 15:54:05.567688+00'),
	('bbb26b73-f8b8-408c-a8f0-53b0787fee11', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'like', 'New like', 'Chera liked your post.', '/posts/7148d3cc-be96-496b-9853-a923bb39a4a2', false, '2026-07-30 15:55:18.709124+00'),
	('71d3022b-cf07-4996-a71a-b02d7271709e', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'post_like', '❤️ Someone liked your post!', 'Your post got a new like on Chavee.', '/dashboard', false, '2026-07-30 15:55:18.924292+00'),
	('3dfba020-724f-4d65-9b45-93a4f4a8930a', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'message', 'New message', 'Chera sent you a message.', '/messages/1b87121f-8cbb-4ba6-93c7-be0279c658ad', false, '2026-07-30 16:43:44.179769+00'),
	('add0b9c0-7f6f-42b3-9251-54a448332cfd', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'follow', 'New follower', 'chaveetest started following you.', '/profile/c3c7a6c2-9325-44ca-94ba-e67eacce8968', false, '2026-07-30 20:24:00.288423+00'),
	('77217490-3c8d-46d5-a3a3-7c582ed2350d', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'new_follower', '👤 New Follower!', 'Someone started following you on Chavee.', '/profile/c3c7a6c2-9325-44ca-94ba-e67eacce8968', true, '2026-07-30 20:24:00.648019+00'),
	('506283c9-be81-47c0-9eb6-743cf493a97b', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'new_message', '💬 New Message', 'Hai', '/messages?id=8a57b150-fe09-451c-9be0-1de9b626661a', true, '2026-07-30 20:24:31.420561+00'),
	('c9e6437d-4d32-41c7-ab39-56641f8917cb', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'message', 'New message', 'chaveetest sent you a message.', '/messages/8a57b150-fe09-451c-9be0-1de9b626661a', true, '2026-07-30 20:24:31.141488+00'),
	('b0a172af-a828-499d-bf5b-9924377439f8', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'new_message', '💬 New Message from headspace730', 'headspace730 sent you a message: "arulla ini Seo works, LAnding pagesil pagekal create akan nd"', '/messages?id=77466028-3947-4fa6-9904-b0745b48605a', false, '2026-08-17 06:53:47.169055+00'),
	('3dae00d7-dd93-45fb-8892-6b64a849bec0', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'follow', 'New follower', 'irfhan works started following you.', '/profile/634aecd8-e610-44cf-bcb9-5d5edfaa9edd', false, '2026-07-31 18:36:28.935651+00'),
	('45e88715-9a70-40b3-b0c6-c453f2ac5865', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'gig_approved', 'Your gig was approved', 'Your listing "Designer" is now live on Chavee.', '/earn/gigs/716e9036-14c3-46c3-812a-2924ae1a6334', false, '2026-08-02 10:49:31.212356+00'),
	('b33a685c-ec9c-45ee-9cfc-cd40a337fb1c', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'connection_request', 'New connection request', 'One Legged Pirate sent you a connection request.', '/profile/twinkletow69_0ce0ae', false, '2026-08-02 16:37:43.817315+00'),
	('a0152ba4-901c-494b-a176-acbb4e0584de', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'message', 'New message', 'Rahul Kumar sent you a message.', '/messages/ea9f7fac-ba9f-4508-86f1-7c0c43d5d3f8', false, '2026-08-02 20:59:47.790991+00'),
	('05e871ee-3ae6-4f0e-b232-7fdd5cff605c', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'gig_application', 'New pitch for your gig', 'Rahul Kumar sent a pitch for "Designer".', '/messages/ea9f7fac-ba9f-4508-86f1-7c0c43d5d3f8', false, '2026-08-02 20:59:47.790991+00'),
	('273f3b13-fe92-4b23-b8aa-7ba3eba9b772', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'gig_application', '💼 New Gig Proposal Received!', 'Someone applied to your gig "Designer".', '/earn', false, '2026-08-02 20:59:48.188883+00'),
	('571a8275-8875-4f9b-825f-cbfde2c25d9b', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'gig_application', 'New pitch for your gig', 'chaveetest sent a pitch for "Designer".', '/messages/65ca5a77-f618-4c9e-b0e8-5729164303a7', false, '2026-08-03 06:14:32.851708+00'),
	('216f7c6a-d244-4143-b52b-ed87422e6d82', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'gig_application', '💼 New Gig Proposal Received!', 'Someone applied to your gig "Designer".', '/earn', true, '2026-08-03 06:14:33.149043+00'),
	('57db2296-657c-4d83-872c-0a4aed996be2', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'message', 'New message', 'chaveetest sent you a message.', '/messages/65ca5a77-f618-4c9e-b0e8-5729164303a7', true, '2026-08-03 06:14:32.851708+00'),
	('7ad3a89f-74b2-4638-833c-bbffe2863046', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'message', 'New message', 'headspace730 sent you a message.', '/messages/f3b6f279-a714-4730-b87b-50a3592abbc0', false, '2026-08-08 20:19:39.432658+00'),
	('7a83e3d2-e86c-4201-b603-af9dc8551044', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'new_message', '💬 New Message from headspace730', 'headspace730 sent you a message: "hi"', '/messages?id=f3b6f279-a714-4730-b87b-50a3592abbc0', false, '2026-08-08 20:19:39.863484+00'),
	('85258b45-b9ef-46f2-8881-195c17f4febd', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'like', 'New like', 'Chavee Dynamic Admin liked your post.', '/posts/147f30d4-0a39-43dd-9ac4-84b5fa859472', true, '2026-08-12 19:10:03.072934+00'),
	('2e8a56ac-3928-4a38-9427-d13fda3c6a91', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'message', 'New message', 'headspace730 sent you a message.', '/messages/077635b1-232d-48c1-b235-1e47be907bb2', false, '2026-08-14 21:51:56.085331+00'),
	('2cd5240c-5e3e-4df1-bb5e-5a93390cc20f', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'gig_application', 'New pitch for your gig', 'headspace730 sent a pitch for "Designer".', '/messages/077635b1-232d-48c1-b235-1e47be907bb2', false, '2026-08-14 21:51:56.085331+00'),
	('8af83292-9f8a-4320-b691-35bf8413dcd1', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'message', 'New message', 'headspace730 sent you a message.', '/messages/01e15dd7-05d2-4cd6-b968-82489ba9d28f', false, '2026-08-14 22:02:52.2028+00'),
	('1d1e4ca3-0f47-40e1-8002-dac413366894', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'gig_application', 'New pitch for your gig', 'headspace730 sent a pitch for "Designer".', '/messages/01e15dd7-05d2-4cd6-b968-82489ba9d28f', false, '2026-08-14 22:02:52.2028+00'),
	('9b38ef83-e1dd-49c2-a185-e6f6067fb719', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'message', 'New message', 'headspace730 sent you a message.', '/messages/1b87121f-8cbb-4ba6-93c7-be0279c658ad', false, '2026-08-16 07:13:46.794829+00'),
	('c4179739-5e14-4584-98ea-93158f2c58b1', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'message', 'New message', 'headspace730 sent you a message.', '/messages/1b87121f-8cbb-4ba6-93c7-be0279c658ad', false, '2026-08-16 07:14:01.103545+00'),
	('53a1bc09-7a40-44fe-b77c-affd00f7f4b5', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'message', 'New message', 'headspace730 sent you a message.', '/messages/6fc53c91-ed66-4ea8-9c89-baaa226d5e69', false, '2026-08-16 07:18:19.291605+00'),
	('aebc9e62-7de6-47a1-a6d1-121b0ae607f2', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'message', 'New message', 'headspace730 sent you a message.', '/messages/77466028-3947-4fa6-9904-b0745b48605a', false, '2026-08-16 07:20:42.773404+00'),
	('4687e852-1078-45b6-a0e8-d66f3eeec826', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'message', 'New message', 'Irfhan sent you a message.', '/messages/77466028-3947-4fa6-9904-b0745b48605a', false, '2026-08-16 07:39:04.168913+00'),
	('2b784d55-0c45-4a4d-ba00-744484ba8b29', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_approved', 'Your gig was approved', 'Your listing "React Developer for Dashboard" is now live on Chavee.', '/earn/gigs/85a98728-868c-4abd-9439-3e29d35af1f7', true, '2026-07-15 10:08:13.467749+00'),
	('e123c464-ebe0-49d2-91e8-c6f978990f6c', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_approved', '💼 Gig Listing Approved!', 'Your gig "React Developer for Dashboard" has been reviewed and approved. It is now visible on the marketplace.', '/earn', true, '2026-07-15 10:08:13.683718+00'),
	('a9a8f531-3c77-47c0-b757-db86e6b0448c', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_approved', 'Your gig was approved', 'Your listing "React Developer for Dashboard" is now live on Chavee.', '/earn/gigs/9766c6b6-5bf2-425c-a689-31af8a5aa8b3', true, '2026-07-15 10:08:14.301888+00'),
	('2289d5a8-ca52-4079-a240-d441984bdb0a', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_approved', '💼 Gig Listing Approved!', 'Your gig "React Developer for Dashboard" has been reviewed and approved. It is now visible on the marketplace.', '/earn', true, '2026-07-15 10:08:14.520444+00'),
	('94546370-1819-4b89-9961-57afe37ba7d2', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_approved', 'Your gig was approved', 'Your listing "designer" is now live on Chavee.', '/earn/gigs/e7adac8f-a68f-4077-b271-92ce64f78599', true, '2026-07-19 18:15:02.240387+00'),
	('dbab2c83-42e0-4929-99a2-3ab5e74eac0c', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_approved', '💼 Gig Listing Approved!', 'Your gig "designer" has been reviewed and approved. It is now visible on the marketplace.', '/earn', true, '2026-07-19 18:15:02.520394+00'),
	('e24022d1-8fb4-48f4-89db-e40ecae1059d', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', 'New pitch for your gig', NULL, '/messages/6fc53c91-ed66-4ea8-9c89-baaa226d5e69', true, '2026-07-19 18:15:51.369174+00'),
	('c0602172-15ec-4c9e-8eed-0a43aaaf1e15', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_approved', 'Your gig was approved', 'Your listing "design" is now live on Chavee.', '/earn/gigs/434e1f7e-f0a4-454f-a966-c53193b34507', true, '2026-07-22 19:23:23.866418+00'),
	('0d0e979b-62e0-4637-80a7-5eac64a1c0f7', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_approved', '💼 Gig Listing Approved!', 'Your gig "design" has been reviewed and approved. It is now visible on the marketplace.', '/earn', true, '2026-07-22 19:23:24.2855+00'),
	('4ea4d765-98f5-4bd1-b039-adccd4772a7d', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_approved', 'Your gig was approved', 'Your listing "fdsfs" is now live on Chavee.', '/earn/gigs/e1c9613c-e39b-4e09-959c-f85eb107f24c', true, '2026-08-03 06:22:39.779325+00'),
	('c6f2bcd6-5567-43db-b8e6-e0d80d935ae7', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'message', 'New message', 'chaveetest sent you a message.', '/messages/0e67d1e3-c9f9-4fab-a86d-6e5921a96326', true, '2026-08-03 06:23:03.677404+00'),
	('cc8abd08-bf3f-45aa-b930-fa76defb11ba', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', 'New pitch for your gig', 'chaveetest sent a pitch for "fdsfs".', '/messages/0e67d1e3-c9f9-4fab-a86d-6e5921a96326', true, '2026-08-03 06:23:03.677404+00'),
	('9d41d565-79e9-4199-85bc-1314adc021b5', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', '💼 New Gig Proposal Received!', 'Someone applied to your gig "fdsfs".', '/earn', true, '2026-08-03 06:23:03.915677+00'),
	('36cafd6d-4813-430b-a505-eefc38107e34', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_approved', 'Your gig was approved', 'Your listing "dfsfds" is now live on Chavee.', '/earn/gigs/93a8316d-3375-47fd-9ec8-11710ed6f408', true, '2026-08-03 06:45:27.858408+00'),
	('8a650fb1-e16a-4f64-a160-10194bfa1ecb', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'message', 'New message', 'chaveetest sent you a message.', '/messages/b8833d8f-5a72-4330-857f-72ebdbf2df78', true, '2026-08-03 06:45:58.993201+00'),
	('5c2df3b0-4d6e-412a-8b6e-748aee5775e1', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', 'New pitch for your gig', 'chaveetest sent a pitch for "dfsfds".', '/messages/b8833d8f-5a72-4330-857f-72ebdbf2df78', true, '2026-08-03 06:45:58.993201+00'),
	('e75d11cb-9c6b-4f9d-a3a1-750b2ccb33fe', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', '💼 New Gig Proposal Received!', 'Someone applied to your gig "dfsfds".', '/earn', true, '2026-08-03 06:45:59.230452+00'),
	('4f65a682-1781-41f9-8073-2e625a4af9f3', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'message', 'New message', 'irfhan works sent you a message.', '/messages/e2fb3c71-4d87-4324-838d-27faf33fdc5c', true, '2026-08-05 11:03:26.049307+00'),
	('bd1d21d0-7a0d-4869-a9e3-f2dc869e3f84', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', 'New pitch for your gig', 'irfhan works sent a pitch for "dfsfds".', '/messages/e2fb3c71-4d87-4324-838d-27faf33fdc5c', true, '2026-08-05 11:03:26.049307+00'),
	('4c089b51-5650-4dc5-abc4-602284c81a57', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', '💼 New Gig Proposal Received!', 'Someone applied to your gig "dfsfds".', '/earn', true, '2026-08-05 11:03:26.848415+00'),
	('e54bc333-7ef8-4c32-9835-ff5665bd887a', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_approved', 'Your gig was approved', 'Your listing "sdfds" is now live on Chavee.', '/earn/gigs/ffb934b6-b89e-4615-8dc0-aec3a14a96b1', true, '2026-08-05 19:45:34.114743+00'),
	('1f47a6f7-7e10-4fde-9f5d-15cf0b42b5ae', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'message', 'New message', 'irfhan works sent you a message.', '/messages/9a088f45-b8d6-4f1c-ad8b-208daba2c235', true, '2026-08-05 19:46:00.832803+00'),
	('aefd0987-d2c2-46d4-b67b-8e784780c433', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', 'New pitch for your gig', 'irfhan works sent a pitch for "sdfds".', '/messages/9a088f45-b8d6-4f1c-ad8b-208daba2c235', true, '2026-08-05 19:46:00.832803+00'),
	('ec1c3819-6bc6-4600-95e1-6c9684c428b1', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', '💼 New Gig Proposal Received!', 'Someone applied to your gig "sdfds".', '/earn', true, '2026-08-05 19:46:01.160175+00'),
	('11e94b24-93c8-4a29-ad1a-a5b02ae1bf6b', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_approved', 'Your gig was approved', 'Your listing "dsfsd" is now live on Chavee.', '/earn/gigs/72c133ce-a9fd-4267-bf2b-db8e76760260', true, '2026-08-05 20:10:06.015386+00'),
	('be3aa093-5131-473d-b96d-4bc92515e856', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'message', 'New message', 'irfhan works sent you a message.', '/messages/9e39aea0-d441-4fb3-95fa-d8bc4e695f09', true, '2026-08-05 20:10:31.760645+00'),
	('24c64f55-0a86-401f-bc25-3d99e0a39b56', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', 'New pitch for your gig', 'irfhan works sent a pitch for "dsfsd".', '/messages/9e39aea0-d441-4fb3-95fa-d8bc4e695f09', true, '2026-08-05 20:10:31.760645+00'),
	('c46f75f6-3895-47c8-9c66-8fe250103cc2', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', '💼 New Gig Proposal Received!', 'Someone applied to your gig "dsfsd".', '/earn', true, '2026-08-05 20:10:32.015316+00'),
	('bb6f57c5-e141-4c8e-92cb-5fef6c261503', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_approved', 'Your gig was approved', 'Your listing "reterte" is now live on Chavee.', '/earn/gigs/ea34dc4d-f626-4002-ac62-22673e1dc020', true, '2026-08-08 08:27:01.543366+00'),
	('1f1103a5-05f8-4deb-b6b8-9743d7c0e47f', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'message', 'New message', 'irfhan works sent you a message.', '/messages/0ba0342f-3300-4991-bb2e-813ed6aa4e71', true, '2026-08-08 08:27:15.176762+00'),
	('6d89fe76-4a78-4333-8093-652b4dee5d07', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', 'New pitch for your gig', 'irfhan works sent a pitch for "reterte".', '/messages/0ba0342f-3300-4991-bb2e-813ed6aa4e71', true, '2026-08-08 08:27:15.176762+00'),
	('1a3ca209-dc78-4081-ab5e-7d3618cf182d', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', '💼 New Gig Proposal Received!', 'Someone applied to your gig "reterte".', '/earn', true, '2026-08-08 08:27:15.476186+00'),
	('0555b5ac-201d-4048-82d4-6e4c0693c89d', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'message', 'New message', 'irfhan works sent you a message.', '/messages/75cc90e5-2ed0-4be4-8fdf-a3479b62e46f', true, '2026-08-08 09:06:34.130439+00'),
	('78640448-4f00-471b-94e8-ab7698e6919d', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', 'New pitch for your gig', 'irfhan works sent a pitch for "fdsfs".', '/messages/75cc90e5-2ed0-4be4-8fdf-a3479b62e46f', true, '2026-08-08 09:06:34.130439+00'),
	('eb5a09fd-b2ee-4fd6-b24e-61e2da47dd2f', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', '💼 New Gig Proposal Received!', 'Someone applied to your gig "fdsfs".', '/earn', true, '2026-08-08 09:06:34.358551+00'),
	('5d93c0ed-2b2c-455f-b0ce-14548aa1ea8c', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_approved', 'Your gig was approved', 'Your listing "dsfsdfds" is now live on Chavee.', '/earn/gigs/cb5e34d2-0510-490b-ac9d-46c7b5a5267e', true, '2026-08-08 10:02:34.233551+00'),
	('c0869c93-4b26-4278-8d0c-e9eb986ec253', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'message', 'New message', 'irfhan works sent you a message.', '/messages/b65739e8-fc27-49d3-b59e-34e0da0b58c2', true, '2026-08-08 10:02:45.005059+00'),
	('fc9a7122-1314-432f-8a94-7205fc1eb195', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', 'New pitch for your gig', 'irfhan works sent a pitch for "dsfsdfds".', '/messages/b65739e8-fc27-49d3-b59e-34e0da0b58c2', true, '2026-08-08 10:02:45.005059+00'),
	('80ea3a72-1182-41bd-8559-6197bbc4f035', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', '💼 New Gig Proposal Received!', 'Someone applied to your gig "dsfsdfds".', '/earn', true, '2026-08-08 10:02:45.282996+00'),
	('58f92a55-44d5-40f2-b2f2-092bcf4f64c1', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'like', 'New like', 'irfhan works liked your post.', '/posts/dea8e5f4-a790-402a-a504-ea62af95bb2f', true, '2026-08-08 13:59:58.504614+00'),
	('1e059ef1-2ae8-43f0-ac44-ad3e5865d266', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'post_like', '❤️ Someone liked your post!', 'Your post got a new like on Chavee.', '/dashboard', true, '2026-08-08 13:59:59.02893+00'),
	('ebd71e2b-d7d4-405e-ac4e-4ce2c19a0bfa', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_approved', 'Your gig was approved', 'Your listing "dfdsfs" is now live on Chavee.', '/earn/gigs/ee611370-f2a7-4e87-9052-ef39fd7df0c5', true, '2026-08-10 08:32:34.176403+00'),
	('229ec45e-91ec-45b2-91ae-0594acd7a5a2', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_approved', 'Your gig was approved', 'Your listing "dsfsd" is now live on Chavee.', '/earn/gigs/b7507339-82ea-477b-bd26-34b0bb81fa2b', true, '2026-08-14 09:36:00.066578+00'),
	('47cc0309-f119-412a-a6b4-5fefab49c78e', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'message', 'New message', 'irfhan works sent you a message.', '/messages/84e52259-caa0-47d2-8303-7e7436af6c2e', true, '2026-08-14 09:36:30.159606+00'),
	('aab3fedf-0a75-4864-ad75-3003ab6c219a', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', 'New pitch for your gig', 'irfhan works sent a pitch for "dsfsd".', '/messages/84e52259-caa0-47d2-8303-7e7436af6c2e', true, '2026-08-14 09:36:30.159606+00'),
	('8d9b7afd-97da-4f47-a639-45be119a1ea8', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', '💼 New Gig Proposal Received!', 'Someone applied to your gig "dsfsd".', '/earn', true, '2026-08-14 09:36:30.714035+00'),
	('53dff07b-3837-4a1b-afef-8c31ae9fea8f', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_approved', 'Your gig was approved', 'Your listing "cxvcx" is now live on Chavee.', '/earn/gigs/d90f4382-1551-41d8-83d7-55c1aab2cd9e', true, '2026-08-14 09:40:21.281305+00'),
	('9f0db82f-c1ae-4260-acfc-b3338307df0b', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'message', 'New message', 'irfhan works sent you a message.', '/messages/e20c3919-5820-4285-b23e-ea5f41e2a27d', true, '2026-08-14 09:40:36.953105+00'),
	('029f165c-3919-4ee9-a5ea-25c368dc0701', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', 'New pitch for your gig', 'irfhan works sent a pitch for "cxvcx".', '/messages/e20c3919-5820-4285-b23e-ea5f41e2a27d', true, '2026-08-14 09:40:36.953105+00'),
	('139debdf-237a-4d60-860c-9bfa37169672', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', '💼 New Gig Proposal Received!', 'Someone applied to your gig "cxvcx".', '/earn', true, '2026-08-14 09:40:37.217721+00'),
	('129312c5-5974-4a19-8651-85c9e8cf7c6e', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_approved', 'Your gig was approved', 'Your listing "__DIAGNOSTIC_PROBE_delete_me__" is now live on Chavee.', '/earn/gigs/6dfe5874-9e57-442a-8d59-5ae3d027d7af', true, '2026-08-14 10:22:44.753056+00'),
	('08ec7bc7-484d-49de-8608-07288a0556b2', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_rejected', '⚠️ Gig Listing Needs Changes', 'Your gig "Step5 moderation queue test gig" wasn''t approved this time. Open it from My Gigs → Needs Attention to see why and resubmit.', '/earn', true, '2026-08-14 17:13:49.048054+00'),
	('070b3267-8095-4722-92b7-3e3e58431aec', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_approved', 'Your gig was approved', 'Your listing "Step5 approve test gig" is now live on Chavee.', '/earn/gigs/7cece6de-028f-431f-aa12-f534798ddf85', true, '2026-08-14 17:16:56.971955+00'),
	('08957ee4-9444-4fc7-8e82-9335a817aa6d', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_approved', '💼 Gig Listing Approved!', 'Your gig "Step5 approve test gig" has been reviewed and approved. It is now visible on the marketplace.', '/earn', true, '2026-08-14 17:16:57.648742+00'),
	('7ad13bab-ea32-410b-be5c-befe73ebd46d', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_approved', 'Your gig was approved', 'Your listing "Step5 approve-and-trust test gig" is now live on Chavee.', '/earn/gigs/0b1208a8-7c37-468d-a046-8611441553e6', true, '2026-08-14 17:18:44.55007+00'),
	('e8e8b3a0-5c04-42d4-ad2c-2daa86304fe3', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_approved', '💼 Gig Listing Approved!', 'Your gig "Step5 approve-and-trust test gig" has been reviewed and approved. It is now visible on the marketplace. Future gigs you post will go live immediately, without review.', '/earn', true, '2026-08-14 17:18:45.446799+00'),
	('637640e4-2239-498f-a281-e601b7b3f191', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', 'New pitch for your gig', 'headspace730 sent a pitch for "Group2 Step3 A8 poster-view test gig".', '/messages/2055912c-4daf-4f82-865d-5571bacd04cc', true, '2026-08-14 21:11:47.642818+00'),
	('32f7ad53-05fe-48e1-a820-5c138ddbaee4', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', 'New pitch for your gig', 'headspace730 sent a pitch for "Group2 Step3 A8 withdrawn-indicator test gig".', '/messages/2055912c-4daf-4f82-865d-5571bacd04cc', true, '2026-08-14 21:17:07.796824+00'),
	('81949473-c625-4647-b3cf-c19b394d4848', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', 'New pitch for your gig', 'headspace730 sent a pitch for "Group3 Step3 Test Gig (safe to delete)".', '/messages/2055912c-4daf-4f82-865d-5571bacd04cc', true, '2026-08-14 22:04:24.172585+00'),
	('418192cf-005a-47fb-bf28-7c7caf185835', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', 'New pitch for your gig', 'headspace730 sent a pitch for "Group3 Step3 Legacy Test Gig (safe to delete)".', '/messages/2055912c-4daf-4f82-865d-5571bacd04cc', true, '2026-08-14 22:06:34.671034+00'),
	('32beeede-f545-4890-9467-35cabd3f06d5', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', 'New pitch for your gig', 'headspace730 sent a pitch for "Group3 Step4 Checkout Test Gig (safe to delete)".', '/messages/2055912c-4daf-4f82-865d-5571bacd04cc', true, '2026-08-14 22:14:51.453656+00'),
	('ddda52c4-3987-4ebe-9601-bbaf1bdf14a8', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', 'New pitch for your gig', 'headspace730 sent a pitch for "Group3 EnvCheck Test Gig (safe to delete)".', '/messages/ab027ed8-616c-42cb-99c9-94a4c01be7d5', true, '2026-08-14 22:32:00.656862+00'),
	('a5113514-6a88-4d17-a35f-82202df85c51', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'message', 'New message', 'Irfhan sent you a message.', '/messages/fcfea5af-528a-4e0e-af30-df86a649ed02', true, '2026-08-14 23:14:40.892422+00'),
	('062127b2-0e1d-45c1-88d1-a00c9073be1b', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', 'New pitch for your gig', 'Irfhan sent a pitch for "testing".', '/messages/fcfea5af-528a-4e0e-af30-df86a649ed02', true, '2026-08-14 23:14:40.892422+00'),
	('ad274f37-b1e6-4b6d-a181-e4625b2d8164', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', '💼 New Gig Proposal Received!', 'Someone applied to your gig "testing".', '/earn', true, '2026-08-14 23:14:41.221032+00'),
	('92425fe8-7b3e-4139-a3dc-4b04a55000b8', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'message', 'New message', 'Irfhan sent you a message.', '/messages/a4af9056-e312-4a2d-a0a6-b30c24e3daa8', true, '2026-08-15 10:50:35.422238+00'),
	('26c0e1c5-b42c-4d9e-86bf-44b43a8f5a76', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', 'New pitch for your gig', 'Irfhan sent a pitch for "dfdsfs".', '/messages/a4af9056-e312-4a2d-a0a6-b30c24e3daa8', true, '2026-08-15 10:50:35.422238+00'),
	('2a3d3d1b-9764-47a2-af13-140cfdd89809', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'gig_application', 'New pitch for your gig', 'headspace730 sent a pitch for "Race Fix Verify Gig (safe to delete)".', '/messages/ab027ed8-616c-42cb-99c9-94a4c01be7d5', true, '2026-08-15 10:53:36.75372+00'),
	('a8f6e230-75ca-4e13-b506-230d21e7199a', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'message', 'New message', 'Irfhan sent you a message.', '/messages/48853f04-ee0a-458c-ab38-d3f589821043', true, '2026-08-16 07:37:45.754392+00'),
	('2de781e2-63af-4ddc-b4a9-055bf2edc556', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'new_message', '💬 New Message from Irfhan', 'Irfhan sent you a message: "Post-revoke verify — gig conversation reply, real UI send."', '/messages?id=48853f04-ee0a-458c-ab38-d3f589821043', true, '2026-08-16 07:37:46.021267+00'),
	('d1f138fe-5f03-4812-b44f-c813a1f681ab', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'message', 'New message', 'Irfhan sent you a message.', '/messages/f6bcaf71-ec78-4ac6-a07d-4c0930084dc1', true, '2026-08-16 07:38:38.225156+00'),
	('fac8c4e4-36a7-4c55-98f5-f235027418fb', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'new_message', '💬 New Message from Irfhan', 'Irfhan sent you a message: "Post-revoke verify — connected-peer conversation reply, real"', '/messages?id=f6bcaf71-ec78-4ac6-a07d-4c0930084dc1', true, '2026-08-16 07:38:38.507103+00'),
	('dba2bca7-715c-40e0-b645-73979bbca520', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'message', 'New message', 'Irfhan sent you a message.', '/messages/77466028-3947-4fa6-9904-b0745b48605a', true, '2026-08-16 07:39:04.168913+00'),
	('16e6557a-a096-4a83-9bff-fde657583994', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'message', 'New message', 'irfhan works sent you a message.', '/messages/1263692e-3a41-445f-958a-27f93bd9efe3', true, '2026-08-16 13:21:49.736082+00'),
	('2c27f73b-9b0c-4130-ac1d-89ab58ecec8a', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'message', 'New message', 'irfhan works sent you a message.', '/messages/1263692e-3a41-445f-958a-27f93bd9efe3', true, '2026-08-16 13:36:07.477521+00'),
	('e3923f06-3d0c-4ecf-9743-54357f225b64', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'message', 'New message', 'irfhan works sent you a message.', '/messages/1263692e-3a41-445f-958a-27f93bd9efe3', true, '2026-08-16 13:37:01.703787+00'),
	('3b56530a-992a-49cd-96bf-8895596ad771', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'message', 'New message', 'irfhan works sent you a message.', '/messages/1263692e-3a41-445f-958a-27f93bd9efe3', true, '2026-08-16 13:49:19.817327+00');


--
-- Data for Name: notify_subscribers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."notify_subscribers" ("id", "user_id", "email", "feature_key", "notified", "created_at") VALUES
	('d9874d7b-7776-4d43-9ca8-297bd088bff9', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'akshayepni@gmail.com', 'course_kr1', false, '2026-07-30 21:06:03.430894+00'),
	('1aaafec5-2a98-4413-a79c-cd4ae5abca1e', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'akshayepni@gmail.com', 'study_sync', false, '2026-08-01 19:17:29.512603+00'),
	('3fac8c73-63d4-4541-b274-2f7a090dbc39', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'akshayepni@gmail.com', 'course:8559e783-47ec-4c27-b8e1-e3af3539917a', false, '2026-08-02 10:39:32.89601+00'),
	('2c7393a9-cffa-4dc2-a401-46870acf90c0', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'akshayepni@gmail.com', 'student_marketplace', false, '2026-08-02 10:42:24.902516+00'),
	('36c28bad-b3a8-4da8-8e1d-7f30e2a3058a', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'headspace730@gmail.com', 'mentor_support', false, '2026-08-15 17:41:56.498882+00'),
	('1462b7b8-0953-4800-9710-dafe4daacd99', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'headspace730@gmail.com', 'study_sync', false, '2026-08-15 17:42:17.548647+00'),
	('e44e15d7-d412-48b6-a193-8692a630cd4d', NULL, 'headspace730@gmail.com', '2fa_security', false, '2026-08-16 15:07:03.836045+00'),
	('ac20e3d7-a219-469a-b5b5-8a05f07084df', NULL, 'headspace730@gmail.com', 'data_export', false, '2026-08-16 15:11:38.768618+00'),
	('2c0edd9f-11ee-4ae9-97ee-6237e2363e87', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'headspace730@gmail.com', 'course:8559e783-47ec-4c27-b8e1-e3af3539917a', false, '2026-08-16 15:36:39.136795+00'),
	('5b62040a-6de3-4c57-82d5-89108d4b306a', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'headspace730@gmail.com', 'student_marketplace', false, '2026-08-16 15:37:46.589562+00'),
	('31633d83-79a3-47ed-9f0f-45a901b8149e', NULL, 'footer-test-1786895350735@example.com', 'resources', false, '2026-08-16 15:49:11.106624+00'),
	('b83ad601-97e6-471a-9b1c-1fb0fe72d47b', NULL, 'footer-fix-verify-1786899645995@example.com', 'newsletter', false, '2026-08-16 17:00:46.285005+00'),
	('02b78340-b6fa-450b-b29d-7db8f20c1e2f', NULL, 'footer-verify2-1786901158607@example.com', 'newsletter', false, '2026-08-16 17:25:58.835402+00');


--
-- Data for Name: posts; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: post_comments; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: post_likes; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: press_releases_deprecated; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: privacy_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."privacy_settings" ("user_id", "profile_visibility", "hide_email", "hide_phone", "hide_college", "hide_birthday", "hide_profile_from_search", "allow_connection_requests", "allow_messages", "show_online_status", "show_last_seen", "allow_community_invites", "allow_event_invites", "allow_mentor_requests", "updated_at") VALUES
	('2b1734b5-4b93-4603-ba71-1a6120ccd502', 'public', true, true, true, true, true, true, true, true, true, true, true, true, '2026-08-02 10:00:51.572299+00'),
	('4cc6de1f-4783-4946-aba7-91e4782d3818', 'public', false, true, false, true, false, true, true, true, true, true, true, true, '2026-08-03 06:21:42.737747+00'),
	('0f53f9b7-a987-43da-b70d-a49dd9170f09', 'public', false, true, false, true, false, true, true, true, true, true, true, true, '2026-08-17 04:17:06.840344+00');


--
-- Data for Name: reports_moderation; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: resources; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."resources" ("id", "title", "category", "thumbnail_url", "description", "is_coming_soon", "featured", "published", "sort_order", "created_at", "updated_at", "icon", "status") VALUES
	('4ac07f3a-607c-4bed-8cb7-d28522cfe105', 'Complete React Notes', 'PDF Notes', NULL, 'Comprehensive handwritten notes for learning React.js from scratch.', true, false, false, 0, '2026-08-02 08:57:39.996814+00', '2026-08-02 08:57:39.996814+00', '📝', 'Draft'),
	('33e17a11-9ea8-4584-8189-4bbdab5d1048', 'Data Structures in C++', 'PDF Notes', NULL, 'Detailed notes covering arrays, linked lists, trees, and graphs.', true, false, false, 0, '2026-08-02 08:57:39.996814+00', '2026-08-02 08:57:39.996814+00', '📓', 'Draft'),
	('72d81e92-6446-488d-8b2a-1458c0f75231', 'Modern Resume Template', 'Templates', NULL, 'A clean, ATS-friendly resume template for software engineers.', true, false, false, 0, '2026-08-02 08:57:39.996814+00', '2026-08-02 08:57:39.996814+00', '📄', 'Draft'),
	('918350fa-92eb-4850-a5d1-5bf271badfec', 'Project Proposal Template', 'Templates', NULL, 'Standard template for submitting university project proposals.', true, false, false, 0, '2026-08-02 08:57:39.996814+00', '2026-08-02 08:57:39.996814+00', '📋', 'Draft'),
	('f74097d3-6de7-43d9-a0ad-66c7fa8e5101', 'GATE CS 2024 Question Paper', 'Previous Year Papers', NULL, 'Official question paper with detailed solutions.', true, false, false, 0, '2026-08-02 08:57:39.996814+00', '2026-08-02 08:57:39.996814+00', '📖', 'Draft'),
	('6b31a9b9-c819-4ffb-9779-a7cac8f9c354', 'TCS NQT Coding Questions 2023', 'Previous Year Papers', NULL, 'Collection of frequently asked programming questions in TCS NQT.', true, false, false, 0, '2026-08-02 08:57:39.996814+00', '2026-08-02 08:57:39.996814+00', '💻', 'Draft'),
	('862dca8c-d49d-4ce3-9c9f-31585fdaeb91', 'How to land your first Tech Internship', 'Career Guides', NULL, 'Step-by-step guide to applying and interviewing for tech internships.', true, false, false, 0, '2026-08-02 08:57:39.996814+00', '2026-08-02 08:57:39.996814+00', '🚀', 'Draft'),
	('b0dcb24f-8245-46ad-b508-ab62ba98d7b7', 'The Ultimate UI/UX Career Guide', 'Career Guides', NULL, 'Everything you need to know to become a product designer.', true, false, false, 0, '2026-08-02 08:57:39.996814+00', '2026-08-02 08:57:39.996814+00', '🎨', 'Draft'),
	('9567412b-8409-4077-9af5-9fc4e39f924a', 'Coolors - Color Palette Generator', 'Useful Websites', NULL, 'Generate perfect color palettes for your UI designs instantly.', true, false, false, 0, '2026-08-02 08:57:39.996814+00', '2026-08-02 08:57:39.996814+00', '🌐', 'Draft'),
	('11fac6d8-c6e4-4af1-972a-85d6d24d1951', 'Roadmap.sh', 'Useful Websites', NULL, 'Community driven roadmaps, articles and resources for developers.', true, false, false, 0, '2026-08-02 08:57:39.996814+00', '2026-08-02 08:57:39.996814+00', '🗺️', 'Draft'),
	('800497dc-3fd7-4e9d-98a5-f10cfd1f1105', 'Figma', 'Free Tools', NULL, 'The collaborative interface design tool.', true, false, false, 0, '2026-08-02 08:57:39.996814+00', '2026-08-02 08:57:39.996814+00', '🛠️', 'Draft'),
	('bd6538e5-5ec7-42e2-ba06-b0d8f25192f8', 'Notion Student Pack', 'Free Tools', NULL, 'Organize your entire student life with these free templates.', true, false, false, 0, '2026-08-02 08:57:39.996814+00', '2026-08-02 08:57:39.996814+00', '⚙️', 'Draft'),
	('857516e3-a4b8-479f-882c-fa2388b8faaf', 'Frontend Developer Roadmap 2024', 'Roadmaps', NULL, 'A complete path to becoming a modern frontend developer.', true, false, false, 0, '2026-08-02 08:57:39.996814+00', '2026-08-02 08:57:39.996814+00', '🛤️', 'Draft'),
	('edfb5f49-6da6-455b-8920-78385610a711', 'Data Science Learning Path', 'Roadmaps', NULL, 'Step-by-step guide to mastering Python, ML, and data engineering.', true, false, false, 0, '2026-08-02 08:57:39.996814+00', '2026-08-02 08:57:39.996814+00', '📊', 'Draft'),
	('9fd4fe46-656a-4670-8e1e-013384b6489b', '100 Days of Code Challenge Tracker', 'Study Materials', NULL, 'A printable tracker to keep you motivated during the 100 days of code.', true, false, false, 0, '2026-08-02 08:57:39.996814+00', '2026-08-02 08:57:39.996814+00', '📅', 'Draft'),
	('b3c097a2-f5a7-4de9-8143-42ef716ca25b', 'System Design Interview Prep', 'Study Materials', NULL, 'Curated links and videos for cracking system design interviews.', true, false, false, 0, '2026-08-02 08:57:39.996814+00', '2026-08-02 08:57:39.996814+00', '🏗️', 'Draft');


--
-- Data for Name: saved_items; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."saved_items" ("id", "user_id", "item_type", "item_id", "created_at") VALUES
	('9bd1fd36-d006-4c2f-92db-61acffbc3c35', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'post', 'eb7c348c-5e5d-4710-8404-0407eb98c1fb', '2026-08-10 08:20:28.321408+00');


--
-- Data for Name: scholarships; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."scholarships" ("id", "name", "description", "eligibility", "apply_url", "featured_month", "created_at", "status", "income_limit", "provider", "deadline", "amount", "scholarship_type", "state", "country", "education_level", "category", "funding_type", "deadline_date", "region") VALUES
	('498a574c-6ab7-4cd3-893c-058194f4f274', 'Chevening Scholarship', 'The UK Government''s flagship fully-funded scholarship covering a one-year Master''s degree at any UK university, including tuition, monthly stipend, and travel costs.', 'Indian citizens with a bachelor''s degree (min. UK upper-second-class/2:1 equivalent, ~60–65%), at least 2,800 hours of work experience, and an unconditional offer from an eligible UK Master''s course by July 2027.', 'https://www.chevening.org/apply/', '2026-08-01', '2026-08-01 13:02:48.157631+00', 'Live', NULL, 'UK Foreign, Commonwealth & Development Office (FCDO)', '2026-10-06', '£50,000+ (~₹63.8L+), fully funded', 'international', NULL, 'United Kingdom', NULL, NULL, NULL, '2026-10-06', NULL),
	('77d6b394-eaf0-4983-abc7-e03450d9eb7e', 'DAAD Study Scholarship for Graduates', 'Fully-funded Master''s scholarship in Germany covering a monthly stipend, travel allowance, and health/accident insurance. German public universities charge no tuition fees.', 'Graduates with a strong academic record, generally with relevant work experience, applying to an eligible Master''s program at a German university.', 'https://www.daad.de/en/study-and-research-in-germany/scholarships/', NULL, '2026-08-01 13:02:48.157631+00', 'Live', NULL, 'German Academic Exchange Service (DAAD)', '2026-10-15', '€992/month + travel & insurance', 'international', NULL, 'Germany', NULL, NULL, NULL, '2026-10-15', NULL),
	('26caab76-be29-4f46-b1d6-e57ee2f86893', 'AICTE Pragati Scholarship for Girls', 'Financial assistance for girl students admitted to the 1st or 2nd year (lateral entry) of an AICTE-approved technical degree or diploma course. Amount transferred directly via DBT.', 'Girl students in 1st/2nd year of an AICTE-approved technical degree/diploma course. Family income ≤ ₹8,00,000/year. Maximum 2 girls per family.', 'https://scholarships.gov.in', '2026-08-01', '2026-08-01 13:02:48.157631+00', 'Live', 800000, 'AICTE (Ministry of Education, Govt. of India)', '2026-10-31', '₹50,000/year', 'domestic', NULL, 'India', NULL, NULL, NULL, '2026-10-31', NULL),
	('53cd2d1a-bfa8-47be-9788-45e0c664ccf8', 'AICTE Saksham Scholarship for Differently-Abled Students', 'Financial assistance for differently-abled students admitted to AICTE-approved technical degree/diploma courses. Amount transferred directly via DBT.', 'Students with a minimum 40% disability (certified), admitted to 1st/2nd year (lateral entry) of an AICTE-approved technical degree/diploma course.', 'https://scholarships.gov.in', NULL, '2026-08-01 13:02:48.157631+00', 'Live', NULL, 'AICTE (Ministry of Education, Govt. of India)', '2026-10-31', '₹50,000/year', 'domestic', NULL, 'India', NULL, NULL, NULL, '2026-10-31', NULL),
	('9326f0a1-6c1d-4a2c-a64b-04c8dc20fe76', 'Azim Premji Scholarship (Girls'' UG Scholarship)', 'Support for girl students starting a first-year undergraduate degree or diploma course, part of Azim Premji Foundation''s education equity initiative. Applications open August 2026.', 'Girl students admitted to the 1st year of a recognized UG degree/diploma course (2–5 years) at a government or private college/university for academic session 2026–27, anywhere in India.', 'https://azimpremjifoundation.org', NULL, '2026-08-02 15:43:14.080159+00', 'Live', NULL, 'Azim Premji Foundation', NULL, 'Full tuition + financial support (varies)', 'domestic', NULL, 'India', NULL, NULL, NULL, NULL, 'All India'),
	('c7b27ae6-e910-4ed8-b0f8-1f4429744126', 'Central Sector Scheme of Scholarship (CSSS)', 'Merit-based scholarship for undergraduate and postgraduate students from economically weaker families, awarded based on Class 12 board performance.', 'Top 20th percentile in Class 12 board exams, enrolled in a regular UG/PG program. Family income ≤ ₹4.5 lakh/year. Cannot be combined with another major government scholarship.', 'https://scholarships.gov.in', NULL, '2026-08-01 13:02:48.157631+00', 'Live', 450000, 'Ministry of Education, Govt. of India (PM-USP)', '2026-12-31', '₹12,000–₹20,000/year', 'domestic', NULL, 'India', NULL, NULL, NULL, '2026-12-31', NULL),
	('e81ab8c9-e153-4e6c-ad39-89c7b2714d90', 'National Means-cum-Merit Scholarship (NMMS)', 'Central scholarship for Class 9–12 students from economically weaker sections, paid via DBT at ₹1,000/month.', 'Students who qualified the NMMSS 2026 exam (fresh registration, Class 9) or NMMSS 2025 (renewal to Class 10), enrolled in government/aided/local body schools. Family income ≤ ₹3.5 lakh/year.', 'https://scholarships.gov.in', NULL, '2026-08-02 15:43:14.080159+00', 'Live', 350000, 'Ministry of Education, Govt. of India (NSP)', '2026-08-31', '₹12,000/year (₹1,000/month)', 'domestic', NULL, 'India', NULL, NULL, NULL, '2026-08-31', 'All India'),
	('536aeb6c-9864-4b22-9f6e-0ef79dce96f3', 'Uttar Pradesh State Scholarship 2026-27', 'State government scholarship covering Pre-Matric (Class 9–10), Post-Matric (Class 11–12), and Post-Matric Other Than Intermediate students.', 'Permanent residents of Uttar Pradesh, enrolled in a recognized school/college/university from Class 9 through postgraduate level. General, SC, ST, OBC, and minority categories covered under separate scheme tracks.', 'https://scholarship.up.gov.in', NULL, '2026-08-02 15:43:14.080159+00', 'Live', NULL, 'Social Welfare Department, Govt. of Uttar Pradesh', '2026-09-21', 'Varies by scheme and category', 'domestic', 'Uttar Pradesh', 'India', NULL, NULL, NULL, '2026-09-21', 'Uttar Pradesh (North India)'),
	('f0352785-2529-49b0-a0fb-8e2366087850', 'Tamil Nadu State Scholarships (via NSP)', 'State-level scholarships for Tamil Nadu students covering BC, MBC, DNC, SC, ST, minority, first-generation learner, differently-abled, and orphan categories, hosted through the National Scholarship Portal.', 'Permanent residents of Tamil Nadu enrolled in recognized schools/colleges; specific income and category criteria vary by individual scheme.', 'https://scholarships.gov.in', NULL, '2026-08-02 15:43:14.080159+00', 'Live', NULL, 'Govt. of Tamil Nadu / National Scholarship Portal', '2026-10-31', '₹500–₹20,000/year depending on scheme', 'domestic', 'Tamil Nadu', 'India', NULL, NULL, NULL, '2026-10-31', 'Tamil Nadu (South India)');


--
-- Data for Name: security_logs; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."security_logs" ("id", "user_id", "action", "description", "created_at") VALUES
	('4326f817-2d07-4336-83c2-a05d0c1a5c8f', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'password_change', 'User changed their password.', '2026-08-03 05:56:35.01804+00'),
	('76a53782-fe03-4ccd-86ef-6ea32a6cd54b', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'password_change', 'User changed their password.', '2026-08-03 05:57:05.573983+00');


--
-- Data for Name: subscriptions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."subscriptions" ("id", "user_id", "plan_name", "status", "current_period_end", "created_at", "updated_at") VALUES
	('4ebc6ca6-8438-45e8-9281-88e112808d41', '0f53f9b7-a987-43da-b70d-a49dd9170f09', 'Free', 'active', NULL, '2026-08-17 04:17:06.840344+00', '2026-08-17 04:17:06.840344+00'),
	('591b2bce-be23-49e3-ac8e-345fdb4e258b', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'Free', 'active', NULL, '2026-08-02 10:00:51.572299+00', '2026-08-02 10:00:51.572299+00'),
	('f17dff04-9c17-432f-b047-2014bdbe9a5c', '2b1734b5-4b93-4603-ba71-1a6120ccd502', 'Free', 'active', NULL, '2026-08-02 13:13:37.930389+00', '2026-08-02 13:13:37.930389+00'),
	('f8687161-0eed-4262-aa97-c99757a56109', '4cc6de1f-4783-4946-aba7-91e4782d3818', 'Free', 'active', NULL, '2026-08-03 06:21:42.737747+00', '2026-08-03 06:21:42.737747+00');


--
-- Data for Name: support_tickets; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: testimonials; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_activity; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_badges; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_blocks; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_gamification; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_gamification" ("user_id", "points", "level", "badges", "updated_at") VALUES
	('0f53f9b7-a987-43da-b70d-a49dd9170f09', 50, 'Bronze', '{"Onboarding Explorer"}', '2026-08-17 04:17:06.840344+00'),
	('4cc6de1f-4783-4946-aba7-91e4782d3818', 1330, '4', '{"Onboarding Explorer","Profile Pioneer","Onboarding Achiever","Gig Pioneer","Network Builder"}', '2026-07-14 11:08:16.256878+00'),
	('2b1734b5-4b93-4603-ba71-1a6120ccd502', 965, '4', '{"Onboarding Explorer","Event Enroller","Gig Pioneer","Onboarding Achiever","Network Builder"}', '2026-07-13 09:36:21.969644+00');


--
-- Data for Name: user_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_preferences" ("user_id", "theme", "language", "timezone", "currency", "date_format", "homepage_default", "remember_sidebar_state", "compact_mode", "animations", "accessibility_mode", "font_size", "updated_at") VALUES
	('2b1734b5-4b93-4603-ba71-1a6120ccd502', 'system', 'English', 'Asia/Kolkata', 'INR', 'DD-MM-YYYY', 'dashboard', true, false, true, false, 'medium', '2026-08-02 10:00:51.572299+00'),
	('4cc6de1f-4783-4946-aba7-91e4782d3818', 'system', 'English', 'Asia/Kolkata', 'INR', 'DD-MM-YYYY', 'dashboard', false, false, true, false, 'medium', '2026-08-03 06:21:42.737747+00'),
	('0f53f9b7-a987-43da-b70d-a49dd9170f09', 'system', 'English', 'Asia/Kolkata', 'INR', 'DD-MM-YYYY', 'dashboard', true, false, true, false, 'medium', '2026-08-17 04:17:06.840344+00');


--
-- Data for Name: user_sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: xp_history; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") VALUES
	('event-images', 'event-images', NULL, '2026-07-13 09:47:38.523577+00', '2026-07-13 09:47:38.523577+00', true, false, NULL, NULL, NULL, 'STANDARD'),
	('job-cvs', 'job-cvs', NULL, '2026-07-14 21:57:21.368965+00', '2026-07-14 21:57:21.368965+00', false, false, NULL, NULL, NULL, 'STANDARD'),
	('post-images', 'post-images', NULL, '2026-07-19 18:02:36.815225+00', '2026-07-19 18:02:36.815225+00', true, false, NULL, NULL, NULL, 'STANDARD'),
	('message-attachments', 'message-attachments', NULL, '2026-07-13 09:47:38.523577+00', '2026-07-13 09:47:38.523577+00', false, false, NULL, NULL, NULL, 'STANDARD'),
	('event-banners', 'event-banners', NULL, '2026-08-01 14:30:33.725353+00', '2026-08-01 14:30:33.725353+00', true, false, NULL, NULL, NULL, 'STANDARD'),
	('certificates', 'certificates', NULL, '2026-08-01 14:30:33.725353+00', '2026-08-01 14:30:33.725353+00', false, false, NULL, NULL, NULL, 'STANDARD'),
	('content-images', 'content-images', NULL, '2026-08-01 18:45:09.462131+00', '2026-08-01 18:45:09.462131+00', true, false, NULL, NULL, NULL, 'STANDARD'),
	('profile-images', 'profile-images', NULL, '2026-08-02 10:00:51.572299+00', '2026-08-02 10:00:51.572299+00', true, false, NULL, NULL, NULL, 'STANDARD'),
	('profile-banners', 'profile-banners', NULL, '2026-08-02 10:00:51.572299+00', '2026-08-02 10:00:51.572299+00', true, false, NULL, NULL, NULL, 'STANDARD'),
	('post-attachments', 'post-attachments', NULL, '2026-08-02 15:45:05.682894+00', '2026-08-02 15:45:05.682894+00', true, false, NULL, NULL, NULL, 'STANDARD'),
	('voice-notes', 'voice-notes', NULL, '2026-08-02 15:45:05.682894+00', '2026-08-02 15:45:05.682894+00', true, false, NULL, NULL, NULL, 'STANDARD'),
	('gig-deliveries', 'gig-deliveries', NULL, '2026-08-13 21:16:41.774996+00', '2026-08-13 21:16:41.774996+00', false, false, 52428800, NULL, NULL, 'STANDARD'),
	('gig-delivery-previews', 'gig-delivery-previews', NULL, '2026-08-13 21:16:41.774996+00', '2026-08-13 21:16:41.774996+00', false, false, 5242880, NULL, NULL, 'STANDARD'),
	('proposal-attachments', 'proposal-attachments', NULL, '2026-08-14 18:02:56.567864+00', '2026-08-14 18:02:56.567864+00', false, false, 26214400, NULL, NULL, 'STANDARD'),
	('support-attachments', 'support-attachments', NULL, '2026-08-17 12:45:32.459025+00', '2026-08-17 12:45:32.459025+00', false, false, NULL, NULL, NULL, 'STANDARD');


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

INSERT INTO "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata") VALUES
	('53c8e2a0-f460-4554-806c-3735f7829997', 'job-cvs', 'cvs/1784103578620_Irfhan_AP_(1)_(1).pdf', '2b1734b5-4b93-4603-ba71-1a6120ccd502', '2026-07-15 08:19:38.489179+00', '2026-07-15 08:19:38.489179+00', '2026-07-15 08:19:38.489179+00', '{"eTag": "\"1d9aaae439efb5673d9bf414a7fb8bdf\"", "size": 123448, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-07-15T08:19:39.000Z", "contentLength": 123448, "httpStatusCode": 200}', '561a2742-29a2-444e-9a23-b974a8f715f2', '2b1734b5-4b93-4603-ba71-1a6120ccd502', '{}'),
	('daa342f2-d88b-41f3-aeed-ac0dfad1c1eb', 'message-attachments', 'messages/1784745281209_chaos_procreate_brushes_by_toutigoheo_dho05i9.jpg', '703697b4-1ec6-4f27-858f-85279545e34a', '2026-07-22 18:34:42.992281+00', '2026-07-22 18:34:42.992281+00', '2026-07-22 18:34:42.992281+00', '{"eTag": "\"443b2011c0bd1c13bbc83bec5cbce3cd\"", "size": 317013, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-22T18:34:43.000Z", "contentLength": 317013, "httpStatusCode": 200}', '54e4ecf2-248b-4d91-b8cc-87be906031da', '703697b4-1ec6-4f27-858f-85279545e34a', '{}'),
	('fc0c76aa-9465-47cf-a06e-adb063d1af41', 'post-images', '2b1734b5-4b93-4603-ba71-1a6120ccd502/1784748341137-botmooi.png', '2b1734b5-4b93-4603-ba71-1a6120ccd502', '2026-07-22 19:25:46.406245+00', '2026-07-22 19:25:46.406245+00', '2026-07-22 19:25:46.406245+00', '{"eTag": "\"cfd6e6cd2a66e329e4dac2cd713df566\"", "size": 2062209, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-07-22T19:25:47.000Z", "contentLength": 2062209, "httpStatusCode": 200}', '0340b904-b1db-412d-b6c3-851ede3446a0', '2b1734b5-4b93-4603-ba71-1a6120ccd502', '{}'),
	('1c02f076-bc78-4ef6-8938-6afa02eb3152', 'post-images', 'd0488197-d4b8-4469-bc1a-ce970ad7ff29/1785011795080-ou4lqd0.jpg', 'd0488197-d4b8-4469-bc1a-ce970ad7ff29', '2026-07-25 20:36:36.207515+00', '2026-07-25 20:36:36.207515+00', '2026-07-25 20:36:36.207515+00', '{"eTag": "\"d6a20fbc262d0f7527c5f33402094f0b\"", "size": 21190, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-25T20:36:37.000Z", "contentLength": 21190, "httpStatusCode": 200}', 'c1b77729-5002-4fb5-916d-8f61d93c1248', 'd0488197-d4b8-4469-bc1a-ce970ad7ff29', '{}'),
	('d0f7e794-528b-497f-a1c9-3032c6279167', 'message-attachments', 'messages/634aecd8-e610-44cf-bcb9-5d5edfaa9edd/1785258705557.jpeg', '634aecd8-e610-44cf-bcb9-5d5edfaa9edd', '2026-07-28 17:11:46.680594+00', '2026-07-28 17:11:46.680594+00', '2026-07-28 17:11:46.680594+00', '{"eTag": "\"eaaf91df09a06267828dad7b09a9ab56\"", "size": 201548, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-28T17:11:47.000Z", "contentLength": 201548, "httpStatusCode": 200}', '8dfc0c69-3fb1-4873-a4d2-2d12bf36cc5d', '634aecd8-e610-44cf-bcb9-5d5edfaa9edd', '{}'),
	('c0d535bc-4e39-4673-a64c-0a365626350f', 'message-attachments', '634aecd8-e610-44cf-bcb9-5d5edfaa9edd/1786180087295_logo4.png', '634aecd8-e610-44cf-bcb9-5d5edfaa9edd', '2026-08-08 09:08:08.034148+00', '2026-08-08 09:08:08.034148+00', '2026-08-08 09:08:08.034148+00', '{"eTag": "\"bd9a8c6c763172da75c743f6faac247a\"", "size": 54199, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-08-08T09:08:08.000Z", "contentLength": 54199, "httpStatusCode": 200}', 'd948aa9d-520a-4802-b84c-3ad48d6a4e6e', '634aecd8-e610-44cf-bcb9-5d5edfaa9edd', '{}'),
	('1bce741d-2b76-456e-a1e3-e1983ce4b323', 'profile-images', '634aecd8-e610-44cf-bcb9-5d5edfaa9edd/1786188153336_ChatGPT_Image_Aug_4,_2026,_12_51_36_AM.png', '634aecd8-e610-44cf-bcb9-5d5edfaa9edd', '2026-08-08 11:22:34.745558+00', '2026-08-08 11:22:34.745558+00', '2026-08-08 11:22:34.745558+00', '{"eTag": "\"5b1ec8cbf53ea381eadfd67cb51c5ae0\"", "size": 1818788, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-08-08T11:22:35.000Z", "contentLength": 1818788, "httpStatusCode": 200}', '51a44e7a-ac98-41bd-bdef-f7630ebcf9b8', '634aecd8-e610-44cf-bcb9-5d5edfaa9edd', '{}'),
	('ce3689d3-26e9-4963-84f1-dcce590b59a2', 'profile-banners', '634aecd8-e610-44cf-bcb9-5d5edfaa9edd/1786188162868_ChatGPT_Image_Aug_4,_2026,_12_45_10_AM.png', '634aecd8-e610-44cf-bcb9-5d5edfaa9edd', '2026-08-08 11:22:43.453432+00', '2026-08-08 11:22:43.453432+00', '2026-08-08 11:22:43.453432+00', '{"eTag": "\"15e38bd6aa99dfeddb422a636e7eee52\"", "size": 1797110, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-08-08T11:22:44.000Z", "contentLength": 1797110, "httpStatusCode": 200}', 'fc6f77b9-68c5-4f57-b86a-47165e519228', '634aecd8-e610-44cf-bcb9-5d5edfaa9edd', '{}'),
	('ef78ff82-156e-416d-ae8c-c973c2756b26', 'event-images', 'communities/1786626503461-psbfkgm.png', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-13 13:08:24.940054+00', '2026-08-13 13:08:24.940054+00', '2026-08-13 13:08:24.940054+00', '{"eTag": "\"25efac9cf72f57fe7fe3ffb14f772490\"", "size": 96476, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-08-13T13:08:25.000Z", "contentLength": 96476, "httpStatusCode": 200}', '2db17512-743d-4ad5-b328-00ebe6fd447b', '4cc6de1f-4783-4946-aba7-91e4782d3818', '{}'),
	('f2153efd-646e-4794-bfd1-56f3dbf97c2b', 'event-images', 'communities/1786626567443-njos7ha.png', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-13 13:09:29.499949+00', '2026-08-13 13:09:29.499949+00', '2026-08-13 13:09:29.499949+00', '{"eTag": "\"52971619d0a726bbd0daa83cfdc9c89c\"", "size": 488651, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-08-13T13:09:30.000Z", "contentLength": 488651, "httpStatusCode": 200}', '9ba7ecec-5f29-4992-9c38-4524773ab043', '4cc6de1f-4783-4946-aba7-91e4782d3818', '{}'),
	('b6159fc6-f9b9-4142-bf13-2c5cfc1f395d', 'event-images', 'events/1786626989210-d5gy8g1.png', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-13 13:16:30.902518+00', '2026-08-13 13:16:30.902518+00', '2026-08-13 13:16:30.902518+00', '{"eTag": "\"04ecc06e259e97c681cedf4177beba03\"", "size": 337493, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-08-13T13:16:31.000Z", "contentLength": 337493, "httpStatusCode": 200}', 'f4142793-638a-41e4-94e6-13d79a325126', '4cc6de1f-4783-4946-aba7-91e4782d3818', '{}'),
	('b8e48a2b-fd0b-40f6-8b27-d59ea2b8b8c4', 'gig-deliveries', '76c44a31-258a-48fe-8fdd-fe98953d9108/1786701410344_delivery-retest-photo.png', '634aecd8-e610-44cf-bcb9-5d5edfaa9edd', '2026-08-14 09:56:51.038412+00', '2026-08-14 09:56:51.038412+00', '2026-08-14 09:56:51.038412+00', '{"eTag": "\"223631f3c6ec261a2d69bdabfa19adff\"", "size": 569268, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-08-14T09:56:51.000Z", "contentLength": 569268, "httpStatusCode": 200}', '98fc4fb7-ed56-48e6-92a5-58342dcb95d2', '634aecd8-e610-44cf-bcb9-5d5edfaa9edd', '{}'),
	('429fae84-9649-4cd0-aed4-0464b1caa6d6', 'gig-delivery-previews', '76c44a31-258a-48fe-8fdd-fe98953d9108/1786701424585-preview.jpg', NULL, '2026-08-14 09:57:04.756751+00', '2026-08-14 09:57:04.756751+00', '2026-08-14 09:57:04.756751+00', '{"eTag": "\"ee787a026f18da248c4cd71bda349360\"", "size": 3544, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-14T09:57:05.000Z", "contentLength": 3544, "httpStatusCode": 200}', '2cc9a74c-9fa5-47f0-9ac9-fa82dd970bd2', NULL, '{}'),
	('268aec64-cd60-4db0-bd08-0690e0db5c3f', 'proposal-attachments', '2bc96481-bfb4-4f16-a586-c53b2989baab/1786731494980_portfolio_sample.png', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-14 18:18:16.143336+00', '2026-08-14 18:18:16.143336+00', '2026-08-14 18:18:16.143336+00', '{"eTag": "\"17e684846f77d167e23ed2cf1120dcfe\"", "size": 4216, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-08-14T18:18:17.000Z", "contentLength": 4216, "httpStatusCode": 200}', 'a4b4ff7e-4725-4872-a2f7-8e38ac1171d6', '4cc6de1f-4783-4946-aba7-91e4782d3818', '{}'),
	('18c38971-5445-4892-a6cc-818ff2841c65', 'proposal-attachments', 'e159140e-d57d-4ee8-8aa5-dbcf6c625904/1786741908750_portfolio_sample.png', '4cc6de1f-4783-4946-aba7-91e4782d3818', '2026-08-14 21:11:49.835043+00', '2026-08-14 21:11:49.835043+00', '2026-08-14 21:11:49.835043+00', '{"eTag": "\"ed686fbb5e85c7804995efebf13aca66\"", "size": 6155, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-08-14T21:11:50.000Z", "contentLength": 6155, "httpStatusCode": 200}', 'c7cb1dbc-3482-4b89-8a3e-c24dccb6b21d', '4cc6de1f-4783-4946-aba7-91e4782d3818', '{}'),
	('689ee350-48bf-412a-8517-7db22afba397', 'gig-deliveries', '1e75a3a4-e061-4412-8f96-1bbf8135319c/1786787893887_irfhan_mohd_has_shared_a_file_with_you.png', 'd6909fd9-6895-4277-8671-eaa6440ea2ad', '2026-08-15 09:58:14.528277+00', '2026-08-15 09:58:14.528277+00', '2026-08-15 09:58:14.528277+00', '{"eTag": "\"245933a487423ad0413a5167afa87f53\"", "size": 50537, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-08-15T09:58:15.000Z", "contentLength": 50537, "httpStatusCode": 200}', '2d823086-46b8-4647-9c22-a937fbb3a544', 'd6909fd9-6895-4277-8671-eaa6440ea2ad', '{}'),
	('e95429f0-3227-4684-9349-4295e0661dbe', 'gig-delivery-previews', '1e75a3a4-e061-4412-8f96-1bbf8135319c/1786787904517-preview.jpg', NULL, '2026-08-15 09:58:24.950832+00', '2026-08-15 09:58:24.950832+00', '2026-08-15 09:58:24.950832+00', '{"eTag": "\"1469f38ed90cf1dae8c3b4eb68041666\"", "size": 9697, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-15T09:58:25.000Z", "contentLength": 9697, "httpStatusCode": 200}', '984f4f47-c1ba-4383-b590-12872bd55e57', NULL, '{}');


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 629, true);


--
-- Name: support_ticket_number_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('"public"."support_ticket_number_seq"', 1002, true);


--
-- PostgreSQL database dump complete
--

-- \unrestrict 8PyQC6WJMKongVgcH496CVljdqHiErXAc66T1TogYOa0sjMtmjo7Mt2wselERcs

RESET ALL;
