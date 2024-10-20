import User from "../models/user.model.js";


export const getUserProfile = async (req, res) => {
    const {username} = req.params;
    try {
        const profile = await User.findOne({username}).select("-password");
        if (!profile) {
            return res.status(404).json({error: "User not found"});
        }
        return res.status(200).json(profile)
    } catch (error) {
        console.log("Error in getUserProfile controller:", error.message);
        return res.status(500).json({error: error.message})
    }
};

export const followUnfollowUser = async (req, res) => {
    const {id} = req.params;
    const user = req.user;
    try {
        if (id === user._id) {
            return res.status(400).json({error: "You can not follow/unfollow yourself"});
        }
        const profile = await User.findOne({_id: id}).select("-password");
        if (!profile) {
            return res.status(404).json({error: "User not found"});
        }
        // Unfollow
        if (user.following.includes(id)) {
            profile.followers = profile.followers.filter(follower => !follower.equals(user._id));
            user.following = user.following.filter(following => !following.equals(profile._id));
            await profile.save();
            await user.save();
            return res.status(200).json({message: "Unfollowing user successfully"});
        }
        // Follow
        else {
            profile.followers.push(user._id);
            user.following.push(profile._id);
            await profile.save();
            await user.save();
            return res.status(200).json({message: "Following user successfully"});
        }
        
    } catch (error) {
        console.log("Error in followUnfollowUser controller:", error.message);
        return res.status(500).json({error: error.message})
    }
};