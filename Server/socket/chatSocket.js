const Message = require("../models/Message");

const AI_BOT_ID = "6a956d30ee60127473da7da5"; // Your AI Bot's MongoDB ID

// Calls Gemini API and returns the AI's reply text
const getGeminiReply = async (userMessage) => {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: userMessage }]
                        }
                    ],
                    systemInstruction: {
                        parts: [{
                            text: "You are a friendly chat assistant inside a messaging app. Reply in plain conversational text only — no markdown, no asterisks, no headers, no bullet points, no bold text. Keep every response short: 1 to 4 sentences maximum, like a real person texting in a chat app. If the question truly needs more detail, give the short version first and ask if they want more."
                        }]
                    },
                    generationConfig: {
                        maxOutputTokens: 400
                    }
                })
            }
        );

        const data = await response.json();

        if (data.error) {
            console.error("Gemini API Error:", data.error);
            return "Sorry, I'm having trouble responding right now.";
        }

        const reply =
            data.candidates?.[0]?.content?.parts?.[0]?.text;

        return reply || "Sorry, I couldn't generate a response.";

    } catch (error) {
        console.error("Gemini Fetch Error:", error);
        return "Sorry, I'm having trouble responding right now.";
    }
};

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

                const savedMessage = await Message.findById(
                    newMessage._id
                )
                    .populate("sender", "name email")
                    .populate("receiver", "name email");

                io.to(receiverId).emit(
                    "receive_message",
                    savedMessage
                );

                io.to(senderId).emit(
                    "receive_message",
                    savedMessage
                );

                // If the message was sent to the AI Bot, generate a reply
                if (receiverId === AI_BOT_ID) {

                    const botReplyText = await getGeminiReply(message);

                    const botMessage = await Message.create({
                        sender: AI_BOT_ID,
                        receiver: senderId,
                        message: botReplyText
                    });

                    const savedBotMessage = await Message.findById(
                        botMessage._id
                    )
                        .populate("sender", "name email")
                        .populate("receiver", "name email");

                    io.to(senderId).emit(
                        "receive_message",
                        savedBotMessage
                    );
                }

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