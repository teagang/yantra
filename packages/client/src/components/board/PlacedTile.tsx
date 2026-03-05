import type { Tile } from '@yantra/shared';
import { useTheme, getTileSprite } from '../../theme/ThemeContext.js';

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
  const { theme } = useTheme();
  const bg = tile.colour ? COLOUR_MAP[tile.colour] : tile.isEight ? '#707850' : '#C0B49A';
  const displayValue = tile.isBlank
    ? (tile.assignedValue ? String(tile.assignedValue) : '?')
    : String(tile.value);

  if (theme === 'classic') {
    const effectiveColour = tile.assignedColour ?? tile.colour;
    const effectiveValue = tile.assignedValue ?? tile.value;
    const sprite = getTileSprite(effectiveColour, effectiveValue, tile.isBlank, tile.isEight);

    return (
      <div
        onClick={onClick}
        style={{
          width: size,
          height: size,
          position: 'relative',
          cursor: pending ? 'pointer' : 'default',
          transform: pending ? 'scale(1.08)' : 'scale(1)',
          transition: 'transform 0.1s',
          userSelect: 'none',
        }}
      >
        <img
          src={sprite?.src}
          alt={displayValue}
          draggable={false}
          style={{
            width: '100%',
            height: '100%',
            display: 'block',
            filter: sprite?.filter,
            boxShadow: pending
              ? '0 0 0 2px #F2EDD7, 0 2px 8px #3B281B44'
              : '0 1px 3px #3B281B33',
            borderRadius: 3,
          }}
        />
      </div>
    );
  }

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
