import express from 'express';
import { createPost, deletePost, commentPost, likeUnlikePost, getAllPosts, getLikedPosts, getFollowingPosts, getUserPosts, replyComment } from '../controllers/post.controller.js';
import { protectRoute } from '../middlewares/protectRoute.js';

const router = express.Router();

router.get('/all', protectRoute, getAllPosts);
router.get('/following', protectRoute, getFollowingPosts);
router.get('/user/:username', protectRoute, getUserPosts);
router.get('/likes/:id', protectRoute, getLikedPosts)
router.post('/create', protectRoute, createPost);
router.post('/like/:id', protectRoute, likeUnlikePost);
router.post('/comment/:id', protectRoute, commentPost);
router.post('/reply/:commentId', protectRoute, replyComment);
router.delete("/:id", protectRoute, deletePost);

export default router; 