import Post from "../models/post.model.js";
import Comment from "../models/comment.model.js";
import Notification from "../models/notification.model.js";
import { v2 as cloudinary } from "cloudinary";
import mongoose from "mongoose";

export const createPost = async (req, res) => {
    const {text} = req.body;
    let {img} = req.body;
    const userId = req.user._id;
    if (!text && !img) {
        return res.status(400).json({error: "Text or image must be provided"});
    }
    try {
        if (img) {
            const uploadResponse = await cloudinary.uploader.upload(img);
            img = uploadResponse.secure_url;
        }
        const post = new Post({text, img, user: userId});
        await post.save();
        return res.status(201).json(post);
    } catch (error) {
        console.log("Error in createPost controller:", error.message);
        return res.status(500).json({error: error.message});
    }
};

export const deletePost = async (req, res) => {
    const postId = req.params.id;
    try {
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({error: "Post not found"});
        }
        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(400).json({error: "You are not authorized to delete this post"});
        }
        if (post.img) {
            const imgId = post.img.split("/").pop().split(".")[0];
            await cloudinary.uploader.destroy(imgId);
        }

        await Post.findByIdAndDelete(postId);
        return res.status(200).json({message: "Post deleted successfully"});
        
    } catch (error) {
        if (error instanceof mongoose.Error.CastError && error.path === "_id") {
            return res.status(404).json({ error: "Post not found" });
        }
        console.log("Error in deletePost controller:", error.message);
        return res.status(500).json({error: error.message});
    }
};

export const commentPost = async (req, res) => {
    const postId = req.params.id;
    const {text} = req.body;
    try {
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({error: "Post not found"});
        }
        if (!text) {
            return res.status(400).json({error: "Text must be required"});
        }
        const comment = new Comment({
            text,
            user: req.user._id,
        });
        await comment.save();
        post.comments.push(comment._id);
        await post.save();
        // Create notification
        const notification = new Notification({from: req.user._id, to: post.user, type: "comment"});
        await notification.save();
        return res.status(201).json({message: "Comment created successfully"})
    } catch (error) {
        if (error instanceof mongoose.Error.CastError && error.path === "_id") {
            return res.status(404).json({ error: "Post not found" });
        }
        console.log("Error in commentPost controller:", error.message);
        return res.status(500).json({error: error.message});
    }
};

export const likeUnlikePost = async (req, res) => {
    const postId = req.params.id;
    const userId = req.user._id;
    try {
        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({error: "Post not found"});
        }
        // Unlike
        if (post.likes.includes(userId)) {
            post.likes = post.likes.filter(user => user._id.toString() !== userId.toString());
            await post.save();
            return res.status(200).json({message: "Unlike post successfully"});
        }
        //Like
        else {
            post.likes.push(userId);
            await post.save();
            // Create notification
            const notification = new Notification({from: userId, to: post.user, type:"like"});
            await notification.save();
            return res.status(200).json({message: "Like post successfully"});
        }
        
    } catch (error) {
        if (error instanceof mongoose.Error.CastError && error.path === "_id") {
            return res.status(404).json({ error: "Post not found" });
        }
        console.log("Error in likeUnlikePost controller:", error.message);
        return res.status(500).json({error: error.message});
    }
};

export const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find().sort({createdAt: -1}).populate({
            path: "user",
            select: "fullname", 
        }).populate({
            path: "comments",
            populate: {
                path: "user",
                select: "fullname",
            }
        });
        if (posts.length === 0) return res.status(200).json([]);
        return res.status(200).json(posts);
    } catch (error) {
        console.log("Error in getAllPosts controller:", error.message);
        return res.status(500).json({error: error.message});
    }
};