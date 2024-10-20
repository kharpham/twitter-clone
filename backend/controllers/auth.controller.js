import bcrypt from "bcryptjs";
import {generateTokenAndSetCookie} from "../lib/utils/generateToken.js";
import User from "../models/user.model.js";

export const signup = async (req, res) => {
  try {
    const { fullname, username, email, password, confirmation } = req.body;
    // Check if all fields are filled
    if (!fullname || !username || !email || !password || !confirmation) {
      return res.status(400).json({ error: "All fields are required" });
    }
    // Check if email is valid
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email" });
    }
    // Check if username already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }
    // Check if email already exists
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already taken" });
    }
    // Check if password is valid
    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }
    // Check if password matches confirmation
    if (password !== confirmation) {
      return res.status(400).json({ error: "Passwords do not match" });
    }
    // Generate hashed password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    // Create new user in application's memory
    const newUser = new User({
      username,
      fullname,
      email,
      password: hashedPassword,
    });
    if (newUser) {
      // Save the user to the database
      await newUser.save();
      generateTokenAndSetCookie(newUser._id, res);
      res.status(201).json({
        _id: newUser._id,
        fullname: newUser.fullname,
        username: newUser.username,
        email: newUser.email,
        followers: newUser.followers,
        following: newUser.following,
        profileImg: newUser.profileImg,
        coverImg: newUser.coverImg,
      });
    } else {
      return res.status(400).json({ error: "Invalid user data" });
    }
  } catch (error) {
    console.log("Error found in signup controller", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
export const login = async (req, res) => {
  try {
    const {username, password} = req.body
    const user = await User.findOne({username})
    const isPasswordCorrect = await bcrypt.compare(password, user?.password || "")
    if (!user || !isPasswordCorrect) {
      return res.status(400).json({error: "Invalid username or password"});
    }
    generateTokenAndSetCookie(user._id, res)
    res.status(200).json({
        _id: user._id,
        fullname: user.fullname,
        username: user.username,
        email: user.email,
        followers: user.followers,
        following: user.following,
        profileImg: user.profileImg,
        coverImg: user.coverImg,
    });
  } catch (error) {
    console.log("Error found in login controller", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};
export const logout = async (req, res) => {
  try {
    res.cookie("jwt", "", {maxAge: 0});
    res.status(200).json({message: "Logged out successfully"});
  } catch (error) {
    res.status(500).json({error: "Internal server error"});
  }
};

// Check if user is authenticated
export const getMe = async (req, res) => {
  try {
    const user = req.user;
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({error: "Internal server error"});
  }
}