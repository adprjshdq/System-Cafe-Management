// Sumber tunggal hak akses halaman per role.
// Dipakai oleh route guard di App.jsx dan filter menu di Sidebar.jsx.
export const ROUTE_ACCESS = {
  '/': ['admin'],
  '/pos': ['admin', 'cashier', 'waiter'],
  '/kitchen': ['admin', 'kitchen'],
  '/menus': ['admin'],
  '/tables': ['admin', 'cashier'],
  '/orders': ['admin', 'cashier'],
  '/users': ['admin'],
};

// Halaman tujuan ketika role membuka halaman yang bukan haknya.
export const ROLE_HOME = {
  admin: '/',
  cashier: '/pos',
  kitchen: '/kitchen',
  waiter: '/pos',
};

export function canAccessPath(role, path) {
  const allowedRoles = ROUTE_ACCESS[path];
  return !allowedRoles || allowedRoles.includes(role);
}
