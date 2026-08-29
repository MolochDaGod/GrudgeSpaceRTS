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

## 4. Split vendor chunks by load wave

`manualChunks` does not create split points — `React.lazy` / `import()` do. The function only **groups** modules already in the graph.

Match **npm package names** under `node_modules` (pnpm-safe). Never `id.includes('rapier')`: that pulls `src/**/rapier*.ts` into a vendor chunk and creates circular chunk deps.

See `vite.config.ts` for the live `npmPkg` / `manualChunks` helpers. Summary:

| Chunk | Load wave | Why |
| --- | --- | --- |
| `react` | 0 — splash | Shared by `main` / `admin` / `info` |
| `three` + `r3f` | 1 — after click | Renderer; must not sit in splash |
| `rapier` | 2 — space/ground | Bindings stay with `@dimforge`, not with drei |
| `three-addons` | 1/3 — with renderer | One extra request beats five tiny ones |
| `audio` / `motion` | independent | Survive a renderer hotfix |

Do **not** dump all of `node_modules` into `vendor`. Vite dropped that default because it pulls Three onto the splash download.

## 5. Inspect the graph

Dev only — `vite-plugin-inspect` mounts at `/__inspect` while `npm run dev` is up. Confirm `IntroScreen` does not list `three` or `App` in its importers.

Production treemap (does not run on a normal `vite build`):

```bash
npm run analyze   # writes stats.html, gitignored
```

Open `stats.html` and check:

| Good | Bad |
| --- | --- |
| Entry `main` has **no** `three`, `rapier`, `postprocessing` | `three` inside the splash entry |
| `App-*.js` imports `three-*.js` + `r3f-*.js` | One `App` chunk > 1.2 MB |
| `rapier-*.js` only from space/ground modules | Cycle: circular chunk dependency |
| Three HTML entries share `react-*.js` | Separate React copies per HTML |

Pinned for Vite 6: `vite-plugin-inspect@0.8.9` (v12 needs Vite 8). Visualizer is `rollup-plugin-visualizer@7`.

## Rules

| Do | Don't |
| --- | --- |
| `lazy(() => import('./App'))` after splash | `import App from './App'` in the splash entry |
| `void import('./model-loader')` on idle | `import { warmupPlayPathLoaders } from './model-loader'` in `IntroScreen` |
| Preload logo.webp | Preload every GLB on `/` |
| One renderer tick after menu | Second physics world to hide a load hitch |
| `npm run analyze` when chunks look wrong | Ship `stats.html` or gzip plugins on Vercel |
| Match `npmPkg(id)` under `node_modules` | `id.includes('rapier')` or a catch-all `vendor` chunk |
