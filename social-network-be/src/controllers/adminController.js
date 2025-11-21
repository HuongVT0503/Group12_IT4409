
async function deletePost(req, res, next) {
  try {
    const postId = req.params.id;
    const postRepo = require('../repositories/postRepository.js');
    await postRepo.deletePost(postId, req.user.id); 
    res.status(204).send();
  } catch (err) { next(err); }
}

module.exports = { deletePost };
