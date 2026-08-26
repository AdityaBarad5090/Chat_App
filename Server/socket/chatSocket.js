const Message = require("../models/Message");

const chatSocket = (io) => {
    io.on("connection", (socket) => {

        console.log("User connected:", socket.id);

        socket.on("join", (userId) => {
            socket.join(userId);
            console.log(`User ${userId} joined room`);
        });

        socket.on("send_message", async (data) => {
            try {
                const {
                    senderId,
                    receiverId,
                    message
                } = data;

                const newMessage = await Message.create({
                    sender: senderId,
                    receiver: receiverId,
                    message
                });

                // Get complete message
                const savedMessage = await Message.findById(
                    newMessage._id
                )
                    .populate("sender", "name email")
                    .populate("receiver", "name email");

                // Send message to receiver
                io.to(receiverId).emit(
                    "receive_message",
                    savedMessage
                );

                // Send message back to sender
                io.to(senderId).emit(
                    "receive_message",
                    savedMessage
                );

            } catch (error) {
                console.error(
                    "Send Message Error:",
                    error
                );
            }
        });

        socket.on("disconnect", () => {
            console.log(
                "User disconnected:",
                socket.id
            );
        });
    });
};

module.exports = chatSocket;