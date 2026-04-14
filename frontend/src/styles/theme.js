import { createTheme } from '@mui/material/styles';

const brandPrimary = 'rgb(1, 40, 65)';
const brandPrimaryDark = 'rgb(0, 28, 46)';
const brandPrimaryLight = 'rgb(34, 74, 99)';

// ── Tokens reutilizables ─────────────────────────────────────────────────────
// Bordes y fondos semitransparentes derivados del primary  
export const tokens = {
  borderLight:   'rgba(1,40,65,0.07)',   // bordes contenedores, papers
  borderMedium:  'rgba(1,40,65,0.1)',    // appbar bottom, separadores
  borderInput:   'rgba(1,40,65,0.22)',   // inputs, filtros
  borderStrong:  'rgba(1,40,65,0.2)',    // botones outline, toggle borders
  hoverBorder:   'rgba(1,40,65,0.42)',   // input hover
  bgSubtle:      'rgba(1,40,65,0.03)',   // fondos muy suaves
  bgLight:       'rgba(1,40,65,0.05)',   // fondos ligeros activos
  bgChip:        'rgba(1,40,65,0.07)',   // chips activos
  focusRing:     'rgba(1,40,65,0.1)',    // sombra focus
  hoverRow:      'rgba(1,40,65,0.035)',  // hover filas tabla
  // Sidebar (sobre fondo oscuro)
  sidebarText:       'rgba(255,255,255,0.92)',
  sidebarMuted:      'rgba(255,255,255,0.7)',
  sidebarSubtle:     'rgba(255,255,255,0.5)',
  sidebarDivider:    'rgba(255,255,255,0.12)',
  sidebarBgActive:   'rgba(255,255,255,0.15)',
  sidebarBgHover:    'rgba(255,255,255,0.08)',
  sidebarBgHoverAct: 'rgba(255,255,255,0.2)',
  sidebarBgHoverSoft:'rgba(255,255,255,0.1)',
  sidebarChipBg:     'rgba(255,255,255,0.18)',
  sidebarChipText:   'rgba(255,255,255,0.85)',
  // Bordes card
  borderCard:        'rgba(1,40,65,0.08)',
  shadowCard:        'rgba(1,40,65,0.16)',
  shadowHover:       'rgba(1,40,65,0.11)',
  // Colores tabla
  tableHeadColor: '#4a5568',
  tableHeadBg:    '#f7f9fc',
  tableHeadBorder:'#e8edf2',
};

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: brandPrimary,
      dark: brandPrimaryDark,
      light: brandPrimaryLight
    },
    secondary: {
      main: 'rgb(59, 95, 117)',
      dark: 'rgb(35, 65, 85)',
      light: 'rgb(102, 133, 151)'
    },
    success: {
      main: '#2f855a'
    },
    error: {
      main: '#c05621'
    },
    background: {
      default: '#eef2f0',
      paper: '#ffffff'
    },
    text: {
      primary: '#16313a',
      secondary: '#58717a'
    },
    divider: 'rgba(0,0,0,0.07)'
  },
  shape: {
    borderRadius: 8
  },
  typography: {
    fontFamily: '"IBM Plex Sans", "Segoe UI", sans-serif',
    h3: { fontWeight: 700, letterSpacing: '-0.04em' },
    h4: { fontWeight: 700, letterSpacing: '-0.03em' },
    h5: { fontWeight: 700, letterSpacing: '-0.02em' },
    h6: { fontWeight: 700, letterSpacing: '-0.01em' },
    subtitle1: { fontWeight: 600, fontSize: '0.95rem', letterSpacing: '-0.005em' },
    subtitle2: { fontSize: '0.82rem', fontWeight: 600 },
    body1: { lineHeight: 1.65 },
    body2: { fontSize: '0.875rem', lineHeight: 1.65 },
    caption: { fontSize: '0.75rem', letterSpacing: '0.01em' },
    overline: { letterSpacing: '0.1em', fontWeight: 600, fontSize: '0.7rem' }
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backdropFilter: 'blur(14px)',
          backgroundImage: 'none'
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          borderRadius: '10px'
        },
        elevation1: {
          boxShadow: '0 1px 4px rgba(0,0,0,0.06), 0 4px 16px rgba(1,40,65,0.07)'
        },
        elevation2: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 8px 24px rgba(1,40,65,0.09)'
        }
      }
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: '12px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.08), 0 12px 32px rgba(1,40,65,0.1)'
        }
      }
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
        variant: 'outlined'
      }
    },
    MuiFormControl: {
      defaultProps: {
        size: 'small',
        variant: 'outlined'
      }
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '0.83rem'
        }
      }
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          marginLeft: 0,
          fontSize: '0.74rem',
          lineHeight: 1.4
        }
      }
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          backgroundColor: '#fff',
          transition: 'box-shadow 0.2s ease',
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: tokens.hoverBorder
          },
          '&.Mui-focused': {
            boxShadow: `0 0 0 3px ${tokens.focusRing}`
          }
        },
        input: {
          paddingTop: 9,
          paddingBottom: 9
        },
        inputMultiline: {
          paddingTop: 0,
          paddingBottom: 0
        }
      }
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true
      },
      styleOverrides: {
        root: {
          minHeight: 36,
          borderRadius: '8px',
          textTransform: 'none',
          fontWeight: 600,
          letterSpacing: '0.01em',
          transition: 'background-color 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease'
        },
        contained: {
          '&:hover': {
            boxShadow: '0 4px 14px rgba(1, 40, 65, 0.22)'
          }
        },
        sizeSmall: {
          minHeight: 30,
          borderRadius: '6px',
          fontSize: '0.8rem'
        }
      }
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '6px'
        },
        label: {
          fontWeight: 600
        }
      }
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          paddingTop: 12,
          paddingBottom: 12
        },
        head: {
          fontSize: '0.72rem',
          fontWeight: 700,
          color: tokens.tableHeadColor,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          backgroundColor: tokens.tableHeadBg,
          borderBottom: `2px solid ${tokens.tableHeadBorder}`
        },
        body: {
          fontSize: '0.855rem'
        }
      }
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: 'background-color 0.15s',
          '&:last-child td, &:last-child th': {
            borderBottom: 0
          }
        }
      }
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: '10px'
        }
      }
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: '12px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)'
        }
      }
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: '6px',
          transition: 'background-color 0.15s, color 0.15s'
        }
      }
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(0,0,0,0.06)'
        }
      }
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: '8px',
          fontSize: '0.865rem'
        }
      }
    }
  }
});

export default theme;
