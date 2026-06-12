export default {
async fetch(request) {
const url = new URL(request.url);


let targetOrigin = null;

if (url.pathname.startsWith("/gtag/js")) {
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

const targetUrl = targetOrigin + url.pathname + url.search;

const newHeaders = new Headers(request.headers);
newHeaders.set("host", new URL(targetOrigin).host);

const init = {
  method: request.method,
  headers: newHeaders,
  redirect: "follow"
};

if (
  request.method !== "GET" &&
  request.method !== "HEAD"
) {
  init.body = request.body;
}

const response = await fetch(targetUrl, init);

// Logs utiles pour GA4
if (
  url.pathname.startsWith("/g/collect") ||
  url.pathname.startsWith("/mp/collect")
) {
  console.log(
    `[GA4] ${request.method} ${url.pathname} -> ${response.status}`
  );
}

const resHeaders = new Headers(response.headers);
resHeaders.set("Access-Control-Allow-Origin", "*");

return new Response(response.body, {
  status: response.status,
  statusText: response.statusText,
  headers: resHeaders
});


}
};
