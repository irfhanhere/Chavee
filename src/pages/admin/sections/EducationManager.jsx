import React from 'react';
import { Link } from 'react-router-dom';

export default function EducationManager() {
    const S = {
        page: { padding: '2rem 3rem' },
        h1: { margin: '0 0 1.5rem 0', fontSize: '1.75rem', fontWeight: 900, color: 'var(--text-primary)' },
        card: { background: 'var(--bg-surface)', padding: '2rem', borderRadius: 16, border: '1px solid var(--border-color)', marginBottom: '1.5rem', boxShadow: 'var(--shadow-sm)' },
        text: { color: 'var(--text-secondary)', fontSize: '1rem', lineHeight: 1.6, marginBottom: '2rem' },
        grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' },
        moduleCard: { 
            display: 'flex', flexDirection: 'column', gap: '0.75rem', 
            background: 'var(--bg-elevated)', padding: '1.5rem', borderRadius: 12, 
            border: '1px solid var(--border-color)', textDecoration: 'none', color: 'inherit',
            transition: 'transform 0.2s, box-shadow 0.2s' 
        },
        moduleIcon: { fontSize: '2rem' },
        moduleTitle: { margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' },
        moduleDesc: { margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' },
    };

    return (
        <div style={S.page}>
            <h1 style={S.h1}>Education Management 🎓</h1>
            
            <div style={S.card}>
                <p style={S.text}>
                    Welcome to the Education module. Here you can manage structured learning resources for students, 
                    including certified courses and scholarship opportunities. Choose a sub-module below to get started.
                </p>

                <div style={S.grid}>
                    <Link to="/admin/courses" style={S.moduleCard} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                        <div style={S.moduleIcon}>📚</div>
                        <h3 style={S.moduleTitle}>Courses Manager</h3>
                        <p style={S.moduleDesc}>Add, edit, and manage educational courses, modules, and lessons.</p>
                    </Link>

                    <Link to="/admin/scholarships" style={S.moduleCard} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                        <div style={S.moduleIcon}>🎓</div>
                        <h3 style={S.moduleTitle}>Scholarships Manager</h3>
                        <p style={S.moduleDesc}>Manage scholarship listings, deadlines, and eligibility criteria.</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
