/** @jsxImportSource preact */
/**
 * Esporta/importa i dati locali: file JSON, QR (anche animato su più frame),
 * lettura da fotocamera (BarcodeDetector, altrimenti jsQR), foto del QR o
 * codice incollato. Le librerie QR sono caricate solo quando servono.
 */
import { useEffect, useRef, useState } from 'preact/hooks';
import {
  applyImport,
  buildExport,
  serializeExport,
  summarize,
  validateExport,
  type ExportFile,
  type ImportError,
} from '../engine/exportImport';
import { decodeFromCollector, decodePasted, encodeForQr, FrameCollector, matrixToSvg } from '../engine/qr';
import { isStorageAvailable } from '../engine/storage';
import { downloadExport } from './lib/download-export';
import { t, type Lang } from './lib/i18n';
import './islands.css';

export interface ExportImportProps {
  lang: Lang;
  /** Nomi leggibili dei corsi per l'anteprima (id → titolo). */
  courseTitles?: Record<string, string>;
}

type Panel = 'none' | 'show' | 'scan' | 'paste';

async function qrSvg(text: string, title: string): Promise<string> {
  const { default: qrcode } = await import('qrcode-generator');
  const qr = qrcode(0, 'L');
  qr.addData(text, 'Byte');
  qr.make();
  const size = qr.getModuleCount();
  return matrixToSvg({ size, isDark: (r, c) => qr.isDark(r, c) }, title);
}

interface Detector {
  detect(source: CanvasImageSource): Promise<Array<{ rawValue: string }>>;
}

async function makeDetector(): Promise<Detector> {
  const BD = (
    globalThis as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector & object }
  ).BarcodeDetector;
  if (BD) {
    try {
      return new BD({ formats: ['qr_code'] });
    } catch {
      /* formato non supportato: si usa jsQR */
    }
  }
  const { default: jsQR } = await import('jsqr');
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  return {
    async detect(source) {
      const w =
        (source as HTMLVideoElement).videoWidth ||
        (source as HTMLImageElement).naturalWidth ||
        (source as HTMLCanvasElement).width;
      const h =
        (source as HTMLVideoElement).videoHeight ||
        (source as HTMLImageElement).naturalHeight ||
        (source as HTMLCanvasElement).height;
      if (!w || !h) return [];
      const scale = Math.min(1, 1024 / Math.max(w, h));
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
      const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(img.data, img.width, img.height);
      return code ? [{ rawValue: code.data }] : [];
    },
  };
}

