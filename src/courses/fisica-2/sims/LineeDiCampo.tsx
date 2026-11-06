/**
 * Simulazione: campo elettrico di cariche puntiformi e campo magnetico di fili rettilinei,
 * con frecce e linee di campo (kit src/sim: VectorField, field.ts). Configurazioni della teoria:
 * carica isolata, dipolo, cariche uguali, due fili con correnti concordi o discordi.
 */
import { useMemo, useState } from 'preact/hooks';
import { pointSourcesField, wiresMagneticField, type PointSource } from '../../../sim/field';
import { Slider } from '../../../sim/Slider';
import { VectorField } from '../../../sim/VectorField';
import { formatNumber, type Lang } from '../../../sim/units';
import '../../../sim/sim.css';

type Preset = 'singola' | 'dipolo' | 'uguali' | 'fili-concordi' | 'fili-discordi';
const T = {
  it: {
    title: 'Linee di campo',
    preset: 'Configurazione',
    presets: {
      singola: 'Carica isolata',
      dipolo: 'Dipolo elettrico (+q, −q)',
      uguali: 'Due cariche uguali',
      'fili-concordi': 'Due fili, correnti concordi',
      'fili-discordi': 'Due fili, correnti discordi',
    } as Record<Preset, string>,
    ratio: 'Rapporto fra le due sorgenti',
    descE: 'Campo elettrico: le linee escono dalle cariche positive ed entrano in quelle negative; la loro densità indica l’intensità.',
    descB: 'Campo magnetico di due fili perpendicolari al piano: le linee sono chiuse attorno ai fili (∇·B = 0).',
    note: 'Con correnti concordi i fili si attraggono, con correnti discordi si respingono; nel dipolo il campo lontano decresce come 1/r³.',
  },
  en: {
    title: 'Field lines',
    preset: 'Configuration',
    presets: {
      singola: 'Single charge',
      dipolo: 'Electric dipole (+q, −q)',
      uguali: 'Two equal charges',
      'fili-concordi': 'Two wires, parallel currents',
      'fili-discordi': 'Two wires, opposite currents',
    } as Record<Preset, string>,
    ratio: 'Ratio between the two sources',
    descE: 'Electric field: lines leave positive charges and end on negative ones; their density shows the strength.',
    descB: 'Magnetic field of two wires perpendicular to the plane: the lines close around the wires (∇·B = 0).',
    note: 'With parallel currents the wires attract, with opposite currents they repel; for the dipole the far field falls off as 1/r³.',
  },
};

export default function LineeDiCampo({ lang }: { lang: Lang }): preact.JSX.Element {
  const t = T[lang];
  const [preset, setPreset] = useState<Preset>('dipolo');
  const [ratio, setRatio] = useState(1);
  const magnetic = preset.startsWith('fili');
  const sources: PointSource[] = useMemo(() => {
    if (preset === 'singola') return [{ x: 0, y: 0, q: 1 }];
    const sign = preset === 'dipolo' || preset === 'fili-discordi' ? -1 : 1;
    return [
      { x: -1, y: 0, q: 1 },
      { x: 1, y: 0, q: sign * ratio },
    ];
  }, [preset, ratio]);
  const field = useMemo(() => (magnetic ? wiresMagneticField(sources) : pointSourcesField(sources)), [sources, magnetic]);
  const bounds = useMemo(() => ({ xMin: -3, xMax: 3, yMin: -2, yMax: 2 }), []);
  const id = 'f2-sim-linee';
  return (
    <section class="sim" aria-labelledby={id}>
      <h3 class="sim__title" id={id}>
        {t.title}
      </h3>
      <div class="sim__panel">
        <label class="field">
          <span class="field__label">{t.preset}</span>
          <select class="select" value={preset} onChange={(e) => setPreset(e.currentTarget.value as Preset)}>
            {(Object.keys(t.presets) as Preset[]).map((p) => (
              <option value={p} key={p}>
                {t.presets[p]}
              </option>
            ))}
          </select>
        </label>
        {preset !== 'singola' && (
          <Slider
            lang={lang}
            label={t.ratio}
            value={ratio}
            min={0.25}
            max={3}
            step={0.25}
            format={(v) => formatNumber(v, 3, lang)}
            onInput={setRatio}
          />
        )}
      </div>
      <VectorField
        title={`${t.title}: ${t.presets[preset]}`}
        description={magnetic ? t.descB : t.descE}
        field={field}
        bounds={bounds}
        sources={sources}
        sourceStyle={magnetic ? 'wire' : 'charge'}
      />
      <p class="sim-note">{t.note}</p>
    </section>
  );
}
