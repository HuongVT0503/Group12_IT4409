import * as postRepo from '../repositories/postRepository.js';

export async function deletePost(req, res, next) {
  try {
    const postId = req.params.id;

    await postRepo.deletePost(postId, req.user.id);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
