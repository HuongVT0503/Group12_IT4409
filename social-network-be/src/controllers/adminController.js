import * as adminService from '../services/adminService.js';

export async function getStats(req, res, next) {
  try {
    const data = await adminService.getDashboardStats();
    res.json(data);
  } catch (err) { next(err); }
}

export async function getUsers(req, res, next) {
  try {
    const users = await adminService.getAllUsers();
    res.json(users);
  } catch (err) { next(err); }
}

export async function handleBan(req, res, next) {
  try {
    const { id } = req.params;
    const { isBanned } = req.body;
    const result = await adminService.toggleUserBan(id, isBanned, req.user.sub);
    res.json({ message: "Update successful", user: result });
  } catch (err) { next(err); }
}

export async function getReportList(req, res, next) {
  try {
    const reports = await adminService.getReports();
    res.json(reports);
  } catch (err) { next(err); }
}

export async function getPostDetail(req, res, next) {
  try {
    const post = await adminService.getPostDetail(req.params.id);
    res.json(post);
  } catch (err) { next(err); }
}

export async function deletePost(req, res, next) {
  try {
    await adminService.removePost(req.params.id);
    res.json({ message: "The post has been deleted" });
  } catch (err) { next(err); }
}

export async function dismissReport(req, res, next) {
  try {
    const result = await adminService.ignoreReport(req.params.reportId);
    res.json(result);
  } catch (err) { next(err); }
}
