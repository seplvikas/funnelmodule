import { Router } from 'express';
import axios from 'axios';

const router = Router();
const legacyMainBackend = process.env.LEGACY_MAIN_BACKEND_URL || 'http://127.0.0.1:5001';
const funnelMode = (process.env.FUNNEL_MODE || 'compatibility-proxy').toLowerCase();
const allowProxyFallback = String(process.env.LEGACY_PROXY_FALLBACK || 'true').toLowerCase() === 'true';

async function proxyToLegacy(req: any, res: any, targetPath: string) {
  const response = await axios({
    method: req.method as any,
    url: `${legacyMainBackend}${targetPath}`,
    params: req.query,
    data: req.body,
    headers: {
      Authorization: req.headers.authorization || '',
      Cookie: req.headers.cookie || '',
      'Content-Type': 'application/json',
    },
    validateStatus: () => true,
  });

  return res.status(response.status).json(response.data);
}

// Proxy auth profile from legacy backend for standalone funnel RBAC.
router.get('/_auth/me', async (req, res) => {
  try {
    return await proxyToLegacy(req, res, '/api/auth/me');
  } catch (error) {
    return res.status(502).json({ error: 'Funnel auth upstream unavailable' });
  }
});

// Compatibility proxy during extraction phase.
// Keeps funnel working while backend logic is moved out from /api/sepl in main backend.
router.all('/*', async (req, res) => {
  try {
    if (funnelMode === 'standalone' && !allowProxyFallback) {
      return res.status(501).json({
        error: 'Standalone funnel mode enabled, but local funnel routes are not wired yet.',
      });
    }

    const path = req.path;
    return await proxyToLegacy(req, res, `/api/sepl${path}`);
  } catch (error) {
    res.status(502).json({ error: 'Funnel upstream unavailable' });
  }
});

export default router;
