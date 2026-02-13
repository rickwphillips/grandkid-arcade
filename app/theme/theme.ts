import { createTheme, ThemeOptions } from '@mui/material/styles';

// Autumn color palette
const autumnColors = {
  light: {
    primary: '#D2691E',        // Chocolate/burnt orange
    secondary: '#8B4513',      // Saddle brown
    accent: '#DAA520',         // Goldenrod
    background: '#FFF8F0',     // Warm cream
    paper: '#FFFFFF',
    text: {
      primary: '#2C1810',
      secondary: '#5D4037',
    },
    divider: '#E0C9B0',
  },
  dark: {
    primary: '#FF8C00',        // Dark orange (brighter for dark mode)
    secondary: '#CD853F',      // Peru
    accent: '#F4A460',         // Sandy brown
    background: '#1A1410',     // Very dark brown
    paper: '#2D1F1A',          // Dark brown paper
    text: {
      primary: '#F5E6D3',
      secondary: '#D4BFA0',
    },
    divider: '#4A3828',
  },
};

export const createAppTheme = (mode: 'light' | 'dark') => {
  const colors = mode === 'light' ? autumnColors.light : autumnColors.dark;

  const themeOptions: ThemeOptions = {
    palette: {
      mode,
      primary: {
        main: colors.primary,
        contrastText: mode === 'light' ? '#FFFFFF' : '#1A1410',
      },
      secondary: {
        main: colors.secondary,
        contrastText: '#FFFFFF',
      },
      background: {
        default: colors.background,
        paper: colors.paper,
      },
      text: {
        primary: colors.text.primary,
        secondary: colors.text.secondary,
      },
      divider: colors.divider,
      action: {
        active: colors.accent,
      },
    },
    typography: {
      fontFamily: [
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
      h1: {
        fontWeight: 700,
        letterSpacing: '-0.02em',
      },
      h2: {
        fontWeight: 600,
      },
      h3: {
        fontWeight: 600,
      },
      h4: {
        fontWeight: 600,
      },
      h5: {
        fontWeight: 600,
      },
      h6: {
        fontWeight: 600,
      },
    },
    shape: {
      borderRadius: 8,
    },
    components: {
      MuiCard: {
        styleOverrides: {
          root: {
            borderLeft: `4px solid ${colors.primary}`,
            transition: 'transform 0.2s, box-shadow 0.2s',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: mode === 'light'
                ? '0 4px 12px rgba(0, 0, 0, 0.1)'
                : '0 4px 12px rgba(0, 0, 0, 0.5)',
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 20,
            fontWeight: 500,
            transition: 'all 0.2s',
            '&:hover': {
              transform: 'scale(1.05)',
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            fontWeight: 500,
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            transition: 'color 0.2s',
            '&:hover': {
              textDecoration: 'underline',
            },
          },
        },
      },
    },
  };

  return createTheme(themeOptions);
};
