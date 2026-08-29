import { lazy, Suspense, useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from './ErrorBoundary';
import { IntroScreen } from './game/IntroScreen';
import { PLAY_PATH_INTRO_TARGET, shouldShowSplash as splashFromLocation } from './game/play-path';

// Keep splash off the space/ground graph. App + Three only download after click-through.
const App = lazy(() => import('./App'));

function shouldShowSplash(): boolean {
  return splashFromLocation(window.location.pathname, window.location.search);
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
    if (PLAY_PATH_INTRO_TARGET.commanderSelectOpen) url.searchParams.set('commanderSelect', '1');
    window.history.replaceState({ screen: PLAY_PATH_INTRO_TARGET.screen }, '', url);
    setSplash(false);
    void import('./game/model-loader').then((m) => m.warmupPlayPathLoaders());
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