export default function ExportImport({ lang, courseTitles = {} }: ExportImportProps) {
  const [panel, setPanel] = useState<Panel>('none');
  const [pending, setPending] = useState<ExportFile | null>(null);
  const [message, setMessage] = useState<{ kind: 'success' | 'danger' | 'info'; text: string } | null>(null);
  const [available, setAvailable] = useState(true);
  useEffect(() => setAvailable(isStorageAvailable()), []);

  const fail = (e: ImportError | 'decode') =>
    setMessage({ kind: 'danger', text: t(lang, `sync.error.${e}`) });
  const accept = (text: string) => {
    const v = validateExport(text);
    if (!v.ok) return fail(v.error);
    setPending(v.file);
    setMessage(null);
    setPanel('none');
  };

  const download = downloadExport;

  const apply = (mode: 'merge' | 'replace') => {
    if (!pending) return;
    if (mode === 'replace' && !window.confirm(t(lang, 'sync.confirmReplace'))) return;
    const rep = applyImport(pending, mode);
    setPending(null);
    setMessage({ kind: 'success', text: t(lang, 'sync.done', { n: rep.written.length }) });
  };

  return (
    <section class="sh-sync" aria-labelledby="sh-sync-h">
      <h2 id="sh-sync-h">{t(lang, 'sync.title')}</h2>
      <p>{t(lang, 'sync.lead')}</p>
      {!available && <p class="sh-alert sh-alert--warning">{t(lang, 'engine.storageOff')}</p>}
      <div class="sh-actions">
        <button type="button" class="btn btn--primary" onClick={download}>
          {t(lang, 'sync.export')}
        </button>
        <label class="btn">
          {t(lang, 'sync.import')}
          <input
            type="file"
            accept="application/json,.json"
            class="sh-visually-hidden"
            onChange={async (e) => {
              const input = e.target as HTMLInputElement;
              const file = input.files?.[0];
              if (file) accept(await file.text());
              input.value = '';
            }}
          />
        </label>
        {(['show', 'scan', 'paste'] as const).map((p) => (
          <button
            type="button"
            key={p}
            class="btn"
            aria-expanded={panel === p}
            onClick={() => setPanel(panel === p ? 'none' : p)}
          >
            {t(lang, p === 'show' ? 'sync.showQr' : p === 'scan' ? 'sync.scanQr' : 'sync.paste')}
          </button>
        ))}
      </div>

      <div role="status" aria-live="polite">
        {message && <p class={`sh-alert sh-alert--${message.kind}`}>{message.text}</p>}
      </div>

      {panel === 'show' && <QrShow lang={lang} />}
      {panel === 'scan' && <QrScan lang={lang} onText={accept} onError={() => fail('decode')} />}
      {panel === 'paste' && <Paste lang={lang} onText={accept} onError={() => fail('decode')} />}

      {pending && (
        <div class="sh-card sh-preview">
          <h3>{t(lang, 'sync.preview')}</h3>
          {pending.exportedAt && (
            <p class="sh-muted">
              {t(lang, 'sync.exportedAt', {
                date: new Date(pending.exportedAt).toLocaleString(lang === 'it' ? 'it-IT' : 'en-GB'),
              })}
            </p>
          )}
          <ul>
            {Object.entries(summarize(pending)).map(([scope, areas]) => (
              <li key={scope}>
                <strong>
                  {scope === 'global' ? t(lang, 'notes.general') : (courseTitles[scope] ?? scope)}
                </strong>
                :{' '}
                {areas
                  .map((a) =>
                    t(lang, `sync.area.${a}`) === `sync.area.${a}` ? a : t(lang, `sync.area.${a}`),
                  )
                  .join(', ')}
              </li>
            ))}
          </ul>
          <div class="sh-actions">
            <button type="button" class="btn btn--primary" onClick={() => apply('merge')}>
              {t(lang, 'sync.merge')}
            </button>
            <button type="button" class="btn" onClick={() => apply('replace')}>
              {t(lang, 'sync.replace')}
            </button>
            <button type="button" class="btn btn--ghost" onClick={() => setPending(null)}>
              {t(lang, 'engine.cancel')}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function QrShow({ lang }: { lang: Lang }) {
  const [frames, setFrames] = useState<string[] | null | undefined>(undefined);
  const [svgs, setSvgs] = useState<string[]>([]);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    let alive = true;
    void (async () => {
      const f = await encodeForQr(serializeExport(buildExport()));
      if (!alive) return;
      setFrames(f);
      if (f)
        setSvgs(
          await Promise.all(
            f.map((x, i) => qrSvg(x, t(lang, 'sync.qrFrames', { n: i + 1, total: f.length }))),
          ),
        );
    })();
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (!playing || svgs.length < 2) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % svgs.length), 900);
    return () => clearInterval(id);
  }, [playing, svgs.length]);

  if (frames === undefined) return <p class="sh-muted">{t(lang, 'engine.loading')}</p>;
  if (frames === null) return <p class="sh-alert sh-alert--warning">{t(lang, 'sync.qrTooBig')}</p>;
  return (
    <div class="sh-qr">
      {svgs[index] && <div class="sh-qr__code" dangerouslySetInnerHTML={{ __html: svgs[index]! }} />}
      <p aria-live="off">{t(lang, 'sync.qrFrames', { n: index + 1, total: frames.length })}</p>
      <div class="sh-actions">
        {frames.length > 1 && (
          <button type="button" class="btn" aria-pressed={!playing} onClick={() => setPlaying(!playing)}>
            {t(lang, playing ? 'sync.pause' : 'sync.play')}
          </button>
        )}
        <button
          type="button"
          class="btn btn--ghost"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(frames.join('\n'));
              setCopied(true);
            } catch {
              setCopied(false);
            }
          }}
        >
          {t(lang, 'sync.copyCode')}
        </button>
        <span role="status">{copied ? t(lang, 'sync.copied') : ''}</span>
      </div>
    </div>
  );
}

