import { useState } from 'react';
import AppPreview from './AppPreview';

/** Prefer .webm (Playwright); .mp4 works for manual recordings (e.g. QuickTime). */
const VIDEO_SOURCES = {
  dark: [
    { src: '/videos/dashboard-dark.webm', type: 'video/webm' },
    { src: '/videos/dashboard-dark.mp4', type: 'video/mp4' },
  ],
  light: [
    { src: '/videos/dashboard-light.webm', type: 'video/webm' },
    { src: '/videos/dashboard-light.mp4', type: 'video/mp4' },
  ],
};

/**
 * Phone frame content: video of the app (if present) or static preview.
 * Videos must be placed in public/videos/ — see docs/MARKETING-APP-VIDEO.md.
 */
export default function AppShowcasePhone({ variant = 'light' }) {
  const [videoFailed, setVideoFailed] = useState(false);
  const sources = VIDEO_SOURCES[variant];

  const useVideo = sources && !videoFailed;

  return (
    <>
      {useVideo && (
        <video
          autoPlay
          loop
          muted
          playsInline
          onError={() => setVideoFailed(true)}
          className="phone-screen-video"
          aria-hidden
        >
          {sources.map(({ src, type }) => (
            <source key={src} src={src} type={type} />
          ))}
          Your browser does not support the video tag.
        </video>
      )}
      {!useVideo && <AppPreview variant={variant} />}
    </>
  );
}
