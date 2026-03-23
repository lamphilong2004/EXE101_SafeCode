import { createProxyMiddleware } from "http-proxy-middleware";

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

  return (req, res, next) => {
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
