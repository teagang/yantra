import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type Theme = 'default' | 'classic';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'default',
  setTheme: () => {},
});

const STORAGE_KEY = 'yantra_theme';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    // URL param takes priority
    const params = new URLSearchParams(window.location.search);
    const urlTheme = params.get('theme');
    if (urlTheme === 'classic' || urlTheme === 'default') return urlTheme;
    // Then localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'classic') return 'classic';
    return 'default';
  });

  // Persist to localStorage whenever theme changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  function setTheme(t: Theme) {
    setThemeState(t);
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Map a game tile to its classic sprite path.
 *
 * Sprite layout:
 *   Tile-01..08 = multicoloured corners, numbers 1-8  → mapped to "red"
 *   Tile-09     = multicoloured blank                  → mapped to "red" blank
 *   Tile-10..17 = orange corners, numbers 1-8          → mapped to "yellow"
 *   Tile-18..25 = green corners, numbers 1-8           → mapped to "blue"
 *
 * Purple has no dedicated sprites so we reuse the multicoloured set
 * and apply a CSS hue-rotate filter.
 */
export function getTileSprite(colour: string | null, value: number, isBlank: boolean, isEight: boolean): {
  src: string;
  filter?: string;
} | null {
  // Determine effective value for sprite lookup (1-8, or 0 for blank)
  let spriteValue: number;
  if (isBlank && value === 0) {
    // Unassigned blank — use blank sprite (no number)
    spriteValue = 0;
  } else if (isEight) {
    spriteValue = 8;
  } else {
    spriteValue = value;
  }

  // Determine which sprite colour group to use
  const effectiveColour = colour ?? (isEight ? null : null);

  let offset: number;
  let filter: string | undefined;

  switch (effectiveColour) {
    case 'red':
      // Tiles 01-08 (values 1-8), Tile-09 (blank)
      offset = spriteValue === 0 ? 9 : spriteValue;
      break;
    case 'yellow':
      // Tiles 10-17 (values 1-8 mapped as 10+value-1)
      if (spriteValue === 0) {
        // No dedicated yellow blank sprite — use red blank with hue shift
        offset = 9;
        filter = 'hue-rotate(30deg) saturate(1.3)';
      } else {
        offset = 9 + spriteValue;
      }
      break;
    case 'blue':
      // Tiles 18-25 (values 1-8 mapped as 17+value)
      if (spriteValue === 0) {
        offset = 9;
        filter = 'hue-rotate(200deg)';
      } else {
        offset = 17 + spriteValue;
      }
      break;
    case 'purple':
      // Reuse multicoloured (red) sprites with hue-rotate
      offset = spriteValue === 0 ? 9 : spriteValue;
      filter = 'hue-rotate(260deg) saturate(0.8)';
      break;
    default:
      // Eights (no colour) — use multicoloured set
      if (isEight) {
        offset = 8; // Tile-08 is "8"
      } else {
        // Unassigned blank with no colour
        offset = 9;
      }
      break;
  }

  const num = String(offset).padStart(2, '0');
  return { src: `/sprites/tiles/Tile-${num}.png`, filter };
}
