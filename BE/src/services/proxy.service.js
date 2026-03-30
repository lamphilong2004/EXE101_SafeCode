import { createProxyMiddleware } from "http-proxy-middleware";
import dns from "dns/promises";

// SSRF protection: block requests to private/internal IPs
const PRIVATE_IP_RANGES = [
  /^127\./,            // loopback
  /^10\./,             // class A private
  /^172\.(1[6-9]|2\d|3[01])\./,  // class B private
  /^192\.168\./,       // class C private
  /^169\.254\./,       // link-local
  /^0\./,              // unspecified
  /^::1$/,             // IPv6 loopback
  /^fc00:/i,           // IPv6 ULA
  /^fe80:/i,           // IPv6 link-local
];

function isPrivateIp(ip) {
  return PRIVATE_IP_RANGES.some(re => re.test(ip));
}

async function validateTargetUrl(targetUrl) {
  const url = new URL(targetUrl);
  const hostname = url.hostname;

  // Resolve DNS to check actual IP
  try {
    const addresses = await dns.resolve4(hostname);
    for (const addr of addresses) {
      if (isPrivateIp(addr)) {
        return { ok: false, reason: `Target resolves to private IP: ${addr}` };
      }
    }
  } catch {
    // If DNS fails, allow — the proxy will handle the connection error
  }

  return { ok: true };
}

export function proxyWithHardTimeout({ targetUrl, hardTimeoutMs = 60_000 }) {
  const proxy = createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    xfwd: true,
    ws: false,
    proxyTimeout: hardTimeoutMs,
    timeout: hardTimeoutMs,
    on: {
      proxyReq(proxyReq, req, res) {
        // Keep a reference so we can abort upstream on hard timeout.
        req.__upstreamProxyReq = proxyReq;

        // Never forward our auth headers upstream
        proxyReq.removeHeader("authorization");
        proxyReq.removeHeader("cookie");
      },
    },
  });

  return async (req, res, next) => {
    // SSRF check before proxying
    const ssrfCheck = await validateTargetUrl(targetUrl);
    if (!ssrfCheck.ok) {
      return res.status(403).json({ error: `Blocked: ${ssrfCheck.reason}` });
    }

    const timer = setTimeout(() => {
      try {
        if (req.__upstreamProxyReq?.destroy) req.__upstreamProxyReq.destroy();
        res.destroy();
        req.destroy();
      } catch {
        // ignore
      }
    }, hardTimeoutMs);

    res.on("close", () => clearTimeout(timer));
    res.on("finish", () => clearTimeout(timer));

    // Also set socket-level timeouts
    req.setTimeout(hardTimeoutMs);
    res.setTimeout(hardTimeoutMs);

    proxy(req, res, next);
  };
}
