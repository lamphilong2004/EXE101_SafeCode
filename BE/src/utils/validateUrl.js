import net from "net";

function isIp(hostname) {
  return net.isIP(hostname) !== 0;
}

function isPrivateIp(ip) {
  // IPv4 private + loopback + link-local
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("127.")) return true;
  if (ip.startsWith("169.254.")) return true;
  if (ip.startsWith("192.168.")) return true;

  // 172.16.0.0 – 172.31.255.255
  const m = ip.match(/^172\.(\d+)\./);
  if (m) {
    const second = Number(m[1]);
    if (second >= 16 && second <= 31) return true;
  }

  return false;
}

export function validatePublicDemoUrl(urlString) {
  let url;
  try {
    url = new URL(urlString);
  } catch {
    return { ok: false, reason: "Invalid URL" };
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, reason: "Only http/https URLs allowed" };
  }

  const hostname = url.hostname.toLowerCase();

  if (hostname === "localhost" || hostname.endsWith(".localhost")) {
    return { ok: false, reason: "localhost not allowed" };
  }

  if (hostname.endsWith(".local")) {
    return { ok: false, reason: ".local not allowed" };
  }

  if (isIp(hostname) && isPrivateIp(hostname)) {
    return { ok: false, reason: "Private IPs not allowed" };
  }

  return { ok: true };
}
