var index_default = {
  async fetch(request) {
    const url = new URL(request.url);
    let targetOrigin = null;

    // 1. Gérer les requêtes de Preflight OPTIONS pour les requêtes POST (CORS)
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

    // 2. Détermination stricte des destinations Google
    if (url.pathname.includes("/gtag/js")) {
      targetOrigin = "https://www.googletagmanager.com";
    } else if (url.pathname.includes("/g/collect") || url.pathname.includes("/mp/collect")) {
      targetOrigin = "https://analytics.google.com";
    } else if (url.pathname.includes("/pagead/")) {
      targetOrigin = "https://googleads.g.doubleclick.net";
    }

    // Sécurité si le chemin ne correspond à rien
    if (!targetOrigin) {
      return new Response("Not Found", { status: 404 });
    }

    // 3. Nettoyage du préfixe /c7li pour reconstruire l'URL Google officielle
    const rewrittenPath = url.pathname.replace("/c7li", "");
    const targetUrl = targetOrigin + rewrittenPath + url.search;

    // 4. Préparation des en-têtes pour Google
    const newHeaders = new Headers(request.headers);
    newHeaders.set("host", new URL(targetOrigin).host);

    // Injection de la vraie IP de l'internaute
    const clientIP = request.headers.get("cf-connecting-ip") || request.headers.get("x-forwarded-for");
    if (clientIP) {
      newHeaders.set("X-Forwarded-For", clientIP);
    }

    const init = {
      method: request.method,
      headers: newHeaders,
      redirect: "follow"
    };

    // Récupération du body si c'est un envoi de données POST
    if (request.method === "POST") {
      try {
        init.body = await request.arrayBuffer();
      } catch (e) {
        console.error("Erreur lecture body POST:", e);
      }
    }

    // 5. Envoi de la requête à Google et récupération de la vraie réponse
    try {
      const response = await fetch(targetUrl, init);
      
      // On récupère le contenu de la réponse de Google (le script ou le pixel)
      const responseBody = await response.arrayBuffer();
      
      // On renvoie exactement ce que Google a répondu (200 pour le script, 204 pour la collecte)
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
