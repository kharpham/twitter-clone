import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    replies: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Post',
            default: [],
        }
    ]
}, {timestamps: true});

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;