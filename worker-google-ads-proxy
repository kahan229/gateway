export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // 1. Si Tealium appelle le script gtag.js
    if (url.pathname.startsWith('/gtag/js')) {
      const targetUrl = 'https://www.googletagmanager.com' + url.pathname + url.search;
      return fetch(new Request(targetUrl, request));
    }

    // 2. Si Tealium envoie une conversion ou un signal publicitaire
    if (url.pathname.startsWith('/pagead/')) {
      const targetUrl = 'https://googleads.g.doubleclick.net' + url.pathname + url.search;
      return fetch(new Request(targetUrl, request));
    }

    // Si la requête ne correspond à rien, on renvoie une erreur propre
    return new Response('Not Found', { status: 404 });
  }
};
