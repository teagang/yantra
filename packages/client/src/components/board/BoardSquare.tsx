import type { BoardSquare as BoardSquareType, Tile } from '@yantra/shared';
import { PlacedTile } from './PlacedTile.js';

const SQUARE_COLOURS: Record<string, string> = {
  normal: '#D4CCBA',
  star: '#E8C46A66',
  'double-tile': '#6A8D5C55',
  'triple-tile': '#4D6A4288',
  'double-seq': '#C9907A55',
  'triple-seq': '#A0604888',
};

const SQUARE_LABELS: Record<string, string> = {
  star: '★',
  'double-tile': '2×',
  'triple-tile': '3×',
  'double-seq': 'D',
  'triple-seq': 'T',
};

const SQUARE_LABEL_COLOURS: Record<string, string> = {
  star: '#B07820',
  'double-tile': '#4D7A42',
  'triple-tile': '#2E5230',
  'double-seq': '#8E5A52',
  'triple-seq': '#7A3830',
};

interface Props {
  square: BoardSquareType;
  size: number;
  pendingTile?: Tile;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onTap?: () => void;
  onRecall?: () => void;
}

export function BoardSquareComponent({
  square,
  size,
  pendingTile,
  onDragOver,
  onDrop,
  onTap,
  onRecall,
}: Props) {
  const tile = pendingTile ?? square.placedTile;
  const bg = SQUARE_COLOURS[square.type] ?? SQUARE_COLOURS['normal'];
  const label = SQUARE_LABELS[square.type];
  const labelColour = SQUARE_LABEL_COLOURS[square.type];

  return (
    <div
      style={{
        width: size,
        height: size,
        background: tile ? 'transparent' : bg,
        border: tile ? 'none' : `1px solid #C8B89644`,
        borderRadius: 2,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: onTap && !tile ? 'pointer' : 'default',
        flexShrink: 0,
      }}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onClick={onTap}
    >
      {tile ? (
        <PlacedTile
          tile={tile}
          size={size - 2}
          pending={!!pendingTile}
          onClick={pendingTile ? onRecall : undefined}
        />
      ) : label ? (
        <span
          style={{
            fontSize: size * 0.28,
            fontWeight: 700,
            color: labelColour,
            userSelect: 'none',
          }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
