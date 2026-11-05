import type { JSX } from 'preact';
import type { Trap } from '~/content/types';
import { Rich } from './Rich';

/**
 * Riquadro «convenzione di notazione».
 *
 * Si chiamava «Trappola», con accanto un badge «da verificare»: erano
 * impressioni su che cosa un esame reale premia o penalizza, e il badge
 * ammetteva che nessuno le avesse confermate. Tolta la provenienza restano
 * fatti sulla notazione, che non hanno bisogno di essere marcati come dubbi —
 * e che nessuno può prendere per una regola attribuita a qualcuno.
 */
export function TrapNote({ trap }: { trap: Trap }): JSX.Element {
  return (
    <div class="trap">
      <div class="tt">
        <span>{trap.title}</span>
      </div>
      <Rich html={trap.body} />
    </div>
  );
}
