export function publicAsset(path, sha256) {
  const base = import.meta.env?.BASE_URL ?? '/';
  const version = sha256 ? `?sha256=${encodeURIComponent(sha256)}` : '';
  return `${base}${path.slice(1)}${version}`;
}
