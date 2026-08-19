#!/usr/bin/env node
/**
 * scripts/prerender.mjs
 *
 * Runs AFTER `vite build` (see package.json: "vite build && node
 * scripts/prerender.mjs"). Generates real static HTML files for the
 * public routes that benefit from non-JS crawlers / link-preview bots
 * (WhatsApp, Twitter, LinkedIn, etc.) seeing correct meta tags — those
 * bots never execute the client-side Helmet code, so they only ever see
 * whatever is physically in the HTML file on disk.
 *
 * Design, matching the earlier-approved investigation:
 *   - Reads dist/index.html as the template (only after vite build has
 *     already written it) and only INSERTS tags — never overwrites
 *     dist/'s JS/CSS.
 *   - Real per-route <title>/description/canonical/OG/JSON-LD, sourced
 *     from the exact same copy each page's own <SEO> component already
 *     uses (kept in sync by hand below — not fabricated, not duplicated
 *     content, just the same strings written once more for the
 *     no-JS-execution audience).
 *   - Flat "<route>.html" files (e.g. dist/about-us.html), matching the
 *     .htaccess strategy investigated earlier (a later, separate pass
 *     wires the rewrite rule — NOT touched by this script).
 *   - "/" is special-cased: it writes directly to dist/index.html itself
 *     in place, since that IS the real file already served for "/".
 *   - Dynamic /events/:id pages are generated per real live event
 *     (status != 'draft', same filter Events.jsx itself uses) — zero
 *     events today generates zero files, gracefully, not an error.
 *   - The whole script is non-fatal: any failure (Supabase unreachable,
 *     a bad query, a missing file) is caught, logged, and the process
 *     still exits 0 so `vite build`'s already-complete dist/ output is
 *     never at risk and the overall build command never fails because
 *     of this script.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const SITE_URL = 'https://chavee.in';

// ── Tiny .env reader — no new dependency for this one script. Only ever
// reads the two real Supabase keys already used client-side (the anon
// key is public by design, already shipped in the built JS bundle) —
// never reads or references the Cashfree keys that live in the same
// file. ──────────────────────────────────────────────────────────────
function loadEnv() {
    const envPath = join(ROOT, '.env');
    const env = {};
    if (!existsSync(envPath)) return env;
    const raw = readFileSync(envPath, 'utf-8');
    for (const line of raw.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eq = trimmed.indexOf('=');
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        if (key !== 'VITE_SUPABASE_URL' && key !== 'VITE_SUPABASE_ANON_KEY') continue;
        let value = trimmed.slice(eq + 1).trim();
        value = value.replace(/^["']|["']$/g, '');
        env[key] = value;
    }
    return env;
}

function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function escapeAttr(str) {
    return String(str).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ── Schema helpers — plain-JS equivalents of the same logic in
// src/components/SEO.jsx (can't import a React component into a Node
// script, so the *logic* is necessarily separate code — but every value
// they operate on is the same real data, nothing invented). ──────────
function breadcrumbSchema(items) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, i) => ({
            '@type': 'ListItem',
            position: i + 1,
            name: item.name,
            item: `${SITE_URL}${item.path}`,
        })),
    };
}

function faqSchema(faqs) {
    if (!faqs || faqs.length === 0) return null;
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f) => ({
            '@type': 'Question',
            name: f.title,
            acceptedAnswer: { '@type': 'Answer', text: f.body },
        })),
    };
}

function eventSchema(evt) {
    const isOnline = evt.mode === 'online' || evt.venue_type === 'online';
    return {
        '@context': 'https://schema.org',
        '@type': 'Event',
        name: evt.seo_title || evt.title,
        description: evt.seo_description || evt.description || evt.title,
        startDate: evt.event_date,
        ...(evt.end_date ? { endDate: evt.end_date } : {}),
        eventAttendanceMode: isOnline
            ? 'https://schema.org/OnlineEventAttendanceMode'
            : 'https://schema.org/OfflineEventAttendanceMode',
        eventStatus: 'https://schema.org/EventScheduled',
        location: isOnline
            ? { '@type': 'VirtualLocation', url: evt.meeting_link || SITE_URL }
            : { '@type': 'Place', name: evt.location || 'TBA', address: evt.address || evt.location || 'Kerala, India' },
        ...(evt.image_url || evt.thumbnail_url ? { image: evt.image_url || evt.thumbnail_url } : {}),
        organizer: { '@type': 'Organization', name: evt.host_name || 'Chavee', url: SITE_URL },
    };
}

// ── HTML generation ───────────────────────────────────────────────────
// Marker comments bound the injected block so a re-run against an
// already-prerendered file (e.g. "/" writes to the same dist/index.html
// it reads as its template) replaces the previous block instead of
// stacking a second copy on top of it — idempotent regardless of how
// many times this script runs against the same dist/ output. In the
// real, documented usage ("vite build && node scripts/prerender.mjs")
// this never actually matters, since vite build always writes a fresh
// index.html first — this is defensive robustness for any other way
// the script might get invoked.
const MARKER_START = '<!-- prerender:start -->';
const MARKER_END = '<!-- prerender:end -->';
const PRIOR_BLOCK_RE = new RegExp(`\\s*${MARKER_START}[\\s\\S]*?${MARKER_END}\\n?`, 'm');

function buildHtml(template, { title, description, path, schema = [] }) {
    const url = `${SITE_URL}${path}`;
    let html = template.replace(PRIOR_BLOCK_RE, '');
    html = html.replace(/<title>.*?<\/title>/s, `<title>${escapeHtml(title)}</title>`);

    const tags = [MARKER_START];
    tags.push(`<meta name="description" content="${escapeAttr(description)}" />`);
    tags.push(`<meta name="robots" content="index, follow" />`);
    tags.push(`<link rel="canonical" href="${escapeAttr(url)}" />`);
    tags.push(`<meta property="og:title" content="${escapeAttr(title)}" />`);
    tags.push(`<meta property="og:description" content="${escapeAttr(description)}" />`);
    tags.push(`<meta property="og:url" content="${escapeAttr(url)}" />`);
    for (const s of schema) {
        if (!s) continue;
        tags.push(`<script type="application/ld+json">${JSON.stringify(s)}</script>`);
    }
    tags.push(MARKER_END);

    html = html.replace('</head>', `    ${tags.join('\n    ')}\n  </head>`);
    return html;
}

function writeStaticPage(template, routePath, meta) {
    const html = buildHtml(template, { ...meta, path: routePath });
    const relPath = routePath === '/' ? 'index.html' : `${routePath.replace(/^\//, '')}.html`;
    const outPath = join(DIST, relPath);
    mkdirSync(dirname(outPath), { recursive: true });
    writeFileSync(outPath, html, 'utf-8');
    console.log(`[prerender] wrote dist/${relPath}`);
}

async function main() {
    if (!existsSync(DIST) || !existsSync(join(DIST, 'index.html'))) {
        console.warn('[prerender] dist/index.html not found — did `vite build` run first? Skipping prerender, nothing else touched.');
        return;
    }
    const template = readFileSync(join(DIST, 'index.html'), 'utf-8');

    const env = loadEnv();
    if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
        console.warn('[prerender] Supabase env vars not found — skipping the DB-dependent pages (FAQ schema, events). Static-copy pages will still be generated.');
    }
    const supabase = (env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY)
        ? createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
        : null;

    // ── 1. Static single pages — real copy, mirrored from each page's
    // own <SEO> component. ──────────────────────────────────────────
    writeStaticPage(template, '/', {
        title: "Chavee — India's First Student Social Platform | Learn Earn Network Belong",
        description: "Chavee is India's first student social networking platform. Learn languages, earn through gigs, find mentors, join communities and attend events. Free for all college students. Based in Kerala, growing across India.",
    });

    writeStaticPage(template, '/about-us', {
        title: "About Chavee | India's First Student-Focused Social Networking Platform",
        description: "Discover the story behind Chavee, India's first student-first social platform built in Kerala — connecting college students through mentorship, freelance gigs, language learning, and campus communities.",
    });

    writeStaticPage(template, '/careers', {
        title: 'Chavee Careers | Build the Future of Campus Life',
        description: "Join the Chavee team and help build India's first student-first social platform. Explore open roles across engineering, design, marketing, and operations.",
    });

    writeStaticPage(template, '/contact-us', {
        title: "Contact Chavee | Get in Touch with India's Student Social Platform",
        description: 'Have a question, feedback, or partnership inquiry? Reach out to the Chavee team directly.',
        schema: [breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Contact Us', path: '/contact-us' }])],
    });

    writeStaticPage(template, '/guidelines', {
        title: 'Community Guidelines | Chavee',
        description: "Chavee's community guidelines covering respectful conduct, content standards, harassment and spam policies, privacy, safe transactions, and how to report an issue.",
        schema: [breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Community Guidelines', path: '/guidelines' }])],
    });

    writeStaticPage(template, '/perks', {
        title: 'Student Perks | Chavee',
        description: 'Exclusive student discounts and perks on learning platforms, career tools, software, entertainment, wellness, and finance — free for Chavee students.',
        schema: [breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'Student Perks', path: '/perks' }])],
    });

    // FAQ needs the real live questions for FAQPage schema — same query
    // FAQ.jsx itself runs. Falls back to no FAQPage block (title/desc
    // still generated) if the query fails.
    let faqs = [];
    if (supabase) {
        try {
            const { data, error } = await supabase
                .from('content')
                .select('*')
                .eq('content_type', 'faq')
                .eq('status', 'published')
                .order('category', { ascending: true });
            if (error) throw error;
            faqs = data || [];
        } catch (err) {
            console.warn('[prerender] FAQ query failed, generating /faq without FAQPage schema:', err.message);
        }
    }
    writeStaticPage(template, '/faq', {
        title: 'FAQ | Chavee',
        description: 'Answers to common questions about Chavee — account setup, jobs and gigs, communities, events, learning, and safety and privacy.',
        schema: [
            breadcrumbSchema([{ name: 'Home', path: '/' }, { name: 'FAQ', path: '/faq' }]),
            faqSchema(faqs),
        ],
    });

    // ── 2. Blog listing — generic real meta. No per-post prerendering:
    // confirmed no /blog/:slug route exists (posts open in a client-
    // state modal on the same URL), so there is no real per-post URL to
    // attach a static file to. ──────────────────────────────────────
    writeStaticPage(template, '/blog', {
        title: 'Chavee Blog | Learn Earn Network Belong',
        description: 'Real stories, guides and updates from the Chavee student community — career advice, gig-economy tips, campus life, and platform news.',
    });

    // ── 3. Events listing + dynamic /events/:id per real live event.
    // "Live" = same filter Events.jsx itself uses (status != 'draft').
    // Real count today: 0 — the listing page still generates (real,
    // static copy), the per-event loop below just produces nothing,
    // gracefully, not an error. Needs re-verification once a real event
    // exists.  ─────────────────────────────────────────────────────
    writeStaticPage(template, '/events', {
        title: 'Student Events & Workshops | Chavee',
        description: 'Discover hackathons, webinars, meetups, and career events near you. Upgrade your skills and network with peers.',
    });

    if (supabase) {
        try {
            const { data: events, error } = await supabase
                .from('events')
                .select('*')
                .neq('status', 'draft')
                .order('event_date', { ascending: true });
            if (error) throw error;

            if (!events || events.length === 0) {
                console.log('[prerender] 0 real live events — no /events/:id pages generated (expected today).');
            } else {
                for (const evt of events) {
                    const slug = evt.slug || evt.id;
                    writeStaticPage(template, `/events/${slug}`, {
                        title: evt.seo_title || `${evt.title} | Chavee Events`,
                        description: evt.seo_description || evt.description || `${evt.title} — a real Chavee student event.`,
                        schema: [eventSchema(evt)],
                    });
                }
            }
        } catch (err) {
            console.warn('[prerender] Events query failed — /events listing was still generated, no per-event pages this run:', err.message);
        }
    } else {
        console.warn('[prerender] No Supabase client — skipping per-event pages.');
    }

    console.log('[prerender] done.');
}

main().catch((err) => {
    // Non-fatal by design: vite build's output is already complete and
    // on disk by the time this script runs, so a failure here must
    // never fail the overall `npm run build`.
    console.error('[prerender] failed, but this does not affect the vite build output already written to dist/:', err);
});
