import * as userService from '../services/userService.js';
import { emitFollowUpdate } from '../services/realtimeService.js';
import { validationResult } from 'express-validator';

async function getProfile(req, res, next) {
  try {
    const idOrUsername = req.params.id;
    const user = await userService.getProfile(idOrUsername);
    res.json({ user });
  } catch (err) { next(err); }
}

async function updateProfile(req, res, next) {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation error', errors: errors.array() });
    }

    const userId = req.user.id;
    const updated = await userService.updateProfile(userId, req.body);
    res.json({ user: updated });
  } catch (err) { next(err); }
}

async function follow(req, res, next) {
  try {
    const followerId = req.user.id;
    const followeeId = req.params.id;
    await userService.follow(followerId, followeeId);

    // Emit follow update realtime
    emitFollowUpdate(followeeId, { newFollower: followerId });

    res.json({ following: true });
  } catch (err) { next(err); }
}

async function unfollow(req, res, next) {
  try {
    const followerId = req.user.id;
    const followeeId = req.params.id;
    await userService.unfollow(followerId, followeeId);
    emitFollowUpdate(followeeId, { removedFollower: followerId });

    res.json({ following: false });
  } catch (err) { next(err); }
}

async function getFollowers(req, res, next) {
  try {
    const userId = req.params.id;
    const data = await userService.getFollowers(userId, req.query.limit || 50);
    res.json({ data });
  } catch (err) { next(err); }
}

async function getFollowing(req, res, next) {
  try {
    const userId = req.params.id;
    const data = await userService.getFollowing(userId, req.query.limit || 50);
    res.json({ data });
  } catch (err) { next(err); }
}

async function searchUsers(req, res, next) {
    try {
        const q = req.query.q || req.query.username || '';
        const limit = parseInt(req.query.limit || '50');
        const skip = parseInt(req.query.skip || '0');
        const data = await userService.searchUsers(q, limit, skip);
        res.json({ data });
    } catch (err) { next(err); }
}

async function submitReport(req, res, next) {
    try {
        const reporterId = req.user.id || req.user.userId;
        const success = await userService.createUserReport(reporterId, req.body);
        if (success) { res.status(201).json({ message: "Your report has been submitted" });}
        else { res.status(404).json({ message: "Your report has not been submitted" });}
    } catch (err) { next(err); }
}

export { getProfile, updateProfile, follow, unfollow, getFollowers, getFollowing, searchUsers, submitReport };
