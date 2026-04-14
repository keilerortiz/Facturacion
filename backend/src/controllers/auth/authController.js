import { authService } from '../../services/auth/authService.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const authController = {
  login: asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);
    res.status(result.status || 200).json(result.data);
  }),
  register: asyncHandler(async (req, res) => {
    const result = await authService.register(req.body, req.auth);
    res.status(result.status || 201).json(result.data);
  }),
  validate: asyncHandler(async (req, res) => {
    const result = await authService.validate(req.auth);
    res.status(result.status || 200).json(result.data);
  }),
  profile: asyncHandler(async (req, res) => {
    const result = await authService.profile(req.auth);
    res.status(result.status || 200).json(result.data);
  }),
  changePassword: asyncHandler(async (req, res) => {
    const result = await authService.changePassword(req.body, req.auth);
    res.status(result.status || 200).json(result.data);
  }),
  listUsers: asyncHandler(async (_req, res) => {
    const result = await authService.listUsers();
    res.status(result.status || 200).json(result.data);
  }),
  updateUserStatus: asyncHandler(async (req, res) => {
    const result = await authService.updateUserStatus(req.params.id, req.body, req.auth);
    res.status(result.status || 200).json(result.data);
  }),
  resetPassword: asyncHandler(async (req, res) => {
    const result = await authService.resetPassword(req.params.id, req.auth);
    res.status(result.status || 200).json(result.data);
  }),
  refresh: asyncHandler(async (req, res) => {
    const result = await authService.refresh(req.body);
    res.status(result.status || 200).json(result.data);
  }),
  logout: asyncHandler(async (req, res) => {
    const result = await authService.logout(req.body);
    res.status(result.status || 200).json(result.data);
  })
};
