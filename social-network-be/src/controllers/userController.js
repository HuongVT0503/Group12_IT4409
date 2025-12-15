// const userService = require('../services/userService');
// import { emitNotification, emitFollowUpdate } from '../services/realtimeService.js';

const userService = require('../services/userService');
const { emitNotification, emitFollowUpdate } = require('../services/realtimeService');

async function getProfile(req, res, next) {
  try {
    const idOrUsername = req.params.id;
    const user = await userService.getProfile(idOrUsername);
    res.json({ user });
  } catch (err) { next(err); }
}

async function updateProfile(req, res, next) {
  try {
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

    // Emit realtime
    emitNotification(followeeId, {
      type: 'follow',
      from: followerId
    });

    emitFollowUpdate(followeeId, { newFollower: followerId });

    res.json({ following: true });
  } catch (err) { next(err); }
}

async function unfollow(req, res, next) {
  try {
    const followerId = req.user.id;
    const followeeId = req.params.id;
    await userService.unfollow(followerId, followeeId);

    // Emit realtime
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

module.exports = { getProfile, updateProfile, follow, unfollow, getFollowers, getFollowing };
