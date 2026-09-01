"use client";

import { useEffect, useState } from "react";
import socket from "../../lib/socket";
import { getUser } from "../../lib/auth";

export default function SocketTest() {

    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState([]);

    const [user, setUser] = useState(null);

    const receiverId = "YOUR_RAHUL_ID";

    useEffect(() => {

        const loggedInUser = getUser();

        if (!loggedInUser) {
            return;
        }

        setUser(loggedInUser);

        socket.connect();

        socket.emit(
            "join",
            loggedInUser.id
        );

        const handleMessage = (data) => {

            console.log(
                "Received message:",
                data
            );

            setMessages((prev) => [
                ...prev,
                data
            ]);
        };

        socket.on(
            "receive_message",
            handleMessage
        );

        return () => {

            socket.off(
                "receive_message",
                handleMessage
            );

            socket.disconnect();
        };

    }, []);

    const sendMessage = () => {

        if (!message.trim() || !user) {
            return;
        }

        socket.emit("send_message", {
            senderId: user.id,
            receiverId,
            message
        });

        setMessage("");
    };

    return (
        <div style={{ padding: "20px 16px", maxWidth: "600px", margin: "0 auto", boxSizing: "border-box" }}>

            <h1>
                Chat Test
            </h1>

            {user && (
                <p style={{ margin: "12px 0" }}>
                    Logged in as:{" "}
                    <strong>
                        {user.name}
                    </strong>
                </p>
            )}

            <div style={{ margin: "16px 0", minHeight: "100px" }}>
                {messages.map((item) => (
                    <p key={item._id} style={{ margin: "6px 0", wordBreak: "break-word" }}>
                        <strong>
                            {item.sender?.name || "User"}:
                        </strong>{" "}
                        {item.message}
                    </p>
                ))}
            </div>

            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <input
                    value={message}
                    onChange={(e) =>
                        setMessage(e.target.value)
                    }
                    placeholder="Type message..."
                    style={{ flex: "1 1 200px", padding: "12px", fontSize: "16px", borderRadius: "6px", border: "1px solid #444" }}
                />

                <button onClick={sendMessage} style={{ padding: "12px 20px", fontSize: "16px", borderRadius: "6px", cursor: "pointer" }}>
                    Send
                </button>
            </div>

        </div>
    );
}