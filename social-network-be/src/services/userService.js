import { v4 as uuidv4 } from "uuid";
import * as userRepo from "../repositories/userRepository.js";
import * as adminRepo from "../repositories/adminRepository.js";
import * as notificationRepo from "../repositories/notificationRepository.js";
import { emitNotification } from "./realtimeService.js";

async function getProfile(usernameOrId) {
  // allow id or username
  let user = null;
  if (usernameOrId.includes("-")) {
    user = await userRepo.findById(usernameOrId);
  }
  if (!user) user = await userRepo.findByUsername(usernameOrId);
  if (!user) throw { status: 404, message: "User not found" };
  if (user.isBanned) throw { status: 403, message: "User not exist" };
  return user;
}

async function updateProfile(userId, patch) {
  const allowed = {};
  [
    "display_name",
    "bio",
    "avatar_url",
    "cover_url",
    "date_of_birth",
    "gender",
    "phone",
  ].forEach((k) => {
    if (patch[k] !== undefined) allowed[k] = patch[k];
  });
  if (!Object.keys(allowed).length)
    throw { status: 400, message: "No valid fields to update" };
  return await userRepo.updateProfile(userId, allowed);
}

async function follow(followerId, followeeId) {
  if (followerId === followeeId)
    throw { status: 400, message: "Cannot follow yourself" };
  await userRepo.followUser(followerId, followeeId);
  
  const notifId = uuidv4();
  const notifData = {
    from: followerId,
  };
  
  await notificationRepo.createNotification({
    id: notifId,
    userId: followeeId,
    type: "follow",
    data: JSON.stringify(notifData),
  });

  emitNotification(followeeId, {
    id: notifId,
    type: "follow",
    created_at: new Date().toISOString(),
    read: false,
    data: notifData,
  });
  
  return true;
}

async function unfollow(followerId, followeeId) {
  await userRepo.unfollowUser(followerId, followeeId);
  return true;
}

async function getFollowers(userId, limit) {
  return userRepo.getFollowers(userId, limit);
}
async function getFollowing(userId, limit) {
  return userRepo.getFollowing(userId, limit);
}

async function searchUsers(q, limit = 50, skip = 0) {
  if (!q || !q.trim()) return [];
  return userRepo.searchByUsername(q.trim(), limit, skip);
}

async function createUserReport(reporterId, data) {
  const { targetId, targetType, reason } = data;
  if (!targetId || !targetType || !reason) {
    throw { status: 400, message: "Lack of reporting information" };
  }
  const validTypes = ["User", "Post"];
  if (!validTypes.includes(targetType)) {
    throw { status: 400, message: "The report is invalid" };
  }
  if (targetType === "User" && reporterId === targetId) {
    throw { status: 400, message: "Unable to report youself" };
  }
  const reportId = uuidv4();

  const success = await userRepo.createReport({
    reportId,
    reporterId,
    targetId,
    targetType,
    reason,
  });

  if (success) {
    const reporter = await userRepo.findById(reporterId);

    let targetName = "content";
    if (targetType === "User") {
      const targetUser = await userRepo.findById(targetId);
      targetName = targetUser ? targetUser.display_name : "Unknown User";
    } else if (targetType === "Post") {
      targetName = "a post";
    }


    const allUsers = await adminRepo.findAllUsers("all");
    const admins = allUsers.filter((u) => u.role === "admin");


    const notifPromises = admins.map(async (admin) => {
      const notifId = uuidv4();
      const notifData = {
        //id: notifId,
        from: reporterId,
        type: "report",
        targetType: targetType,
        text: `reported a ${targetType.toLowerCase()}`,
        reason: reason,
        targetId: targetId,
        reportId: reportId,
        senderName: reporter.display_name,
        senderAvatar: reporter.avatar_url,
      };
      //save to db
      await notificationRepo.createNotification({
        id: notifId,
        userId: admin.userId,
        type: "report",
        data: JSON.stringify(notifData),
      });

      emitNotification(admin.userId, {
        id: notifId,
        type: "report",
        created_at: new Date().toISOString(),
        read: false,
        data: notifData,
      });
    });

    await Promise.all(notifPromises);
  }

return success;
}
export {
  getProfile,
  updateProfile,
  follow,
  unfollow,
  getFollowers,
  getFollowing,
  searchUsers,
  createUserReport,
};