function QrScan({ lang, onText, onError }: { lang: Lang; onText: (s: string) => void; onError: () => void }) {
  const video = useRef<HTMLVideoElement>(null);
  const [active, setActive] = useState(false);
  const [progress, setProgress] = useState<{ n: number; total: number } | null>(null);
  const [camError, setCamError] = useState(false);
  const [noCode, setNoCode] = useState(false);
  const collector = useRef(new FrameCollector());
  const stream = useRef<MediaStream | null>(null);

  const feed = async (values: string[]) => {
    let changed = false;
    for (const v of values) changed = collector.current.add(v) || changed;
    if (changed) setProgress({ n: collector.current.received, total: collector.current.expected });
    if (collector.current.complete) {
      stop();
      try {
        const text = await decodeFromCollector(collector.current);
        if (text) onText(text);
        else onError();
      } catch {
        onError();
      }
      collector.current = new FrameCollector();
    }
  };

  const stop = () => {
    stream.current?.getTracks().forEach((tr) => tr.stop());
    stream.current = null;
    setActive(false);
  };
  useEffect(() => stop, []);

  const startCamera = async () => {
    setCamError(false);
    try {
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
      stream.current = s;
      setActive(true);
      const v = video.current!;
      v.srcObject = s;
      await v.play();
      const detector = await makeDetector();
      const loop = async () => {
        if (!stream.current) return;
        try {
          const codes = await detector.detect(v);
          await feed(codes.map((c) => c.rawValue));
        } catch {
          /* fotogramma non leggibile */
        }
        if (stream.current) setTimeout(loop, 150);
      };
      void loop();
    } catch {
      stop();
      setCamError(true);
    }
  };

  return (
    <div class="sh-qr">
      <div class="sh-actions">
        {active ? (
          <button type="button" class="btn" onClick={stop}>
            {t(lang, 'sync.stopCamera')}
          </button>
        ) : (
          <button type="button" class="btn btn--primary" onClick={startCamera}>
            {t(lang, 'sync.camera')}
          </button>
        )}
        <label class="btn">
          {t(lang, 'sync.uploadImage')}
          <input
            type="file"
            accept="image/*"
            class="sh-visually-hidden"
            onChange={async (e) => {
              const input = e.target as HTMLInputElement;
              const file = input.files?.[0];
              input.value = '';
              if (!file) return;
              const img = new Image();
              img.src = URL.createObjectURL(file);
              try {
                await img.decode();
                const codes = await (await makeDetector()).detect(img);
                setNoCode(codes.length === 0);
                await feed(codes.map((c) => c.rawValue));
              } catch {
                setNoCode(true);
              } finally {
                URL.revokeObjectURL(img.src);
              }
            }}
          />
        </label>
      </div>
      <video
        ref={video}
        class="sh-qr__video"
        hidden={!active}
        muted
        playsInline
        aria-label={t(lang, 'sync.scanQr')}
      />
      <div role="status" aria-live="polite">
        {camError && <p class="sh-alert sh-alert--warning">{t(lang, 'sync.cameraError')}</p>}
        {noCode && <p class="sh-alert sh-alert--warning">{t(lang, 'sync.noQrFound')}</p>}
        {progress && <p>{t(lang, 'sync.scanned', { n: progress.n, total: progress.total })}</p>}
      </div>
    </div>
  );
}

function Paste({ lang, onText, onError }: { lang: Lang; onText: (s: string) => void; onError: () => void }) {
  const [text, setText] = useState('');
  return (
    <form
      class="sh-form"
      onSubmit={async (e) => {
        e.preventDefault();
        try {
          const out = await decodePasted(text);
          if (out) onText(out);
          else onError();
        } catch {
          onError();
        }
      }}
    >
      <label class="sh-field">
        <span>{t(lang, 'sync.pasteLabel')}</span>
        <textarea
          class="sh-input"
          rows={5}
          value={text}
          onInput={(e) => setText((e.target as HTMLTextAreaElement).value)}
          spellcheck={false}
        />
      </label>
      <div class="sh-actions">
        <button type="submit" class="btn btn--primary" disabled={!text.trim()}>
          {t(lang, 'sync.pasteApply')}
        </button>
      </div>
    </form>
  );
}
