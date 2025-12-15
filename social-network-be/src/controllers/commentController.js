const commentService = require('../services/commentService');
const { emitNotification, emitPostUpdate } = require('../services/realtimeService');
const postRepo = require('../repositories/postRepository');

async function createComment(req, res, next) {
  try {
    const authorId = req.user.id;
    const postId = req.params.postId;
    const { content, parent_comment_id } = req.body;
    const comment = await commentService.createComment({ authorId, postId, content, parentCommentId: parent_comment_id });

    //Lấy thông tin tác giả và emit notification cho tác giả nếu có cmt
    const postData = await postRepo.getPostById(postId);
    if (postData?.author && postData.author.id !== authorId) {
      emitNotification(postData.author.id, {
        type: 'comment',
        postId,
        comment,
        from: authorId,
      });
    }
    // Emit update realtime cho post
    emitPostUpdate(postId, { newComment: comment });

    res.status(201).json({ comment });
  } catch (err) { next(err); }
}

async function getComments(req, res, next) {
  try {
    const postId = req.params.postId;
    const data = await commentService.getComments(postId, req.query.limit || 50);
    res.json({ data });
  } catch (err) { next(err); }
}

module.exports = { createComment, getComments };