export default {
  async fetch(request) {
    const url = new URL(request.url);

    let targetHost = null;

    if (url.pathname.startsWith("/gtag/js")) {
      targetHost = "https://www.googletagmanager.com";
    } else if (
      url.pathname.startsWith("/g/collect") ||
      url.pathname.startsWith("/mp/collect")
    ) {
      targetHost = "https://www.google-analytics.com";
    } else if (url.pathname.startsWith("/pagead/")) {
      targetHost = "https://googleads.g.doubleclick.net";
    }

    if (!targetHost) {
      return new Response("Not Found", { status: 404 });
    }

    const targetUrl = targetHost + url.pathname + url.search;

    return fetch(new Request(targetUrl, request));
  }
}
