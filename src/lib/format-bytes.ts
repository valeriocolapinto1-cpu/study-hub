/** Dimensione leggibile (B, KB, MB, GB) con i separatori della lingua. */
export function formatBytes(bytes: number, lang: 'it' | 'en'): string {
  const nf = (n: number, d: number) =>
    n.toLocaleString(lang === 'it' ? 'it-IT' : 'en-GB', {
      maximumFractionDigits: d,
      minimumFractionDigits: 0,
    });
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${nf(bytes / 1024, 0)} KB`;
  if (bytes < 1024 ** 3) return `${nf(bytes / (1024 * 1024), 1)} MB`;
  return `${nf(bytes / 1024 ** 3, 1)} GB`;
}
