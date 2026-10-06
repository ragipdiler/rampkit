/** Allow a domain-only input while preserving explicit protocols for server validation. */
export function websiteUrl(value: string): string {
  const trimmed = value.trim();
  return !trimmed || /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `https://${trimmed}`;
}
