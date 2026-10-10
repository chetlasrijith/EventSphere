export default {
  async fetch(request, env) {
    const requestUrl = new URL(request.url);

    if (requestUrl.pathname === '/api' || requestUrl.pathname.startsWith('/api/')) {
      if (!env.BACKEND_URL) {
        return Response.json({ detail: 'The backend URL is not configured.' }, { status: 503 });
      }

      let backendOrigin;
      try {
        backendOrigin = new URL(env.BACKEND_URL);
      } catch {
        return Response.json({ detail: 'The backend URL is invalid.' }, { status: 500 });
      }

      if (backendOrigin.protocol !== 'https:' && backendOrigin.hostname !== 'localhost') {
        return Response.json({ detail: 'The backend URL must use HTTPS.' }, { status: 500 });
      }

      const backendUrl = new URL(requestUrl.pathname + requestUrl.search, backendOrigin);
      return fetch(new Request(backendUrl, request));
    }

    return env.ASSETS.fetch(request);
  },
};