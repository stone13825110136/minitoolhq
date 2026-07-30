/**
 * Whole-site 301: minitoolhq.com → selltoolhq.com (path + query preserved).
 * Runs on Cloudflare Pages for every request before static assets.
 */
const OLD_HOSTS = new Set(["minitoolhq.com", "www.minitoolhq.com"]);
const NEW_ORIGIN = "https://selltoolhq.com";

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const host = url.hostname.toLowerCase();

  if (OLD_HOSTS.has(host)) {
    const target = `${NEW_ORIGIN}${url.pathname}${url.search}`;
    return Response.redirect(target, 301);
  }

  return context.next();
}
