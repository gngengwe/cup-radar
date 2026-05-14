import { useState } from 'react';

/**
 * ShareButton — uses native Web Share API with clipboard fallback.
 * Shows a brief "Copied!" toast after successful clipboard copy.
 */
export default function ShareButton({ title, text, url, className = '' }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareUrl = url || window.location.href;
    const shareText = text || document.title;

    if (navigator.share) {
      try {
        await navigator.share({ title: title || 'Cup Radar', text: shareText, url: shareUrl });
        return;
      } catch (e) {
        if (e.name === 'AbortError') return; // user dismissed
      }
    }

    // Fallback: copy link to clipboard
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <button
      className={`share-btn${className ? ` ${className}` : ''}`}
      onClick={handleShare}
      aria-label="Share this match"
      title="Share"
    >
      {copied ? '✓ Copied' : '↗ Share'}
    </button>
  );
}
