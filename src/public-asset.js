export function publicAsset(path) {
  const base = import.meta.env?.BASE_URL ?? '/';
  return `${base}${path.slice(1)}`;
}
