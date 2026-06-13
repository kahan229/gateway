var index_default = {
  async fetch(request) {
    const url = new URL(request.url);
    let targetOrigin = null;

    // 1. Détermination des destinations
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

    // 2. Reconstruction de l'URL de destination
    const rewrittenPath = url.pathname.replace("/c7li", "");
    const targetUrl = targetOrigin + rewrittenPath + url.search;

    // 3. Duplication et enrichissement des en-têtes
    const newHeaders = new Headers(request.headers);
    newHeaders.set("host", new URL(targetOrigin).host);

    // Injection de l'IP utilisateur réel pour éviter le rejet silencieux de GA4
    const clientIP = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for");
    if (clientIP) {
      newHeaders.set("X-Forwarded-For", clientIP);
    }

    const init = {
      method: request.method,
      headers: newHeaders,
      redirect: "follow"
    };

    // Gestion robuste du Body en mode POST pour GA4
    if (request.method !== "GET" && request.method !== "HEAD") {
      init.body = await request.clone().arrayBuffer();
    }

    // 4. Appel des serveurs Google
    const response = await fetch(targetUrl, init);

    // Logs de diagnostic dans la console Cloudflare
    if (url.pathname.includes("/g/collect") || url.pathname.includes("/mp/collect")) {
      console.log(`[GA4] ${request.method} ${url.pathname} -> ${response.status}`);
    }

    // 5. Extraction du corps de la réponse Google de manière sécurisée
    const responseBody = await response.arrayBuffer();

    // 6. Gestion des en-têtes de retour (CORS obligatoire)
    const resHeaders = new Headers(response.headers);
    resHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: resHeaders
    });
  }
};

export {
  index_default as default
};
