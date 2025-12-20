import { v4 as uuidv4 } from 'uuid';
import * as userRepo from '../repositories/userRepository.js';

async function getProfile(usernameOrId) {
  // allow id or username
  let user = null;
  if (usernameOrId.includes('-')) {
    user = await userRepo.findById(usernameOrId);
  }
  if (!user) user = await userRepo.findByUsername(usernameOrId);
  if (!user) throw { status: 404, message: 'User not found' };
  if (user.isBanned) throw { status: 403, message: 'User not exist' };
  return user;
}

async function updateProfile(userId, patch) {
  const allowed = {};
  ['display_name', 'bio', 'avatar_url', 'cover_url'].forEach(k => { if (patch[k] !== undefined) allowed[k] = patch[k]; });
  if (!Object.keys(allowed).length) throw { status: 400, message: 'No valid fields to update' };
  return await userRepo.updateProfile(userId, allowed);
}

async function follow(followerId, followeeId) {
  if (followerId === followeeId) throw { status: 400, message: 'Cannot follow yourself' };
  await userRepo.followUser(followerId, followeeId);
  return true;
}

async function unfollow(followerId, followeeId) {
  await userRepo.unfollowUser(followerId, followeeId);
  return true;
}

async function getFollowers(userId, limit) { return userRepo.getFollowers(userId, limit); }
async function getFollowing(userId, limit) { return userRepo.getFollowing(userId, limit); }

async function createUserReport(reporterId, data) {
  const { targetId, targetType, reason } = data;
  if (!targetId || !targetType || !reason) {
    throw { status: 400, message: "Lack of reporting information" };
  }
  const validTypes = ['User', 'Post'];
  if (!validTypes.includes(targetType)) {
    throw { status: 400, message: "The report is invalid" };
  }
  if (targetType === 'User' && reporterId === targetId) {
    throw { status: 400, message: "Unable to report myself" };
  }
  const reportId = uuidv4();
  return await userRepo.createReport({reportId, reporterId, targetId, targetType, reason});
}

export { getProfile, updateProfile, follow, unfollow, getFollowers, getFollowing, createUserReport };
