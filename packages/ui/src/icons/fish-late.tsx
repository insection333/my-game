// The climb's fish (session 13), drawn as the march's are (fish.tsx): the Fen's moon carp and silver
// eel, the Peaks' ember char and dawn sturgeon. Each tier's skin steps from the moonlit and pale to the
// hot and the gold, as the metals do.
import { INK, Shape } from './style.tsx';
import { at, Fish, FISH, grill, spots, tf, tone } from './fish.tsx';

const LATE = {
  carp: tone('#f4f8ff', '#b8c8e6', '#6b7ea6'),
  carpFin: tone('#e4ecff', '#9db0d8', '#5d6f98'),
  eel: tone('#eef3f4', '#a9b7bc', '#5e6d73'),
  eelBack: tone('#7d8f96', '#4a5a61', '#2a363b'),
  char: tone('#7d6a70', '#4a3a40', '#271c21'),
  charBelly: tone('#ffd08a', '#ec6b2c', '#9b3013'),
  charFin: tone('#f59a6a', '#c04a26', '#74240f'),
  sturgeon: tone('#fff3cf', '#e2c983', '#a4873f'),
  sturgeonFin: tone('#e9d5a0', '#b99a55', '#7a6129'),
  cookedEel: tone('#f0c48a', '#b97a3c', '#76461c'),
  cookedChar: tone('#ffcf98', '#e48a4c', '#97481f'),
  cookedSturgeon: tone('#fbe2a6', '#d6a85a', '#916a2a'),
};

/** A carp's big scales: rows of small arcs over the flank. */
const scales = (stroke: string) => (
  <g fill="none" stroke={stroke} strokeWidth={0.9} opacity={0.75}>
    {[
      [16, 20],
      [22, 19],
      [28, 19.5],
      [34, 21],
      [19, 25],
      [25, 24.5],
      [31, 25],
      [16, 29.5],
      [22, 29.5],
      [28, 29.5],
    ].map(([x, y]) => (
      <path
        key={`${x},${y}`}
        d={tf(`M${x - 2.6} ${y - 1.6} C${x - 1} ${y + 1.6} ${x + 1} ${y + 1.6} ${x + 2.6} ${y - 1.6}`, 1.08)}
      />
    ))}
  </g>
);

/** A carp's barbels: two short whiskers at the mouth. */
const barbels = (colour: string) => (
  <g fill="none" stroke={colour} strokeWidth={1.2} strokeLinecap="round">
    <path d={tf('M4.5 26 C3 26.8 1.5 27.2 -0.5 28.6', 1.08)} />
    <path d={tf('M6 26.8 C5 28.4 3.6 29.4 1.6 30.6', 1.08)} />
  </g>
);

export const MoonCarp = () => (
  <Fish
    skin={LATE.carp}
    fin={LATE.carpFin}
    ky={1.08}
    marks={scales(LATE.carp.shadow)}
    head={barbels(LATE.carp.shadow)}
  />
);
export const CookedMoonCarp = () => (
  <Fish
    skin={FISH.cooked}
    fin={FISH.cookedFin}
    ky={1.08}
    marks={grill(1.08)}
    head={barbels(FISH.cooked.shadow)}
    cooked
  />
);

// The eel: a long body in an S, head low on the left and tail up on the right, its own shape.
const EEL =
  'M3.5 37.5 C3 34 6 31.5 10 31 C15 30.4 17.5 31 21 28.5 C25 25.5 25 20 29.5 16.5 C34 13 39 13 44.5 7 ' +
  'C45.5 9.5 44 13 41 15.5 C37 18.8 34 18.8 31.5 21.5 C28 25 28.5 31 23 34.5 C19 37 15 36 11 37 C8.5 37.6 6.5 39.5 3.5 37.5 Z';
const EEL_LIT =
  'M3.5 37.5 C3 34 6 31.5 10 31 C15 30.4 17.5 31 21 28.5 C25 25.5 25 20 29.5 16.5 C34 13 39 13 44.5 7 ' +
  'C40 11 36 14 32 18 C28.5 21.5 28 26.5 23.5 30.5 C19.5 33.5 14 32.5 10 33.5 C7 34.2 5 35.5 3.5 37.5 Z';
const EEL_SHADE =
  'M44.5 7 C45.5 9.5 44 13 41 15.5 C37 18.8 34 18.8 31.5 21.5 C28 25 28.5 31 23 34.5 C19 37 15 36 11 37 ' +
  'C8.5 37.6 6.5 39.5 3.5 37.5 C8 36 13 35.5 18 34 C24 31.5 25.5 25 29 21 C33 17 38 15.5 44.5 7 Z';

