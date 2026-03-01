import { useState } from 'react';
import type { Tile } from '@yantra/shared';
import { RackTile } from './RackTile.js';
import { useGameStore } from '../../store/gameStore.js';
import { useDragDrop } from '../../hooks/useDragDrop.js';
import { useGame } from '../../hooks/useGame.js';

interface Props {
  hand: Tile[];
  onTileSelected: (tile: Tile | null) => void;
  selectedTile: Tile | null;
}

export function TileRack({ hand, onTileSelected, selectedTile }: Props) {
  const { swapMode, selectedForSwap, toggleSwapSelection, pendingPlacements } = useGameStore();
  const { onDragStart, onDragEnd } = useDragDrop(() => {});

  const pendingIds = new Set(pendingPlacements.map((p) => p.tile.id));

  return (
    <div style={styles.rack}>
      {hand.map((tile) => {
        const isPending = pendingIds.has(tile.id);
        const isSelectedForSwap = selectedForSwap.includes(tile.id);
        const isSelected = selectedTile?.id === tile.id;

        return (
          <RackTile
            key={tile.id}
            tile={tile}
            selected={isSelected}
            selectedForSwap={isSelectedForSwap}
            disabled={isPending}
            onSelect={() => {
              if (swapMode) {
                toggleSwapSelection(tile.id);
              } else {
                onTileSelected(isSelected ? null : tile);
              }
            }}
            onDragStart={(e) => {
              onDragStart(tile, e);
            }}
            onDragEnd={onDragEnd}
          />
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  rack: {
    display: 'flex',
    flexDirection: 'row',
    gap: 6,
    padding: '0.4rem 0.5rem',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
};
