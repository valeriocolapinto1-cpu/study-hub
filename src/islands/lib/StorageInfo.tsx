/** @jsxImportSource preact */
/**
 * «I miei dati»: spazio occupato dai dati locali (localStorage), spazio totale del
 * sito stimato dal browser (corsi offline compresi), memoria persistente e data
 * dell'ultimo export. Si aggiorna dopo un export (area `global:backup`).
 */
import { useEffect, useState } from 'preact/hooks';
import { loadBackupState } from '../../engine/backup';
import { BACKUP_AREA, GLOBAL_SCOPE, subscribe, usageBytes } from '../../engine/storage';
import { t, type Lang } from './i18n';

/** Byte in forma leggibile (KB/MB/GB in base 1024, con la virgola italiana dove serve). */
export function formatBytes(n: number, lang: Lang): string {
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  const digits = i === 0 || v >= 100 ? 0 : 1;
  return `${v.toLocaleString(lang === 'en' ? 'en-US' : 'it-IT', { maximumFractionDigits: digits })} ${units[i]}`;
}

interface Info {
  local: number;
  estimate: { usage: number; quota: number } | null;
  persisted: boolean | null;
  lastExport: number | null;
}

export function StorageInfo({ lang }: { lang: Lang }) {
  const [info, setInfo] = useState<Info | null>(null);
  useEffect(() => {
    const load = async () => {
      const s = navigator.storage;
      const [estimate, persisted] = await Promise.all([
        s?.estimate?.().catch(() => null) ?? null,
        s?.persisted?.().catch(() => null) ?? null,
      ]);
      setInfo({
        local: usageBytes(),
        estimate:
          estimate && typeof estimate.usage === 'number' && typeof estimate.quota === 'number'
            ? { usage: estimate.usage, quota: estimate.quota }
            : null,
        persisted,
        lastExport: loadBackupState().lastExport ?? null,
      });
    };
    void load();
    return subscribe(GLOBAL_SCOPE, BACKUP_AREA, () => void load());
  }, []);
  if (!info) return null;
  const fmt = (n: number) => formatBytes(n, lang);
  return (
    <dl class="sh-dl" data-storage-info>
      <div>
        <dt>{t(lang, 'sync.usage.local')}</dt>
        <dd>{fmt(info.local)}</dd>
      </div>
      {info.estimate && (
        <div>
          <dt>{t(lang, 'sync.usage.site')}</dt>
          <dd>
            {t(lang, 'sync.usage.ofQuota', {
              used: fmt(info.estimate.usage),
              quota: fmt(info.estimate.quota),
            })}
          </dd>
        </div>
      )}
      {info.persisted !== null && (
        <div>
          <dt>{t(lang, 'sync.usage.persisted')}</dt>
          <dd>{t(lang, info.persisted ? 'sync.usage.yes' : 'sync.usage.no')}</dd>
        </div>
      )}
      <div>
        <dt>{t(lang, 'sync.usage.lastExport')}</dt>
        <dd>
          {info.lastExport
            ? new Date(info.lastExport).toLocaleDateString(lang === 'en' ? 'en-US' : 'it-IT')
            : t(lang, 'sync.usage.never')}
        </dd>
      </div>
    </dl>
  );
}
