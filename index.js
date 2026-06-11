export default {
  async fetch(request) {
    const url = new URL(request.url);

    let targetOrigin;

    // Google Tag
    if (url.pathname.startsWith("/gtag/js")) {
      targetOrigin = "https://www.googletagmanager.com";
    }

    // Google Analytics 4
    else if (
      url.pathname.startsWith("/g/collect") ||
      url.pathname.startsWith("/mp/collect")
    ) {
      targetOrigin = "https://www.google-analytics.com";
    }

    // Google Ads
    else if (url.pathname.startsWith("/pagead/")) {
      targetOrigin = "https://googleads.g.doubleclick.net";
    }

    // Route inconnue
    else {
      return new Response("Not Found", { status: 404 });
    }

    const targetUrl =
      targetOrigin +
      url.pathname +
      url.search;

    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers: request.headers,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : request.body,
      redirect: "follow"
    });

    return fetch(proxyRequest);
  }
};
