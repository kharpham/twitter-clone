import Notification from "../models/notification.model.js";
import User from "../models/user.model.js";
import bcrypt from 'bcryptjs';
import {v2 as cloudinary} from 'cloudinary';

export const getUserProfile = async (req, res) => {
  const { username } = req.params;
  try {
    const profile = await User.findOne({ username }).select("-password");
    if (!profile) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.status(200).json(profile);
  } catch (error) {
    console.log("Error in getUserProfile controller:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const followUnfollowUser = async (req, res) => {
  const { id } = req.params;
  const user = req.user;
  try {
    if (id === user._id.toString()) {
      return res
        .status(400)
        .json({ error: "You can not follow/unfollow yourself" });
    }
    const profile = await User.findOne({ _id: id }).select("-password");
    if (!profile) {
      return res.status(404).json({ error: "User not found" });
    }
    // Unfollow
    if (user.following.includes(id)) {
      profile.followers = profile.followers.filter(
        (follower) => !follower.equals(user._id)
      );
      user.following = user.following.filter(
        (following) => !following.equals(profile._id)
      );
      await profile.save();
      await user.save();
      return res.status(200).json({ message: "Unfollowing user successfully" });
    }
    // Follow
    else {
      profile.followers.push(user._id);
      user.following.push(profile._id);
      await profile.save();
      await user.save();

      // Send notification to the user followed
      const newNotification = new Notification({
        from: user._id,
        to: id,
        type: "follow",
      });
      await newNotification.save();
      return res.status(200).json({ message: "Following user successfully" });
    }
  } catch (error) {
    console.log("Error in followUnfollowUser controller:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const getSuggestedUsers = async (req, res) => { 
  try {
    const userId = req.user._id;
    // Get the uses's following
    const following = await User.findById(userId).select("following");
    // Get 4 random users different from the current user and not in the user's following list
    const suggestedUsers = await User.aggregate([
      {
        $match: {
          _id: { $ne: userId, $nin: following.following }, // Exclude the current user and users in the following list
        },
      },
      {
        $project: {
          password: 0,  // Exclude the password field
        },
      },
      { $sample: { size: 4 } }, // Randomly select 4 users
    ]);
    return res.status(200).json(suggestedUsers);
  } catch (error) {
    console.log("Error in getSuggestedUsers controller:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

export const updateUser = async (req, res) => {
    const {fullname, email, username, currentPassword, newPassword, bio, link} = req.body;
    let {profileImg, coverImg} = req.body;
    const userId = req.user._id;
    try {
        const user = await User.findById(userId);
        if ((!newPassword && currentPassword) || (!currentPassword && newPassword)) {
            return res.status(400).json({error: "Please provide both the new password and current password."});
        }
        if (newPassword && currentPassword) {
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) return res.status(400).json({error: "Current password is incorrect"});
            if (newPassword.length < 6) return res.status(400).json({error: "New password must be at least 6 characters long."});
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);    
            user.password = hashedPassword;
        }
        if (profileImg) {
            // Delete old image 
            if (user.profileImg) {
                // https://res.cloudinary.com/afihwoxs/image/upload/v1231231/abcdefg.png => abcdefg
                await cloudinary.uploader.destroy(user.profileImg.split('/').pop().split(".")[0]);
            }
            // Upload image
             const upload = await cloudinary.uploader.upload(profileImg);
             profileImg = upload.secure_url;
        }
        if (coverImg) {
             // Delete old image 
             if (user.coverImg) {
                // https://res.cloudinary.com/afihwoxs/image/upload/v1231231/abcdefg.png => abcdefg
                await cloudinary.uploader.destroy(user.coverImg.split('/').pop().split(".")[0]);
            }
            // Upload image
            const upload = await cloudinary.uploader.upload(coverImg);
            coverImg = upload.secure_url; 
        }
        user.fullname = fullname || user.fullname;
        user.email = email || user.email;
        user.username = username|| user.username;
        user.bio = bio || user.bio;
        user.profileImg = profileImg || user.profileImg;
        user.coverImg = coverImg || user.coverImg;
        user.link = link || user.link;
        const updatedUser = await user.save();
        updatedUser.password = null;
        return res.status(200).json(updatedUser);

    } catch (error) {
        console.log("Error in updateUser controller:", error.message);
        return res.status(500).json({ error: error.message });
    }   
}