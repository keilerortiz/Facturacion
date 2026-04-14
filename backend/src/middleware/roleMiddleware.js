export function requireRoles(...roles) {
  return (req, res, next) => {
    const userRole = req.auth?.role;

    if (!userRole || !roles.includes(userRole)) {
      return res.status(403).json({ message: 'No autorizado para este recurso' });
    }

    return next();
  };
}
