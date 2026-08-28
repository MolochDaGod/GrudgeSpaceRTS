# Lazy loading — GRUDA ARMADA play path

Keep splash clickable. Do not statically import Three, Rapier, or `App` until the commander menu is needed.

## 1. Gate the game graph behind `React.lazy`

Splash paints from a tiny entry. `App` (space renderer, HUD, ground views) downloads **after** first click.

```tsx
import { lazy, Suspense, useCallback, useState } from 'react';
import { IntroScreen } from './game/IntroScreen';

const App = lazy(() => import('./App'));

function Root() {
  const [splash, setSplash] = useState(true);

  const leaveSplash = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('skipIntro', '1');
    window.history.replaceState({ screen: 'menu' }, '', url);
    setSplash(false);
  }, []);

  if (splash) return <IntroScreen onFinish={leaveSplash} />;

  return (
    <Suspense fallback={<div style={{ position: 'absolute', inset: 0, background: '#000' }} />}>
      <App />
    </Suspense>
  );
}
```

Named export from a heavy screen:

```tsx
const LazySpaceHUD = lazy(() =>
  import('./game/hud/SpaceHudV2').then((m) => ({ default: m.SpaceHudV2 })),
);
const LazyStarMap = lazy(() =>
  import('./game/space-starmap').then((m) => ({ default: m.StarMapOverlay })),
);
```

## 2. Dynamic import on idle (never on the splash module graph)

A **static** `import './model-loader'` pulls Three + Draco into the splash chunk. Warm after first paint:

```tsx
useEffect(() => {
  const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1));
  const id = idle(() => {
    void import('./model-loader').then((m) => m.warmupPlayPathLoaders());
  });
  return () => {
    if (typeof window.cancelIdleCallback === 'function') {
      window.cancelIdleCallback(id as number);
    }
  };
}, []);
```

On-demand GLB (user action, not boot):

```ts
export async function loadShip(path: string) {
  const { loadModel } = await import('./model-loader');
  return loadModel(path);
}
```

## 3. Preload the one asset splash actually needs

```html
<link rel="preload" as="image" href="/assets/space/ui/logo.webp" />
```

```tsx
<img
  src="/assets/space/ui/logo.webp"
  alt="GRUDA ARMADA"
  fetchPriority="high"
  decoding="async"
/>
```

Video under the logo stays `pointer-events: none` so the first click always leaves splash.

## 4. Split vendor chunks so a HUD click does not re-download Three

```ts
// vite.config.ts — build.rollupOptions.output.manualChunks
manualChunks(id) {
  if (id.includes('node_modules/three')) return 'three';
  if (id.includes('node_modules/@react-three')) return 'r3f';
  if (id.includes('rapier')) return 'rapier';
  if (id.includes('framer-motion')) return 'motion';
}
```

## Rules

| Do | Don't |
| --- | --- |
| `lazy(() => import('./App'))` after splash | `import App from './App'` in the splash entry |
| `void import('./model-loader')` on idle | `import { warmupPlayPathLoaders } from './model-loader'` in `IntroScreen` |
| Preload logo.webp | Preload every GLB on `/` |
| One renderer tick after menu | Second physics world to hide a load hitch |
