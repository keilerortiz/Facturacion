import { useCallback, useMemo, useState } from 'react';
import { tokens } from '../../styles/theme';
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Chip,
  Divider,
  Container,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Tooltip,
  Typography
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import InventoryIcon from '@mui/icons-material/Inventory';
import PeopleIcon from '@mui/icons-material/People';
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import ChangePasswordDialog from '../common/ChangePasswordDialog';
import logo1A from '../../assets/1A.png';
import logo1B from '../../assets/1B.png';

const sidebarWidth = 220;
const sidebarWidthCollapsed = 60;
const navigationItems = [
  { label: 'Dashboard', path: '/dashboard', icon: DashboardIcon },
  { label: 'Movimientos', path: '/movimientos', icon: InventoryIcon, roles: ['operador', 'consultor'] },
  { label: 'Usuarios', path: '/usuarios', roles: ['admin'], icon: PeopleIcon }
];

function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const currentWidth = collapsed ? sidebarWidthCollapsed : sidebarWidth;

  const filteredItems = useMemo(
    () => navigationItems.filter(
      (item) => !item.roles || item.roles.includes(user?.rol)
    ),
    [user?.rol]
  );

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login', { replace: true });
  }, [logout, navigate]);

  const handleCloseMobile = useCallback(() => setMobileOpen(false), []);
  const handleClosePasswordDialog = useCallback(() => setPasswordDialogOpen(false), []);

  const renderNavigation = (onNavigate) => (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'primary.main',
        color: tokens.sidebarText
      }}
    >
      {/* Logo / Header */}
      <Box
        sx={{
          px: collapsed ? 0 : 2,
          py: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          minHeight: 64,
          gap: 1
        }}
      >
        {!collapsed && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, overflow: 'hidden', minWidth: 0 }}>
            <Box
              component="img"
              src={logo1B}
              alt="Logo"
              sx={{ height: 40, width: 'auto', display: 'block', flexShrink: 0 }}
            />
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="overline"
                sx={{ opacity: 0.6, letterSpacing: '0.16em', fontSize: '0.65rem', display: 'block', lineHeight: 1.2 }}
              >
                Sistema
              </Typography>
              <Typography
                variant="subtitle2"
                sx={{ color: 'common.white', fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}
              >
                Facturacion
              </Typography>
            </Box>
          </Box>
        )}
        <Tooltip title={collapsed ? 'Expandir' : 'Contraer'} placement="right">
          <IconButton
            size="small"
            onClick={() => setCollapsed((prev) => !prev)}
            sx={{
              color: tokens.sidebarMuted,
              flexShrink: 0,
              borderRadius: '6px',
              transition: 'background-color 0.15s',
              '&:hover': { backgroundColor: tokens.sidebarDivider }
            }}
          >
            {collapsed ? <ChevronRightIcon fontSize="small" /> : <ChevronLeftIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>

      <Divider sx={{ borderColor: tokens.sidebarDivider }} />

      {/* Navigation */}
      <List sx={{ px: collapsed ? 0.5 : 1.25, py: 1.5, flexGrow: 1 }}>
        {filteredItems.map((item) => {
          const Icon = item.icon;
          const active = location.pathname.startsWith(item.path);

          return (
            <Tooltip key={item.path} title={collapsed ? item.label : ''} placement="right" arrow>
              <ListItemButton
                component={NavLink}
                to={item.path}
                onClick={onNavigate}
                selected={active}
                sx={{
                  minHeight: 40,
                  mb: 0.5,
                  px: collapsed ? 1 : 1.25,
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  borderRadius: '6px',
                  color: 'inherit',
                  backgroundColor: active ? tokens.sidebarBgActive : 'transparent',
                  '&:hover': { backgroundColor: active ? tokens.sidebarBgHoverAct : tokens.sidebarBgHover },
                  '&.Mui-selected': { backgroundColor: tokens.sidebarBgActive },
                  '&.Mui-selected:hover': { backgroundColor: tokens.sidebarBgHoverAct }
                }}
              >
                <ListItemIcon sx={{ minWidth: collapsed ? 0 : 34, color: 'inherit', justifyContent: 'center' }}>
                  <Icon fontSize="small" />
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontSize: 13.5, fontWeight: active ? 700 : 500 }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          );
        })}
      </List>

      {/* User section (bottom) */}
      <Divider sx={{ borderColor: tokens.sidebarDivider }} />
      <Box sx={{ px: collapsed ? 0.5 : 2, py: 1.75 }}>
        {collapsed ? (
          <Tooltip title="Cerrar sesion" placement="right" arrow>
            <IconButton
              size="small"
              onClick={handleLogout}
              sx={{
                color: tokens.sidebarMuted,
                width: '100%',
                borderRadius: '6px',
                py: 0.75,
                '&:hover': { backgroundColor: tokens.sidebarBgHoverSoft }
              }}
            >
              <LogoutIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : (
          <>
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.25 }}>
              <Avatar
                sx={{
                  width: 30,
                  height: 30,
                  bgcolor: tokens.sidebarChipBg,
                  fontSize: '0.82rem',
                  color: 'common.white',
                  fontWeight: 700,
                  flexShrink: 0
                }}
              >
                {(user?.nombre || user?.usuario || 'F').charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="body2"
                  sx={{
                    color: 'common.white',
                    fontWeight: 600,
                    fontSize: '0.8rem',
                    lineHeight: 1.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {user?.nombre || user?.usuario}
                </Typography>
                <Chip
                  label={user?.rol || 'usuario'}
                  size="small"
                  sx={{
                    height: 16,
                    fontSize: '0.62rem',
                    bgcolor: tokens.sidebarBgActive,
                    color: tokens.sidebarChipText,
                    '& .MuiChip-label': { px: 0.75 }
                  }}
                />
              </Box>
            </Stack>
            <Button
              fullWidth
              size="small"
              startIcon={<LogoutIcon sx={{ fontSize: '0.95rem !important' }} />}
              onClick={() => { if (onNavigate) onNavigate(); handleLogout(); }}
              sx={{
                justifyContent: 'flex-start',
                color: tokens.sidebarMuted,
                fontSize: '0.78rem',
                fontWeight: 500,
                px: 1,
                py: 0.5,
                borderRadius: '6px',
                textTransform: 'none',
                transition: 'background-color 0.15s, color 0.15s',
                '&:hover': { backgroundColor: tokens.sidebarBgHoverSoft, color: 'common.white' }
              }}
            >
              Cerrar sesion
            </Button>
            <Button
              fullWidth
              size="small"
              onClick={() => { if (onNavigate) onNavigate(); setPasswordDialogOpen(true); }}
              sx={{
                justifyContent: 'flex-start',
                color: tokens.sidebarSubtle,
                fontSize: '0.72rem',
                fontWeight: 400,
                px: 1,
                py: 0.25,
                borderRadius: '6px',
                textTransform: 'none',
                transition: 'background-color 0.15s, color 0.15s',
                '&:hover': { backgroundColor: tokens.sidebarBgHover, color: 'rgba(255,255,255,0.8)' }
              }}
            >
              Cambiar contrasena
            </Button>
          </>
        )}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ height: '100vh', display: 'flex', overflow: 'hidden', backgroundColor: 'background.default' }}>
      {/* AppBar */}
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          width: { md: `calc(100% - ${currentWidth}px)` },
          ml: { md: `${currentWidth}px` },
          transition: 'width 0.2s, margin-left 0.2s',
          borderBottom: `1px solid ${tokens.borderMedium}`,
          backgroundColor: 'rgba(255,255,255,0.95)'
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important' }}>
          <IconButton
            edge="start"
            sx={{ mr: 1, display: { md: 'none' } }}
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="subtitle1" component="h1" color="primary.main" fontWeight={700}>
              Facturacion
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              Operacion, auditoria y control de movimientos
            </Typography>
          </Box>
          <Box
            component="img"
            src={logo1A}
            alt="Logo"
            sx={{ height: 38, width: 'auto', display: { xs: 'none', md: 'block' } }}
          />
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{ width: { md: currentWidth }, flexShrink: { md: 0 }, transition: 'width 0.2s' }}
      >
        <Drawer
          open={mobileOpen}
          onClose={handleCloseMobile}
          variant="temporary"
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { width: sidebarWidth, borderRadius: 0, borderRight: 'none' }
          }}
        >
          {renderNavigation(handleCloseMobile)}
        </Drawer>

        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              width: currentWidth,
              boxSizing: 'border-box',
              borderRadius: 0,
              borderRight: 'none',
              overflow: 'hidden',
              transition: 'width 0.2s'
            }
          }}
        >
          {renderNavigation()}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${currentWidth}px)` },
          transition: 'width 0.2s',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important', flexShrink: 0 }} />
        <Container
          maxWidth="xl"
          sx={{
            flex: 1,
            minHeight: 0,
            py: 1.5,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'auto'
          }}
        >
          <Outlet />
        </Container>
      </Box>

      <ChangePasswordDialog
        open={passwordDialogOpen}
        onClose={handleClosePasswordDialog}
      />
    </Box>
  );
}

export default AppLayout;
