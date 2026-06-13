export default {
  async fetch(request) {
    const url = new URL(request.url);
    let targetOrigin = null;

    // 1. Détection des routes
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
    // Fallback legacy
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

    // 2. Nettoyage du chemin
    const rewrittenPath = url.pathname.replace("/c7li", "");
    const targetUrl = targetOrigin + rewrittenPath + url.search;

    // 3. IMPORTANT : Transmettre les en-têtes de l'utilisateur réel
    const newHeaders = new Headers(request.headers);
    
    // On force l'hôte de destination
    newHeaders.set("host", new URL(targetOrigin).host);

    // RÉSOLUTION DU PROBLÈME : On récupère l'IP réelle vue par Cloudflare et on la passe à Google
    const clientIP = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for");
    if (clientIP) {
      newHeaders.set("X-Forwarded-For", clientIP);
    }

    const init = {
      method: request.method,
      headers: newHeaders,
      redirect: "follow",
    };

    // Transmission du body pour les requêtes POST (très fréquent en GA4)
    if (request.method !== "GET" && request.method !== "HEAD") {
      // Utilisez clone() pour éviter les erreurs de flux déjà lu
      init.body = await request.clone().arrayBuffer(); 
    }

    // 4. Envoi à Google
    const response = await fetch(targetUrl, init);

    // Logs de debug
    if (url.pathname.includes("/g/collect") || url.pathname.includes("/mp/collect")) {
      console.log(`[GA4] ${request.method} ${url.pathname} -> ${response.status}`);
    }

    // 5. Renvoi de la réponse au navigateur avec les en-têtes CORS
    const resHeaders = new Headers(response.headers);
    resHeaders.set("Access-Control-Allow-Origin", "*");

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: resHeaders,
    });
  },
};
