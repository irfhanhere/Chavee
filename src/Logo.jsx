import React from 'react';

/**
 * ChaveeLogo — uses the real brand PNG.
 * Props:
 *   height      — pixel height (default 40)
 *   iconOnly    — show only the K-icon (no text, uses favicon.png)
 *   style       — extra inline styles on the wrapper
 */
export function ChaveeLogo({ height = 40, iconOnly = false, style = {} }) {
    const src = iconOnly ? '/favicon.png' : '/logo.png';

    return (
        <img
            src={src}
            alt="Chavee"
            style={{
                display: 'block',
                height: height,
                objectFit: 'contain',
                maxWidth: iconOnly ? height : height * 4.5,
                userSelect: 'none',
                ...style,
            }}
            onError={(e) => {
                // Fail-safe simple text fallback
                e.currentTarget.style.display = 'none';
                const textFallback = document.createElement('span');
                textFallback.style.fontFamily = 'Inter, sans-serif';
                textFallback.style.fontSize = `${height * 0.55}px`;
                textFallback.style.fontWeight = '900';
                textFallback.style.color = 'var(--peacock-green)';
                textFallback.style.letterSpacing = '0.5px';
                textFallback.innerText = iconOnly ? 'K' : 'CHAVEE';
                e.currentTarget.parentNode.insertBefore(textFallback, e.currentTarget);
            }}
        />
    );
}

export default ChaveeLogo;
