import type { JSX } from 'preact';

/**
 * Ciambella di avanzamento: una quota su un limite.
 *
 * È un **misuratore**, non una torta a due fette. La differenza non è
 * cosmetica: in una torta le due fette sono due categorie che competono per
 * l'attenzione, e «da studiare» non è una categoria — è ciò che manca. Qui
 * l'arco pieno è l'unico dato, e la pista sotto è lo **stesso colore
 * smorzato**, cioè il contenitore. L'occhio legge una cosa sola: quanto sei
 * arrivato.
 *
 * Il valore compare tre volte e mai col solo colore: al centro in cifra, sotto
 * per esteso («11 su 17») e nell'`aria-label` per chi ascolta.
 */
export function Gauge({
  percent,
  label,
  detail,
  hue,
}: {
  /** 0–100. */
  percent: number;
  label: string;
  /** Il conto per esteso, es. «11 su 17 moduli». */
  detail: string;
  hue: 'copper' | 'cyan';
}): JSX.Element {
  const value = Math.max(0, Math.min(100, Math.round(percent)));

  // Cerchio da 100 unità di circonferenza: la percentuale è direttamente la
  // lunghezza del tratto, senza conti da rifare a ogni render.
  const radius = 100 / (2 * Math.PI);
  const size = 2 * (radius + 6);

  return (
    <figure class={`gauge ${hue}`}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        class="gauge-svg"
        role="img"
        aria-label={`${label}: ${value} per cento — ${detail}`}
      >
        {/* La pista è il colore stesso smorzato: è il contenitore del dato,
            non un secondo dato. */}
        <circle class="gauge-track" cx={size / 2} cy={size / 2} r={radius} />
        {value > 0 && (
          <circle
            class="gauge-arc"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            /* Parte da mezzogiorno e gira in senso orario, come si legge un
               quadrante; l'estremità è arrotondata. */
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            stroke-dasharray={`${value} ${100 - value}`}
          />
        )}
        <text class="gauge-value" x={size / 2} y={size / 2} dy="0.36em">
          {value}
          <tspan class="gauge-unit">%</tspan>
        </text>
      </svg>
      <figcaption>
        <span class="gauge-label">{label}</span>
        <span class="gauge-detail">{detail}</span>
      </figcaption>
    </figure>
  );
}
