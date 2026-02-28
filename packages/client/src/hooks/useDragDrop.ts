import { useRef, useCallback } from 'react';
import type { Tile } from '@yantra/shared';

/**
 * Simple drag-and-drop hook for tiles.
 * Works on both mouse and touch events.
 */
export function useDragDrop(onDrop: (tile: Tile, row: number, col: number) => void) {
  const dragging = useRef<Tile | null>(null);

  const onDragStart = useCallback((tile: Tile) => {
    dragging.current = tile;
  }, []);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault(); // allow drop
  }, []);

  const onDropSquare = useCallback(
    (e: React.DragEvent, row: number, col: number) => {
      e.preventDefault();
      if (dragging.current) {
        onDrop(dragging.current, row, col);
        dragging.current = null;
      }
    },
    [onDrop]
  );

  const onDragEnd = useCallback(() => {
    dragging.current = null;
  }, []);

  return { onDragStart, onDragOver, onDropSquare, onDragEnd };
}
