const { v4: uuidv4 } = require('uuid');
const userRepo = require('../repositories/user.repository');

async function getProfile(usernameOrId) {
  // allow id or username
  let user = null;
  if (usernameOrId.includes('-')) {
    user = await userRepo.findById(usernameOrId);
  }
  if (!user) user = await userRepo.findByUsername(usernameOrId);
  if (!user) throw { status: 404, message: 'User not found' };
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

module.exports = { getProfile, updateProfile, follow, unfollow, getFollowers, getFollowing };
