export default {
  async fetch(request) {
    const url = new URL(request.url);

    let targetOrigin = null;

    // ----------------------------
    // Google Tag Gateway (/c7li)
    // ----------------------------
    if (url.pathname.startsWith("/c7li/gtag/js")) {
      targetOrigin = "https://www.googletagmanager.com";

    } else if (
      url.pathname.startsWith("/c7li/g/collect") ||
      url.pathname.startsWith("/c7li/mp/collect")
    ) {
      targetOrigin = "https://www.google-analytics.com";

    } else if (url.pathname.startsWith("/c7li/pagead/")) {
      targetOrigin = "https://googleads.g.doubleclick.net";
    }

    // ----------------------------
    // Fallback (optionnel legacy)
    // ----------------------------
    else if (url.pathname.startsWith("/gtag/js")) {
      targetOrigin = "https://www.googletagmanager.com";

    } else if (
      url.pathname.startsWith("/g/collect") ||
      url.pathname.startsWith("/mp/collect")
    ) {
      targetOrigin = "https://www.google-analytics.com";

    } else if (url.pathname.startsWith("/pagead/")) {
      targetOrigin = "https://googleads.g.doubleclick.net";
    }

    if (!targetOrigin) {
      return new Response("Not Found", { status: 404 });
    }

    // ----------------------------
    // IMPORTANT : remove /c7li
    // ----------------------------
    const rewrittenPath = url.pathname.replace("/c7li", "");

    const targetUrl = targetOrigin + rewrittenPath + url.search;

    const newHeaders = new Headers(request.headers);
    newHeaders.set("host", new URL(targetOrigin).host);

    const init = {
      method: request.method,
      headers: newHeaders,
      redirect: "follow",
    };

    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = request.body;
    }

    const response = await fetch(targetUrl, init);

    // Logs GA4 (debug utile)
    if (
      url.pathname.includes("/g/collect") ||
      url.pathname.includes("/mp/collect")
    ) {
      console.log(`[GA4] ${request.method} ${url.pathname} -> ${response.status}`);
    }

    const resHeaders = new Headers(response.headers);

    // CORS (important pour tags)
    resHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: resHeaders,
    });
  },
};
