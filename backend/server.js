import express from "express";
import dotenv from "dotenv";
import { v2 as cloudinary } from 'cloudinary';

// Get routes
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js"; 
import postRoutes from "./routes/post.route.js";
import notificationRoutes from "./routes/notification.route.js";
import connectMongoDB from "./db/connectMongoDb.js";
import cookieParser from "cookie-parser";

dotenv.config();
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET, // Click 'View API Keys' above to copy your API secret
});


const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json()); // parse request.body
app.use(express.urlencoded({extended: true})) // to parse form data(urlencoded)
app.use(cookieParser()) // to parse cookie data

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/post", postRoutes);
app.use("/api/notifications", notificationRoutes);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectMongoDB();
});


