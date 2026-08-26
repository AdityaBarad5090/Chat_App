const Message = require("../models/Message");

const getMessages = async (req, res) => {
    try {
        const { userId, otherUserId } = req.params;
        const messages = await Message.find({
            $or: [
                {
                    sender: userId,
                    receiver: otherUserId
                },
                {
                    sender: otherUserId,
                    receiver: userId
                }
            ]
        }) 
            .populate("sender", "name email")
            .populate("receiver", "name email")
            .sort({ createdAt: 1 });

        res.status(200).json({
            messages
        });

    } catch (error) {

        console.error(
            "Get Messages Error:",
            error
        );

        res.status(500).json({
            message: "Server error"
        });

    }
};

module.exports = {
    getMessages
};