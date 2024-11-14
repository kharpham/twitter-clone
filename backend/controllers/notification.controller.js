import Notification from "../models/notification.model.js";
import mongoose from "mongoose";
export const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({to: req.user._id, from: {$ne: req.user._id} }).sort({createdAt: -1})
        .populate({
            path: 'from',
            select: 'username profileImg',
        });
        await Notification.updateMany({to: req.user._id, from: {$ne: req.user._id}}, {read: true});
        return res.status(200).json(notifications);
    } catch (error) {
        console.log("Error in getNotifications controller: ", error.message);
        return res.status(500).json({error: error.message});
    }
};

export const deleteNotifications = async (req, res) => {
    try {
        await Notification.deleteMany({to: req.user._id});
        return res.status(200).json({message: "Notifications deleted successfully"});
    } catch (error) {
        console.log("Error in deleteNotifications controller: ", error.message);
        return res.status(500).json({error: error.message});
    }
};

export const deleteSingleNotification = async (req, res) => {
    const notificationId = req.params.id;
    try {
        const notification = await Notification.findById(notificationId);
        if (!notification) return res.status(404).json({error: "Notification not found"});
        if (notification.to.toString() !== req.user._id.toString()) return res.status(400).json({error: "You are not authorized to delete this notification"});
        await Notification.deleteOne({_id: notificationId});
        return res.status(200).json({message: "Notification deleted successfully"});
    } catch (error) {
        console.log("Error in deleteSingleNotification:", error.message);
        if (error instanceof mongoose.Error.CastError && error.path === "_id") {
            return res.status(404).json({ error: "Notification not found" });
        }
        return res.status(500).json({error: error.message});
    }
}