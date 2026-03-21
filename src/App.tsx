import { useEffect, useRef, useState } from 'react';
import { SpaceRenderer } from './game/space-renderer';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<SpaceRenderer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!containerRef.current || rendererRef.current) return;
    const renderer = new SpaceRenderer(containerRef.current);
    rendererRef.current = renderer;
    renderer.init().then(() => setLoading(false));

    return () => {
      renderer.dispose();
      rendererRef.current = null;
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden', background: '#000' }}>
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 100, color: '#4488ff', fontSize: 24,
          fontFamily: 'monospace', background: '#000',
        }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚔️ GRUDGE SPACE RTS</div>
            <div>Loading assets...</div>
          </div>
        </div>
      )}
      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
    </div>
  );
}
