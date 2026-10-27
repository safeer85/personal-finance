export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  const host = request.headers.get('host');
  if (!origin || !host) return false;
  try {
    const url = new URL(origin);
    // Next may use an internal localhost URL behind the public-facing server.
    // Browsers cannot forge Host, so compare the browser origin to that header.
    return origin === url.origin && ['http:', 'https:'].includes(url.protocol) && url.host === host.toLowerCase();
  } catch { return false; }
}
