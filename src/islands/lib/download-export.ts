/** Scarica un file JSON con l'esportazione completa dei dati locali (backup). */
import { buildExport, exportFileName } from '../../engine/exportImport';

export function downloadExport(): void {
  const blob = new Blob([JSON.stringify(buildExport(), null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = exportFileName();
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