function Eel({ skin, back, cooked }: { skin: typeof LATE.eel; back?: typeof LATE.eel; cooked?: boolean }) {
  return (
    <g>
      {/* The fin running down the back. */}
      <path
        d="M12 30.6 C17 30 19 28 21.5 25.5 C24 22 25 18.5 28.5 15.2 C31 13 35 12 38.5 10.4"
        fill="none"
        stroke={INK}
        strokeWidth={4.2}
        strokeLinecap="round"
      />
      <path
        d="M12 30.6 C17 30 19 28 21.5 25.5 C24 22 25 18.5 28.5 15.2 C31 13 35 12 38.5 10.4"
        fill="none"
        stroke={(back ?? skin).base}
        strokeWidth={2}
        strokeLinecap="round"
      />
      <Shape d={EEL} tone={skin} lit={EEL_LIT} shade={EEL_SHADE}>
        {back && (
          <path
            d="M3.5 37.5 C3 34 6 31.5 10 31 C15 30.4 17.5 31 21 28.5 C25 25.5 25 20 29.5 16.5 C34 13 39 13 44.5 7 C38 12.5 34 15.5 30.5 18.5 C27 22 27 27 22.5 30.5 C18 33.5 13 32.5 9 33.6 C6.5 34.5 5 35.6 3.5 37.5 Z"
            fill={back.base}
          />
        )}
        {cooked && (
          <g stroke={skin.shadow} strokeWidth={2} strokeLinecap="round" opacity={0.85}>
            <path d="M15 30 L17.5 36" />
            <path d="M24 24 L28.5 28.5" />
            <path d="M32 15.5 L35.5 19.5" />
          </g>
        )}
      </Shape>
      <path d="M3.6 37.3 L6.6 37.2" stroke={INK} strokeWidth={1.1} strokeLinecap="round" />
      {cooked ? (
        <circle cx={7.6} cy={34.2} r={1.6} fill="#f3eee2" stroke={INK} strokeWidth={0.9} />
      ) : (
        <g>
          <circle cx={7.6} cy={34.2} r={2} fill={INK} />
          <circle cx={7.3} cy={34.2} r={1.1} fill="#e8d47a" />
          <circle cx={7} cy={33.7} r={0.5} fill="#ffffff" />
        </g>
      )}
    </g>
  );
}

export const SilverEel = () => <Eel skin={LATE.eel} back={LATE.eelBack} />;
export const CookedSilverEel = () => <Eel skin={LATE.cookedEel} cooked />;

/** An ember char: dark as cinders on the back, its belly glowing like a coal, with bright spots. */
export function EmberChar() {
  return (
    <Fish
      skin={LATE.char}
      fin={LATE.charFin}
      marks={
        <g>
          <path
            d={tf('M3 25 C10 28 20 29 30 28 C34 27.6 37 27 39.5 28.5 C37 31 33 33.5 27 34 C17 34.5 7 32 3 25 Z')}
            fill={LATE.charBelly.base}
          />
          <path d={tf('M8 27.5 C15 29.5 24 29.8 32 29 C24 31 15 31 8 29 Z')} fill={LATE.charBelly.light} />
          {spots(
            [
              [17, 19.5],
              [22, 18.5],
              [27, 19],
              [32, 20.5],
              [20, 22.5],
              [29, 23],
            ],
            LATE.charBelly.light,
            0.9,
          )}
        </g>
      }
    />
  );
}
export const CookedEmberChar = () => (
  <Fish skin={LATE.cookedChar} fin={FISH.cookedFin} marks={grill(1, LATE.cookedChar.shadow)} cooked />
);

/** A dawn sturgeon: long and armoured, a row of bony plates down its back and a pointed snout. */
const plates = (t: typeof LATE.sturgeon) => (
  <g>
    {[12, 17.5, 23, 28.5, 34].map((x) => {
      const pts = [at(x - 2.2, 19.6, 0.82), at(x, 17.6, 0.82), at(x + 2.2, 19.6, 0.82), at(x, 21.6, 0.82)];
      return (
        <path
          key={x}
          d={`M${pts.map((p) => p.join(' ')).join(' L')} Z`}
          fill={t.shadow}
          stroke={INK}
          strokeWidth={0.7}
          strokeLinejoin="round"
        />
      );
    })}
  </g>
);
const snout = (t: typeof LATE.sturgeon) => (
  <Shape d={tf('M7 21.5 L-3 24.8 L7 28.5 Z', 0.82)} tone={t} lit={tf('M7 21.5 L-3 24.8 L7 24.6 Z', 0.82)} />
);

export const DawnSturgeon = () => (
  <Fish
    skin={LATE.sturgeon}
    fin={LATE.sturgeonFin}
    ky={0.82}
    dorsal="M30 17 C33 13 37 14 39 19.5 Z"
    marks={plates(LATE.sturgeon)}
    head={snout(LATE.sturgeon)}
  />
);
export const CookedDawnSturgeon = () => (
  <Fish
    skin={LATE.cookedSturgeon}
    fin={FISH.cookedFin}
    ky={0.82}
    dorsal="M30 17 C33 13 37 14 39 19.5 Z"
    marks={grill(0.82, LATE.cookedSturgeon.shadow)}
    head={snout(LATE.cookedSturgeon)}
    cooked
  />
);
