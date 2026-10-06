export async function onRequest({ request, env }) {
  if (!env.BACKEND_API_URL) {
    return new Response('The API origin is not configured.', { status: 503 });
  }

  let backendUrl;
  try {
    backendUrl = new URL(env.BACKEND_API_URL);
  } catch {
    return new Response('The API origin is invalid.', { status: 500 });
  }

  if (!['http:', 'https:'].includes(backendUrl.protocol)) {
    return new Response('The API origin must use HTTP or HTTPS.', { status: 500 });
  }

  const incomingUrl = new URL(request.url);
  const basePath = backendUrl.pathname.replace(/\/+$/, '');
  backendUrl.pathname = `${basePath}${incomingUrl.pathname}`;
  backendUrl.search = incomingUrl.search;

  return fetch(new Request(backendUrl, request));
}