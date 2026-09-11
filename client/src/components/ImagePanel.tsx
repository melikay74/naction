import { useState } from 'react';

interface ImagePanelProps {
  src: string;
  alt: string;
  /** Shown in the placeholder frame when the file has not been added yet. */
  placeholder: string;
  /**
   * The hero image is above the fold and should load at high priority; every
   * other panel is below it and defers until it is scrolled near.
   */
  priority?: boolean;
}

/**
 * Renders a photo, or a labelled placeholder frame if the file has not been
 * added yet. It fills its parent figure's aspect ratio, so the layout is already
 * correct before any photography arrives — and stays correct while a photo is
 * still downloading.
 */
export function ImagePanel({ src, alt, placeholder, priority = false }: ImagePanelProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <div className="image-slot">{placeholder}</div>;
  }

  return (
    <img
      src={src}
      alt={alt}
      // Matches the optimized output from scripts/optimize-images.sh. The CSS
      // still drives the displayed size; these give the browser the aspect
      // ratio up front so nothing shifts as the file arrives.
      width={1200}
      height={800}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      // Lowercase on purpose — see react-dom-attributes.d.ts.
      fetchpriority={priority ? 'high' : 'auto'}
      onError={() => setFailed(true)}
    />
  );
}
