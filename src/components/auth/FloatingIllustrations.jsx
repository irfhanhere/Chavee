import React from 'react';
import { motion } from 'framer-motion';

export function FloatingIllustrations() {
    return (
        <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
            {/* Student Profile Card */}
            <motion.div 
                animate={{ y: [0, -20, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                style={{ 
                    position: 'absolute', top: '15%', right: '-5%', width: '220px', height: '140px', 
                    background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)', 
                    borderRadius: '24px', border: '1px solid rgba(255,255,255,0.15)', 
                    transform: 'rotate(-5deg)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    display: 'flex', flexDirection: 'column', padding: '1.5rem', gap: '1rem'
                }} 
            >
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
                    <div>
                        <div style={{ width: '80px', height: '8px', borderRadius: '4px', background: 'rgba(255,255,255,0.3)', marginBottom: '6px' }} />
                        <div style={{ width: '50px', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.15)' }} />
                    </div>
                </div>
            </motion.div>

            {/* Analytics Graph Card */}
            <motion.div 
                animate={{ y: [0, 20, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                style={{ 
                    position: 'absolute', bottom: '15%', left: '-10%', width: '250px', height: '180px', 
                    background: 'rgba(16,185,129,0.15)', backdropFilter: 'blur(12px)', 
                    borderRadius: '24px', border: '1px solid rgba(255,255,255,0.1)', 
                    transform: 'rotate(10deg)', boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                    padding: '1.5rem', display: 'flex', alignItems: 'flex-end', gap: '0.5rem'
                }} 
            >
                <div style={{ flex: 1, height: '40%', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }} />
                <div style={{ flex: 1, height: '70%', background: 'rgba(255,255,255,0.3)', borderRadius: '4px' }} />
                <div style={{ flex: 1, height: '50%', background: 'rgba(255,255,255,0.2)', borderRadius: '4px' }} />
                <div style={{ flex: 1, height: '90%', background: 'rgba(255,255,255,0.4)', borderRadius: '4px' }} />
            </motion.div>

            {/* ID Badge Card */}
            <motion.div 
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                style={{ 
                    position: 'absolute', top: '50%', right: '15%', width: '120px', height: '160px', 
                    background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)', 
                    borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', 
                    transform: 'rotate(15deg)', boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: '1.5rem'
                }} 
            >
                <div style={{ width: '30px', height: '5px', borderRadius: '5px', background: 'rgba(255,255,255,0.2)', position: 'absolute', top: '10px' }} />
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(255,255,255,0.15)', marginBottom: '1rem' }} />
                <div style={{ width: '60px', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.2)', marginBottom: '6px' }} />
                <div style={{ width: '40px', height: '6px', borderRadius: '3px', background: 'rgba(255,255,255,0.1)' }} />
            </motion.div>

            {/* General large blur circles for gradient depth */}
            <div style={{ position: 'absolute', top: '20%', right: '-10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)', filter: 'blur(40px)', borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(16,185,129,0.3) 0%, transparent 70%)', filter: 'blur(40px)', borderRadius: '50%' }} />
        </div>
    );
}
