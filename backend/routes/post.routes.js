import express from 'express';
import { createPost, deletePost, commentPost, likeUnlikePost, getAllPosts } from '../controllers/post.controller.js';
import { protectRoute } from '../middlewares/protectRoute.js';

const router = express.Router();

router.get('/all', protectRoute, getAllPosts);
router.post('/create', protectRoute, createPost);
router.post('/like/:id', protectRoute, likeUnlikePost);
router.post('/comment/:id', protectRoute, commentPost);
router.delete("/:id", protectRoute, deletePost);

export default router; 