import { useCallback, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './ErrorBoundary';
import { IntroScreen } from './game/IntroScreen';

function shouldShowSplash(): boolean {
  const path = window.location.pathname;
  const params = new URLSearchParams(window.location.search);
  if (params.has('skipIntro') || params.has('hub')) return false;
  return path === '/' || path === '';
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

  return <App />;
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary onReset={() => window.location.reload()}>
    <Root />
  </ErrorBoundary>,
);
