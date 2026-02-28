import { useMemo, useCallback } from 'react';
import { VALID_SQUARES, isValidSquare, CENTER } from '@yantra/shared';
import type { BoardSquare, Tile } from '@yantra/shared';
import { BoardSquareComponent } from './BoardSquare.js';
import { useGameStore } from '../../store/gameStore.js';
import { useGame } from '../../hooks/useGame.js';
import { useDragDrop } from '../../hooks/useDragDrop.js';

interface Props {
  board: Record<string, BoardSquare>;
  squareSize?: number;
  selectedTile?: Tile | null; // tile selected from rack (tap-to-place)
  onTileSelected?: () => void;
}

const GRID = 15;

export function Board({ board, squareSize = 34, selectedTile, onTileSelected }: Props) {
  const { pendingPlacements } = useGameStore();
  const { placeTile, recallTile, isMyTurn } = useGame();
  const myTurn = isMyTurn();

  const pendingMap = useMemo(() => {
    const m = new Map<string, Tile>();
    for (const p of pendingPlacements) {
      m.set(`${p.row},${p.col}`, p.tile);
    }
    return m;
  }, [pendingPlacements]);

  const handleDrop = useCallback(
    (tile: Tile, row: number, col: number) => {
      if (!myTurn) return;
      const k = `${row},${col}`;
      if (board[k]?.placedTile || pendingMap.has(k)) return;
      placeTile(tile, row, col);
    },
    [board, pendingMap, placeTile, myTurn]
  );

  const { onDragOver, onDropSquare } = useDragDrop(handleDrop);

  const handleTap = useCallback(
    (row: number, col: number) => {
      if (!myTurn || !selectedTile) return;
      const k = `${row},${col}`;
      if (board[k]?.placedTile || pendingMap.has(k)) return;
      placeTile(selectedTile, row, col);
      onTileSelected?.();
    },
    [board, pendingMap, placeTile, selectedTile, myTurn, onTileSelected]
  );

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID}, ${squareSize}px)`,
        gap: 1,
        background: '#EAE4D6',
        padding: 0,
        borderRadius: 0,
        overflow: 'auto',
        touchAction: 'pan-x pan-y',
      }}
    >
      {Array.from({ length: GRID }, (_, r) =>
        Array.from({ length: GRID }, (_, c) => {
          const k = `${r},${c}`;
          if (!isValidSquare(r, c)) {
            return <div key={k} style={{ width: squareSize, height: squareSize }} />;
          }
          const square = board[k];
          if (!square) return <div key={k} style={{ width: squareSize, height: squareSize }} />;
          const pendingTile = pendingMap.get(k);

          return (
            <BoardSquareComponent
              key={k}
              square={square}
              size={squareSize}
              pendingTile={pendingTile}
              onDragOver={onDragOver}
              onDrop={(e) => onDropSquare(e, r, c)}
              onTap={selectedTile ? () => handleTap(r, c) : undefined}
              onRecall={pendingTile ? () => recallTile(pendingTile.id) : undefined}
            />
          );
        })
      )}
    </div>
  );
}
