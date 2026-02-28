import { useCallback } from 'react';
import type { Tile } from '@yantra/shared';

/**
 * Simple drag-and-drop hook for tiles.
 * Uses dataTransfer to pass tile data between drag source and drop target.
 */
export function useDragDrop(onDrop: (tile: Tile, row: number, col: number) => void) {
  const onDragStart = useCallback((tile: Tile, e?: React.DragEvent) => {
    if (e) {
      e.dataTransfer.setData('application/json', JSON.stringify(tile));
      e.dataTransfer.effectAllowed = 'move';
    }
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const onDropSquare = useCallback(
    (e: React.DragEvent, row: number, col: number) => {
      e.preventDefault();
      try {
        const data = e.dataTransfer.getData('application/json');
        if (data) {
          const tile: Tile = JSON.parse(data);
          onDrop(tile, row, col);
        }
      } catch {
        // ignore invalid data
      }
    },
    [onDrop]
  );

  const onDragEnd = useCallback(() => {}, []);

  return { onDragStart, onDragOver, onDropSquare, onDragEnd };
}
