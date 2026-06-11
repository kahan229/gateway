export default {
  async fetch(request) {
    const url = new URL(request.url);

    let targetOrigin = null;

    // GTAG library
    if (url.pathname.startsWith("/gtag/js")) {
      targetOrigin = "https://www.googletagmanager.com";
    }

    // GA4 collect endpoints
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

    if (!targetOrigin) {
      return new Response("Not Found", { status: 404 });
    }

    const targetUrl = targetOrigin + url.pathname + url.search;

    // IMPORTANT: rebuild headers safely
    const newHeaders = new Headers(request.headers);

    // Fix host (CRUCIAL)
    newHeaders.set("host", new URL(targetOrigin).host);

    const init = {
      method: request.method,
      headers: newHeaders,
      redirect: "follow"
    };

    // body only if needed
    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = request.body;
    }

    const response = await fetch(targetUrl, init);

    // optional: allow GA4 CORS stability
    const resHeaders = new Headers(response.headers);
    resHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: resHeaders
    });
  }
};
