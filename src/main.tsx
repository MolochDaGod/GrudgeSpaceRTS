import { lazy, Suspense, useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from './ErrorBoundary';
import { IntroScreen } from './game/IntroScreen';

// Keep splash off the space/ground graph. App + Three only download after click-through.
const App = lazy(() => import('./App'));

function shouldShowSplash(): boolean {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  if (params.has('skipIntro') || params.has('hub')) return false;
  return path === '/' || path === '';
}

function BootFallback() {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#000',
        pointerEvents: 'none',
      }}
    />
  );
}

function Root() {
  const [splash, setSplash] = useState(shouldShowSplash);

  const leaveSplash = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('skipIntro', '1');
    window.history.replaceState({ screen: 'menu' }, '', url);
    setSplash(false);
  }, []);

  if (splash) {
    return <IntroScreen onFinish={leaveSplash} />;
  }

  return (
    <Suspense fallback={<BootFallback />}>
      <App />
    </Suspense>
  );
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary onReset={() => window.location.reload()}>
    <Root />
  </ErrorBoundary>,
);
