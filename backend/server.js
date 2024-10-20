import express from "express";
import dotenv from "dotenv";

// Get routes
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js"; 
import connectMongoDB from "./db/connectMongoDb.js";
import cookieParser from "cookie-parser";

dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json()); // parse request.body
app.use(express.urlencoded({extended: true})) // to parse form data(urlencoded)
app.use(cookieParser()) // to parse cookie data

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    connectMongoDB();
});


