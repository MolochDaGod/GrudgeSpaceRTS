/**
 * id.grudge-studio.com — Cloudflare Worker
 *
 * Architecture:
 *  - GET /           → serves the auth HTML directly from the edge (always up)
 *  - GET/POST /auth/* → proxies to api.grudge-studio.com (the real backend)
 *  - GET /health     → always returns 200 (for uptime monitors)
 *
 * Deploy:
 *   npx wrangler deploy --name grudge-id-auth
 *
 * Why this never goes down:
 *  - The HTML is embedded IN the Worker code — no origin server fetch
 *  - Cloudflare Workers run on 300+ edge locations globally
 *  - Even if the VPS backend is down, the page loads and shows a message
 */

const BACKEND_ORIGIN = 'https://api.grudge-studio.com';

// ── Auth HTML (embedded — no origin needed) ─────────────────────
const AUTH_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Grudge Studio — Sign In</title>
  <link rel="icon" href="https://assets.grudge-studio.com/ui/logo.webp" type="image/webp">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Rajdhani:wght@400;500;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      min-height: 100vh;
      background: #020408;
      color: #e0e8f0;
      font-family: 'Rajdhani', sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    /* Animated starfield bg */
    body::before {
      content: '';
      position: fixed;
      inset: 0;
      background:
        radial-gradient(1px 1px at 20% 30%, #4488ff33, transparent),
        radial-gradient(1px 1px at 40% 70%, #6688cc22, transparent),
        radial-gradient(1px 1px at 60% 20%, #4488ff33, transparent),
        radial-gradient(1px 1px at 80% 50%, #6688cc22, transparent),
        radial-gradient(2px 2px at 10% 80%, #4488ff44, transparent),
        radial-gradient(2px 2px at 90% 10%, #4488ff44, transparent);
      background-size: 300px 300px;
      animation: drift 60s linear infinite;
      z-index: 0;
    }
    @keyframes drift { to { background-position: 300px 300px; } }

    .auth-container {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 420px;
      padding: 2rem;
    }

    .auth-card {
      background: linear-gradient(135deg, #0a1428ee, #0d1b2aee);
      border: 1px solid #1a3a5c;
      border-radius: 12px;
      padding: 2.5rem 2rem;
      backdrop-filter: blur(20px);
      box-shadow: 0 0 40px #0044ff15, 0 0 80px #00000040;
    }

    .logo-area {
      text-align: center;
      margin-bottom: 1.5rem;
    }
    .logo-area img {
      width: 64px;
      height: 64px;
      border-radius: 12px;
      margin-bottom: 0.75rem;
    }
    .logo-area h1 {
      font-family: 'Orbitron', sans-serif;
      font-size: 1.4rem;
      font-weight: 900;
      color: #4488ff;
      letter-spacing: 2px;
      text-transform: uppercase;
    }
    .logo-area p {
      font-size: 0.95rem;
      color: #8899aa;
      margin-top: 0.25rem;
    }

    .divider {
      height: 1px;
      background: linear-gradient(90deg, transparent, #1a3a5c, transparent);
      margin: 1.5rem 0;
    }

    .btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      width: 100%;
      padding: 0.85rem 1.2rem;
      margin-bottom: 0.75rem;
      border: 1px solid #1a3a5c;
      border-radius: 8px;
      background: #0d1b2a;
      color: #e0e8f0;
      font-family: 'Rajdhani', sans-serif;
      font-size: 1.05rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      text-decoration: none;
    }
    .btn:hover {
      background: #132640;
      border-color: #2a5a8c;
      box-shadow: 0 0 15px #0044ff20;
      transform: translateY(-1px);
    }
    .btn:active { transform: translateY(0); }

    .btn-discord { border-color: #5865F2; }
    .btn-discord:hover { background: #5865F215; border-color: #7289DA; }
    .btn-google { border-color: #4285F4; }
    .btn-google:hover { background: #4285F415; border-color: #5a9cf4; }
    .btn-github { border-color: #6e7681; }
    .btn-github:hover { background: #6e768115; border-color: #8b949e; }

    .btn-guest {
      border-color: #2a3a4a;
      color: #6688aa;
      font-size: 0.95rem;
      margin-top: 0.5rem;
    }
    .btn-guest:hover { color: #88aacc; }

    .btn svg { width: 20px; height: 20px; flex-shrink: 0; }

    .status-bar {
      text-align: center;
      margin-top: 1rem;
      font-size: 0.85rem;
      color: #556677;
      min-height: 1.2rem;
    }
    .status-bar.error { color: #ff6666; }
    .status-bar.ok { color: #44cc88; }

    .footer {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.8rem;
      color: #334455;
    }
    .footer a { color: #4488ff; text-decoration: none; }
    .footer a:hover { text-decoration: underline; }

    /* Redirect param info */
    .redirect-info {
      text-align: center;
      font-size: 0.85rem;
      color: #556677;
      margin-bottom: 1rem;
    }
    .redirect-info strong { color: #88aacc; }
  </style>
</head>
<body>
  <div class="auth-container">
    <div class="auth-card">
      <div class="logo-area">
        <img src="https://assets.grudge-studio.com/ui/logo.webp"
             alt="Grudge Studio" onerror="this.style.display='none'">
        <h1>Grudge Studio</h1>
        <p>Sign in to continue</p>
      </div>

      <div id="redirect-info" class="redirect-info" style="display:none">
        Signing in for <strong id="redirect-app"></strong>
      </div>

      <div class="divider"></div>

      <button class="btn btn-discord" onclick="doLogin('discord')">
        <svg viewBox="0 0 24 24" fill="#5865F2"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
        Continue with Discord
      </button>

      <button class="btn btn-google" onclick="doLogin('google')">
        <svg viewBox="0 0 24 24" fill="#4285F4"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
        Continue with Google
      </button>

      <button class="btn btn-github" onclick="doLogin('github')">
        <svg viewBox="0 0 24 24" fill="#e0e8f0"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>
        Continue with GitHub
      </button>

      <div class="divider"></div>

      <button class="btn btn-guest" onclick="doGuest()">
        Continue as Guest
      </button>

      <div id="status" class="status-bar"></div>
    </div>

    <div class="footer">
      <p>&copy; Grudge Studio &mdash; Created by Racalvin The Pirate King</p>
      <p><a href="https://grudge-studio.com">grudge-studio.com</a></p>
    </div>
  </div>

  <script>
    const API = '${WORKER_SELF_URL}';

    // Parse redirect_uri from query string
    const params = new URLSearchParams(window.location.search);
    const redirectUri = params.get('redirect_uri') || params.get('redirect');
    if (redirectUri) {
      try {
        const host = new URL(decodeURIComponent(redirectUri)).hostname;
        document.getElementById('redirect-info').style.display = 'block';
        document.getElementById('redirect-app').textContent = host;
      } catch {}
    }

    function setStatus(msg, type) {
      const el = document.getElementById('status');
      el.textContent = msg;
      el.className = 'status-bar' + (type ? ' ' + type : '');
    }

    async function doLogin(provider) {
      setStatus('Connecting...', '');
      try {
        const ru = redirectUri ? '&redirect_uri=' + encodeURIComponent(redirectUri) : '';
        const res = await fetch('/auth/' + provider + '/start?redirect_uri=' +
          encodeURIComponent(redirectUri || window.location.origin), {
          redirect: 'manual'
        });

        // The backend returns { url } or redirects directly
        if (res.type === 'opaqueredirect' || res.status === 302) {
          window.location.href = res.headers.get('Location') || res.url;
          return;
        }

        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          setStatus('Login service temporarily unavailable. Try again in a moment.', 'error');
        }
      } catch (err) {
        setStatus('Backend offline — please try again in a few minutes.', 'error');
        console.error('[auth]', err);
      }
    }

    function doGuest() {
      // Redirect back with guest flag
      const target = redirectUri ? decodeURIComponent(redirectUri) : 'https://grudge-studio.com';
      window.location.href = target + (target.includes('?') ? '&' : '?') + 'guest=1';
    }

    // Auto-check backend health on load
    (async () => {
      try {
        const res = await fetch('/health', { signal: AbortSignal.timeout(5000) });
        if (res.ok) {
          setStatus('', 'ok');
        } else {
          setStatus('Services warming up...', '');
        }
      } catch {
        setStatus('Backend connecting — login may be briefly delayed.', '');
      }
    })();
  </script>
</body>
</html>`;

// ── Worker Fetch Handler ────────────────────────────────────────
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Health check — always 200
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'ok', edge: true }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Auth API routes → proxy to VPS backend
    if (url.pathname.startsWith('/auth/')) {
      return proxyToBackend(request, url);
    }

    // Everything else → serve the auth HTML
    const html = AUTH_HTML.replace('${WORKER_SELF_URL}', url.origin);
    return new Response(html, {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
        'Cache-Control': 'public, max-age=60, s-maxage=300',
        'X-Frame-Options': 'SAMEORIGIN',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  },
};

// ── Proxy auth requests to the real backend ──────────────────────
async function proxyToBackend(request, url) {
  const backendUrl = BACKEND_ORIGIN + url.pathname + url.search;

  try {
    const backendRes = await fetch(backendUrl, {
      method: request.method,
      headers: request.headers,
      body: request.method !== 'GET' ? request.body : undefined,
      redirect: 'manual', // Don't follow redirects — pass them through
    });

    // Clone response and add CORS headers
    const headers = new Headers(backendRes.headers);
    headers.set('Access-Control-Allow-Origin', '*');

    return new Response(backendRes.body, {
      status: backendRes.status,
      statusText: backendRes.statusText,
      headers,
    });
  } catch (err) {
    // Backend is down — return a friendly JSON error
    return new Response(
      JSON.stringify({
        error: 'backend_unavailable',
        message: 'Authentication service is temporarily offline. Please try again in a few minutes.',
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Retry-After': '30',
        },
      }
    );
  }
}
