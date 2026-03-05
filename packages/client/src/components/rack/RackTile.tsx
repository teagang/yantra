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
  selected?: boolean;
  selectedForSwap?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export function RackTile({
  tile,
  selected = false,
  selectedForSwap = false,
  disabled = false,
  onSelect,
  onDragStart,
  onDragEnd,
}: Props) {
  const { theme } = useTheme();
  const bg = tile.colour
    ? COLOUR_MAP[tile.colour]
    : tile.isEight
    ? '#707850'
    : '#C0B49A';

  const displayValue = tile.isBlank
    ? (tile.assignedValue ? String(tile.assignedValue) : '?')
    : String(tile.value);

  const transform = selected ? 'translateY(-8px) scale(1.1)' : selectedForSwap ? 'scale(0.9)' : 'scale(1)';
  const boxShadow = selected
    ? '0 4px 12px #3B281B55'
    : selectedForSwap
    ? '0 0 0 2px #A75B47'
    : '0 2px 4px #3B281B44';

  if (theme === 'classic') {
    const effectiveColour = tile.assignedColour ?? tile.colour;
    const effectiveValue = tile.assignedValue ?? tile.value;
    const sprite = getTileSprite(effectiveColour, effectiveValue, tile.isBlank, tile.isEight);

    return (
      <div
        draggable={!disabled}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onClick={disabled ? undefined : onSelect}
        style={{
          width: 44,
          height: 44,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.4 : 1,
          transform,
          transition: 'transform 0.15s',
          boxShadow,
          userSelect: 'none',
          flexShrink: 0,
          borderRadius: 4,
          overflow: 'hidden',
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
          }}
        />
      </div>
    );
  }

  return (
    <div
      draggable={!disabled}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={disabled ? undefined : onSelect}
      style={{
        width: 44,
        height: 44,
        background: disabled ? '#D6CEBC' : bg,
        borderRadius: 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 700,
        fontSize: 20,
        color: '#fff',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.4 : 1,
        transform,
        transition: 'transform 0.15s',
        boxShadow,
        userSelect: 'none',
        flexShrink: 0,
        // Diamond shape
        clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
      }}
    >
      {displayValue}
    </div>
  );
}
