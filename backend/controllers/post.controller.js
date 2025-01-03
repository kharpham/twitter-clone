import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";
import Comment from "../models/comment.model.js";
import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";

export const createPost = async (req, res) => {
  const { text } = req.body;
  let { img } = req.body;
  const userId = req.user._id;
  if (!text && !img) {
    return res.status(400).json({ error: "Text or image must be provided" });
  }
  try {
    if (img) {
      const uploadResponse = await cloudinary.uploader.upload(img);
      img = uploadResponse.secure_url;
    }
    const post = new Post({ text, img, user: userId });
    await post.save();
    return res.status(201).json(post);
  } catch (error) {
    console.log("Error in createPost controller:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const deletePost = async (req, res) => {
  const postId = req.params.id;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    if (post.user.toString() !== req.user._id.toString()) {
      return res
        .status(400)
        .json({ error: "You are not authorized to delete this post" });
    }
    if (post.img) {
      const imgId = post.img.split("/").pop().split(".")[0];
      await cloudinary.uploader.destroy(imgId);
    }

    await Post.findByIdAndDelete(postId);
    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError && error.path === "_id") {
      return res.status(404).json({ error: "Post not found" });
    }
    console.log("Error in deletePost controller:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const commentPost = async (req, res) => {
  const postId = req.params.id;
  const { text } = req.body;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    if (!text) {
      return res.status(400).json({ error: "Text must be required" });
    }
    const comment = new Comment({
      text,
      user: req.user._id,
    });
    await comment.save();
    post.comments.push(comment._id);
    await post.save();
    // Create notification
    if (req.user._id.toString() !== post.user._id.toString()) {
      const notification = new Notification({
        from: req.user._id,
        to: post.user,
        type: "comment",
      });
      await notification.save();
    }
    
    // Populate the comments with user details
    const updatedPost = await Post.findById(postId)
      .populate({
        path: 'comments',
        populate: {
          path: 'user',
          select: 'fullname profileImg',
        },
      });

    return res.status(201).json({ message: "Comment created successfully", updatedComments: updatedPost.comments });
  } catch (error) {
    if (error instanceof mongoose.Error.CastError && error.path === "_id") {
      return res.status(404).json({ error: "Post not found" });
    }
    console.log("Error in commentPost controller:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const likeUnlikePost = async (req, res) => {
  const postId = req.params.id;
  const userId = req.user._id;
  try {
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }
    // Unlike
    if (post.likes.includes(userId)) {
      post.likes = post.likes.filter(
        (user) => user._id.toString() !== userId.toString()
      );
      await post.save();
      // Update user's like posts
      await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });
      const updatedLikes = post.likes; 
      return res.status(200).json({ message: "Unlike post successfully", updatedLikes});
    }
    //Like
    else {
      post.likes.push(userId);
      await post.save();
      // Update user's like posts
      await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
      // Create notification
      if (post.user._id.toString() !== req.user._id.toString()) {
        const notification = new Notification({
          from: userId,
          to: post.user,
          type: "like",
        });
        await notification.save();
      }
      const updatedLikes = post.likes;
      return res.status(200).json({ message: "Like post successfully", updatedLikes });
    }
  } catch (error) {
    if (error instanceof mongoose.Error.CastError && error.path === "_id") {
      return res.status(404).json({ error: "Post not found" });
    }
    console.log("Error in likeUnlikePost controller:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "fullname profileImg",
      })
      .populate({
        path: "comments",
        populate: {
          path: "user",
          select: "fullname profileImg",
        },
      });
    if (posts.length === 0) return res.status(200).json([]);
    return res.status(200).json(posts);
  } catch (error) {
    console.log("Error in getAllPosts controller:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const getLikedPosts = async (req, res) => {
  const userId = req.params.id;
  const user = await User.findById(userId);
  try {
    const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "fullname",
      })
      .populate({
        path: "comments",
        populate: {
          path: "user",
          select: "fullname",
        },
      });
    if (!likedPosts) return res.status(200).json([]);
    return res.status(200).json(likedPosts);
  } catch (error) {
    if (error instanceof mongoose.Error.CastError && error.path === "_id") {
      return res.status(404).json({ error: "User not found" });
    }
    console.log("Error in getLikedPosts controller:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const getFollowingPosts = async (req, res) => {
  try {
    const user = req.user;
    const posts = await Post.find({ user: { $in: user.following } })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "fullname",
      })
      .populate({
        path: "comments",
        populate: {
          path: "user",
          select: "fullname",
        },
      });
    if (!posts) return res.status(200).json([]);
    return res.status(200).json(posts);
  } catch (error) {
    console.log("Error in getFollowingPosts controller:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const getUserPosts = async (req, res) => {
  const username = req.params.username;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).json({ error: "User not found" });
    const posts = await Post.find({ user: user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "user",
        select: "username",
      })
      .populate({
        path: "comments",
        populate: {
          path: "user",
          select: "username",
        },
      });
    return res.status(200).json(posts);
  } catch (error) {
    if (error instanceof mongoose.Error.CastError && error.path === "_id") {
      return res.status(404).json({ error: "User not found" });
    }
    console.log("Error in getUserPosts controller:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const replyComment = async (req, res) => {
  const commentId = req.params.commentId;
  const {text} = req.body;
  try {
    const comment = await Comment.findById(commentId);
    if (!comment) return res.status(404).json({ error: "Comment not found" });
    if (!text) return res.status(400).json({error: "Text must be provided"});
    const newComment = new Comment({user: req.user._id, text});
    await newComment.save();
    comment.replies.push(newComment._id);
    await comment.save();
    return res.status(201).json(newComment);
  } catch (error) {
    if (error instanceof mongoose.Error.CastError && error.path === "_id") {
      return res.status(404).json({ error: "Comment not found" });
    }
    console.log("Error in replyComment controller:", error.message);
    return res.status(500).json({ error: error.message });
  }
};
