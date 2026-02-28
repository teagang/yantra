import type { Tile } from '@yantra/shared';

const COLOUR_MAP: Record<string, string> = {
  red: '#B88870',
  blue: '#789090',
  yellow: '#B8A068',
  purple: '#9888A0',
};

interface Props {
  tile: Tile;
  size: number;
  pending?: boolean;
  onClick?: () => void;
}

export function PlacedTile({ tile, size, pending = false, onClick }: Props) {
  const bg = tile.colour ? COLOUR_MAP[tile.colour] : tile.isEight ? '#707850' : '#C0B49A';
  const displayValue = tile.isBlank
    ? (tile.assignedValue ? String(tile.assignedValue) : '?')
    : String(tile.value);

  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        background: bg,
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: size * 0.45,
        color: '#fff',
        cursor: pending ? 'pointer' : 'default',
        boxShadow: pending
          ? `0 0 0 2px #F2EDD7, 0 2px 8px #3B281B44`
          : `0 1px 3px #3B281B33`,
        transform: pending ? 'scale(1.08)' : 'scale(1)',
        transition: 'transform 0.1s',
        userSelect: 'none',
        // Diamond shape via clip-path
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
      }}
    >
      {displayValue}
    </div>
  );
}
