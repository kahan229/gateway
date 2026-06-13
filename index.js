var index_default = {
  async fetch(request) {
    const url = new URL(request.url);
    let targetOrigin = null;

    // 1. Gérer les requêtes de Preflight OPTIONS (Crucial pour éviter le Fetch Failed)
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
          "Access-Control-Allow-Headers": request.headers.get("Access-Control-Request-Headers") || "*",
          "Access-Control-Max-Age": "86400",
        },
      });
    }

    // 2. Détermination des destinations
    if (url.pathname.startsWith("/c7li/gtag/js")) {
      targetOrigin = "https://www.googletagmanager.com";
    } else if (url.pathname.startsWith("/c7li/g/collect") || url.pathname.startsWith("/c7li/mp/collect")) {
      targetOrigin = "https://www.google-analytics.com";
    } else if (url.pathname.startsWith("/c7li/pagead/")) {
      targetOrigin = "https://googleads.g.doubleclick.net";
    } else if (url.pathname.startsWith("/gtag/js")) {
      targetOrigin = "https://www.googletagmanager.com";
    } else if (url.pathname.startsWith("/g/collect") || url.pathname.startsWith("/mp/collect")) {
      targetOrigin = "https://www.google-analytics.com";
    } else if (url.pathname.startsWith("/pagead/")) {
      targetOrigin = "https://googleads.g.doubleclick.net";
    }

    if (!targetOrigin) {
      return new Response("Not Found", { status: 404 });
    }

    // 3. Reconstruction de l'URL
    const rewrittenPath = url.pathname.replace("/c7li", "");
    const targetUrl = targetOrigin + rewrittenPath + url.search;

    // 4. Duplication et enrichissement des en-têtes
    const newHeaders = new Headers(request.headers);
    newHeaders.set("host", new URL(targetOrigin).host);

    // Injection de l'IP utilisateur réel
    const clientIP = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for");
    if (clientIP) {
      newHeaders.set("X-Forwarded-For", clientIP);
    }

    const init = {
      method: request.method,
      headers: newHeaders,
      redirect: "follow"
    };

    // Lecture sécurisée du Body pour les requêtes POST
    if (request.method === "POST") {
      try {
        init.body = await request.arrayBuffer();
      } catch (e) {
        console.error("Erreur lors de la lecture du body:", e);
      }
    }

    // 5. Appel des serveurs Google
    try {
      const response = await fetch(targetUrl, init);

      if (url.pathname.includes("/g/collect") || url.pathname.includes("/mp/collect")) {
        console.log(`[GA4] ${request.method} ${url.pathname} -> ${response.status}`);
      }

      const responseBody = await response.arrayBuffer();
      const resHeaders = new Headers(response.headers);
      resHeaders.set("Access-Control-Allow-Origin", "*");

      return new Response(responseBody, {
        status: response.status,
        statusText: response.statusText,
        headers: resHeaders
      });

    } catch (fetchError) {
      console.error("Erreur Fetch vers Google:", fetchError);
      return new Response("Gateway Error", { status: 502 });
    }
  }
};

export { index_default as default };
