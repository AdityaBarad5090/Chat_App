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
        <div style={{ padding: "30px" }}>

            <h1>
                Chat Test
            </h1>

            {user && (
                <p>
                    Logged in as:{" "}
                    <strong>
                        {user.name}
                    </strong>
                </p>
            )}

            <div>
                {messages.map((item) => (
                    <p key={item._id}>
                        <strong>
                            {item.sender.name}:
                        </strong>{" "}
                        {item.message}
                    </p>
                ))}
            </div>

            <input
                value={message}
                onChange={(e) =>
                    setMessage(e.target.value)
                }
                placeholder="Type message..."
            />

            <button onClick={sendMessage}>
                Send
            </button>

        </div>
    );
}