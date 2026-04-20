import React, { lazy, Suspense } from 'react';

// Only load the PWA reload prompt in production builds.
// In development, VitePWA plugin is disabled to avoid Service Worker caching issues.
const isProd = import.meta.env.PROD;

const PwaReloadPrompt = isProd
  ? lazy(() => import('./PwaReloadPromptInner'))
  : () => null;

export default function ReloadPrompt() {
  if (!isProd) return null;
  return (
    <Suspense fallback={null}>
      <PwaReloadPrompt />
    </Suspense>
  );
}
