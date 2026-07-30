export interface Crumb {
  name: string;
  path: string;
}

function absoluteCrumbUrl(path: string, base: string): string {
  if (path === "/") return `${base}/`;
  // Hash-only guides hub (/#guides) → homepage for JSON-LD item URL
  const bare = (path.split("#")[0] || "/").replace(/\/$/, "") || "/";
  if (bare === "/") return `${base}/`;
  return `${base}${bare.startsWith("/") ? bare : `/${bare}`}`;
}

/** Build BreadcrumbList JSON-LD (paths without trailing slash). */
export function breadcrumbLd(crumbs: Crumb[], site = "https://selltoolhq.com") {
  const base = site.replace(/\/$/, "");
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteCrumbUrl(c.path, base),
    })),
  };
}
