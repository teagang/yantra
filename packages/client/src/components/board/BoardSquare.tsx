import type { BoardSquare as BoardSquareType, Tile } from '@yantra/shared';
import { PlacedTile } from './PlacedTile.js';
import { useTheme } from '../../theme/ThemeContext.js';

const SQUARE_COLOURS: Record<string, string> = {
  normal: '#D4CCBA',
  star: '#E8C46A66',
  'double-tile': '#6A8D5C55',
  'triple-tile': '#4D6A4288',
  'double-seq': '#C9907A55',
  'triple-seq': '#A0604888',
};

const SQUARE_LABELS: Record<string, string> = {
  star: '\u2605',
  'double-tile': '2\u00d7',
  'triple-tile': '3\u00d7',
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

// Classic theme: semi-transparent squares so board texture shows through
const CLASSIC_SQUARE_COLOURS: Record<string, string> = {
  normal: 'rgba(180, 170, 150, 0.25)',
  star: 'rgba(232, 196, 106, 0.35)',
  'double-tile': 'rgba(106, 141, 92, 0.35)',
  'triple-tile': 'rgba(77, 106, 66, 0.45)',
  'double-seq': 'rgba(201, 144, 122, 0.35)',
  'triple-seq': 'rgba(160, 96, 72, 0.45)',
};

// Sprite-based bonus indicators for classic theme
const CLASSIC_BONUS_SPRITES: Record<string, string> = {
  'double-tile': '/sprites/buttons/x2-bonus.png',
  'triple-tile': '/sprites/buttons/x3-bonus.png',
  'double-seq': '/sprites/buttons/double-bonus.png',
  'triple-seq': '/sprites/buttons/triple-bonus.png',
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
  const { theme } = useTheme();
  const isClassic = theme === 'classic';
  const tile = pendingTile ?? square.placedTile;

  const colourMap = isClassic ? CLASSIC_SQUARE_COLOURS : SQUARE_COLOURS;
  const bg = colourMap[square.type] ?? colourMap['normal'];
  const label = SQUARE_LABELS[square.type];
  const labelColour = SQUARE_LABEL_COLOURS[square.type];
  const bonusSprite = isClassic ? CLASSIC_BONUS_SPRITES[square.type] : undefined;

  return (
    <div
      style={{
        width: size,
        height: size,
        background: tile ? 'transparent' : bg,
        border: tile ? 'none' : isClassic ? '1px solid rgba(200, 184, 150, 0.2)' : '1px solid #C8B89644',
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
      ) : bonusSprite ? (
        <img
          src={bonusSprite}
          alt={label}
          draggable={false}
          style={{
            width: size * 0.6,
            height: size * 0.6,
            objectFit: 'contain',
            opacity: 0.8,
          }}
        />
      ) : label ? (
        <span
          style={{
            fontSize: size * 0.28,
            fontWeight: 700,
            color: isClassic ? 'rgba(255,255,255,0.7)' : labelColour,
            userSelect: 'none',
          }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
}
