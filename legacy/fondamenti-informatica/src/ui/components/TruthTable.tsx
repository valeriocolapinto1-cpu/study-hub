import type { JSX } from 'preact';

/**
 * Tabella di verità leggibile da screen reader: intestazioni con `scope`,
 * `<caption>` che dice cosa si sta guardando (nel prototipo mancavano) e
 * contenitore che scorre in orizzontale sui telefoni.
 */
export function TruthTable({
  vars,
  rows,
  caption,
}: {
  vars: string[];
  rows: { in: number[]; out: 0 | 1 | 'x' }[];
  caption: string;
}): JSX.Element {
  return (
    <div class="table-scroll">
      <table class="ttable">
        <caption>{caption}</caption>
        <thead>
          <tr>
            {vars.map((name) => (
              <th key={name} scope="col">
                {name}
              </th>
            ))}
            <th scope="col">Y</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {row.in.map((bit, position) => (
                <td key={position}>{bit}</td>
              ))}
              <td class="out">{row.out}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
