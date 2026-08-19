import React from 'react';
import { Helmet } from 'react-helmet-async';

export const SITE_URL = 'https://chavee.in';

/**
 * breadcrumbSchema — real BreadcrumbList JSON-LD, matching a page's
 * actual visible breadcrumb UI (never invented for a page that doesn't
 * show one). `items` is [{ name, path }], in display order, path relative
 * (e.g. "/faq") — "/" is fine for the Home entry.
 */
/**
 * faqSchema — real FAQPage JSON-LD built directly from the actual loaded
 * FAQ rows (question=`title`, answer=`body`). Returns null when there are
 * no real published FAQs to describe yet, so callers never have to
 * remember to guard against an empty schema themselves.
 */
export function faqSchema(faqs) {
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

/**
 * jobPostingSchema — real JobPosting JSON-LD for a single live Careers
 * job-detail page. Caller must only invoke this for a real, currently
 * live job (status === 'live') — never for a closed role or an empty/
 * not-found state, per Google's Rich Results guidance against listing
 * expired postings.
 */
export function jobPostingSchema(job) {
    if (!job) return null;
    return {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: job.title,
        description: job.description || job.title,
        datePosted: job.created_at,
        ...(job.deadline ? { validThrough: job.deadline } : {}),
        employmentType: (job.job_type || 'FULL_TIME').toUpperCase().replace(/[\s-]+/g, '_'),
        hiringOrganization: {
            '@type': 'Organization',
            name: 'Chavee',
            sameAs: SITE_URL,
        },
        jobLocation: {
            '@type': 'Place',
            address: {
                '@type': 'PostalAddress',
                addressLocality: job.location && job.location.toLowerCase() !== 'remote' ? job.location : 'Calicut',
                addressRegion: 'Kerala',
                addressCountry: 'IN',
            },
        },
        ...(job.location?.toLowerCase() === 'remote' ? { jobLocationType: 'TELECOMMUTE' } : {}),
    };
}

export function breadcrumbSchema(items) {
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

/**
 * SEO — per-route <Helmet> block.
 *
 * Public pages: pass `path` (the real route path, e.g. "/about-us") to
 * get a real per-route canonical tag, plus title/description/OG tags.
 * Private/admin pages: pass `noindex` instead — used once each inside
 * AppShell.jsx/AdminShell.jsx rather than on every individual page, so
 * every route using those shells is covered without touching ~35
 * individual page files.
 *
 * `schema` accepts a single JSON-LD object or an array of them, rendered
 * as separate <script type="application/ld+json"> tags.
 */
export default function SEO({ title, description, keywords, path, noindex = false, schema = null }) {
    const url = path ? `${SITE_URL}${path}` : undefined;
    const schemaList = Array.isArray(schema) ? schema : (schema ? [schema] : []);

    return (
        <Helmet>
            {title && <title>{title}</title>}
            {description && <meta name="description" content={description} />}
            {keywords && <meta name="keywords" content={keywords} />}

            <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow'} />
            {!noindex && url && <link rel="canonical" href={url} />}

            {!noindex && title && <meta property="og:title" content={title} />}
            {!noindex && description && <meta property="og:description" content={description} />}
            {!noindex && url && <meta property="og:url" content={url} />}

            {!noindex && schemaList.map((s, i) => (
                <script key={i} type="application/ld+json">{JSON.stringify(s)}</script>
            ))}
        </Helmet>
    );
}
