"use client";

import { useEffect, useState, useRef } from "react";

import socket from "../../lib/socket";
import { getUser } from "../../lib/auth";
import styles from "./page.module.css";

export default function ChatPage() {
    const [user, setUser] = useState(null);
    const [users, setUsers] = useState([]);
    const [connected, setConnected] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [messageInput, setMessageInput] = useState("");

    const selectedUserRef = useRef(null);

    const [notifications, setNotifications] = useState([]);

    // Logout
    const handleLogout = () => {
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    // Load messages between logged-in user and selected user
    const loadMessages = async (otherUserId) => {
        if (!user) {
            console.log("User not available yet");
            return;
        }

        try {
            const response = await fetch(
                `http://localhost:5000/api/messages/${user.id}/${otherUserId}`
            );

            const data = await response.json();

            if (!response.ok) {
                console.error(
                    "Get messages error:",
                    data.message
                );
                return;
            }

            setMessages(data.messages);

        } catch (error) {
            console.error(
                "Load messages error:",
                error
            );
        }
    };

    // Send message
    const sendMessage = () => {
        if (!messageInput.trim()) {
            return;
        }

        if (!selectedUser) {
            return;
        }

        if (!user) {
            return;
        }

        socket.emit("send_message", {
            senderId: user.id,
            receiverId: selectedUser._id,
            message: messageInput.trim()
        });

        setMessageInput("");
    };

    // Socket + Users
    useEffect(() => {
        const loggedInUser = getUser();

        if (!loggedInUser) {
            window.location.href = "/login";
            return;
        }

        setUser(loggedInUser);

        // Socket connection
        socket.connect();

        socket.on("connect", () => {
            console.log(
                "Socket connected:",
                socket.id
            );

            setConnected(true);

            socket.emit(
                "join",
                loggedInUser.id
            );
        });

        // Receive message
        socket.on("receive_message", (newMessage) => {
            console.log("Received message:", newMessage);

            const senderId =
                newMessage.sender?._id?.toString();

            const receiverId =
                newMessage.receiver?._id?.toString();

            const currentSelectedUserId =
                selectedUserRef.current?._id?.toString();

            const currentUserId =
                loggedInUser.id?.toString();

            // Message is from the currently opened user
            const isFromSelectedUser =
                senderId === currentSelectedUserId;

            // Message was sent by me to the currently opened user
            const isMyMessageToSelectedUser =
                senderId === currentUserId &&
                receiverId === currentSelectedUserId;

            if (
                isFromSelectedUser ||
                isMyMessageToSelectedUser
            ) {
                setMessages((previousMessages) => {

                    const alreadyExists =
                        previousMessages.some(
                            (item) =>
                                item._id?.toString() ===
                                newMessage._id?.toString()
                        );

                    if (alreadyExists) {
                        return previousMessages;
                    }

                    return [
                        ...previousMessages,
                        newMessage
                    ];
                });

                return;
            }

            // Message from another user
            setNotifications((previousNotifications) => {

                const alreadyExists =
                    previousNotifications.some(
                        (item) =>
                            item.messageId ===
                            newMessage._id?.toString()
                    );

                if (alreadyExists) {
                    return previousNotifications;
                }

                return [
                    ...previousNotifications,
                    {
                        messageId:
                            newMessage._id?.toString(),

                        senderId:
                            senderId,

                        senderName:
                            newMessage.sender?.name,

                        message:
                            newMessage.message
                    }
                ];
            });
        });

        // Socket disconnected
        socket.on("disconnect", () => {
            setConnected(false);
        });

        // Get all users
        const fetchUsers = async () => {
            try {
                const response = await fetch(
                    "http://localhost:5000/api/users"
                );

                const data =
                    await response.json();

                if (response.ok) {

                    const otherUsers =
                        data.users.filter(
                            (item) =>
                                item._id !==
                                loggedInUser.id
                        );

                    setUsers(otherUsers);
                }

            } catch (error) {
                console.error(
                    "Fetch users error:",
                    error
                );
            }
        };

        fetchUsers();

        // Cleanup
        return () => {
            socket.off("connect");
            socket.off("disconnect");
            socket.off("receive_message");
            socket.disconnect();
        };

    }, []);

    // Loading
    if (!user) {
        return (
            <div className={styles.loading}>
                Loading...
            </div>
        );
    }

    return (
        <div className={styles.container}>

            {/* LEFT SIDEBAR */}

            <div className={styles.sidebar}>

                <h1>Chat App</h1>

                {/* Welcome */}

                <div className={styles.welcome}>
                    Welcome, <strong>{user.name}</strong>
                </div>

                {/* Status */}

                <p className={styles.status}>
                    {connected
                        ? "🟢 Online"
                        : "🔴 Offline"}
                </p>

                {/* Logout */}

                <button
                    className={styles.logoutButton}
                    onClick={handleLogout}
                >
                    Logout
                </button>

                <hr />

                {/* Users */}

                <h2>Users</h2>

                <div className={styles.userList}>

                    {users.length === 0 ? (

                        <p className={styles.noUsers}>
                            No other users found
                        </p>

                    ) : (

                        users.map((item) => {

                            // Notification count for this user
                            const notificationCount =
                                notifications.filter(
                                    (notification) =>
                                        notification.senderId ===
                                        item._id.toString()
                                ).length;

                            return (
                                <div
                                    key={item._id}

                                    className={`${styles.userItem} ${selectedUser?._id ===
                                            item._id
                                            ? styles.selectedUser
                                            : ""
                                        }`}

                                    onClick={() => {

                                        // Select user
                                        setSelectedUser(item);

                                        // Update ref
                                        selectedUserRef.current =
                                            item;

                                        // Remove notifications
                                        // for selected user
                                        setNotifications(
                                            (previous) =>
                                                previous.filter(
                                                    (notification) =>
                                                        notification.senderId !==
                                                        item._id.toString()
                                                )
                                        );

                                        // Load chat messages
                                        loadMessages(
                                            item._id
                                        );
                                    }}
                                >

                                    {/* User name + notification */}

                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent:
                                                "space-between",
                                            alignItems:
                                                "center"
                                        }}
                                    >

                                        <h3>
                                            {item.name}
                                        </h3>

                                        {notificationCount >
                                            0 && (
                                                <span
                                                    style={{
                                                        background:
                                                            "red",
                                                        color:
                                                            "white",
                                                        borderRadius:
                                                            "50%"
                                                    }}
                                                >
                                                    <span className={styles.badge}>{notificationCount}</span>
                                                </span>
                                            )}

                                    </div>

                                    {/* User email */}

                                    <p>
                                        {item.email}
                                    </p>

                                </div>
                            );
                        })

                    )}

                </div>

            </div>

            {/* CHAT AREA */}

            <div className={styles.chatArea}>

                {selectedUser ? (

                    <>

                        {/* CHAT HEADER */}

                        <div className={styles.chatHeader}>

                            <h1>
                                Chat with{" "}
                                {selectedUser.name}
                            </h1>

                            <p>
                                {selectedUser.email}
                            </p>

                        </div>

                        {/* MESSAGES */}

                        <div className={styles.messages}>

                            {messages.length === 0 ? (

                                <p
                                    className={
                                        styles.noMessages
                                    }
                                >
                                    No messages yet.
                                </p>

                            ) : (

                                messages.map((item) => {

                                    const senderId =
                                        item.sender?._id?.toString();

                                    const myId =
                                        user.id?.toString();

                                    const isMine =
                                        senderId === myId;

                                    return (

                                        <div
                                            key={
                                                item._id?.toString()
                                            }

                                            className={
                                                isMine
                                                    ? `${styles.message} ${styles.sent}`
                                                    : `${styles.message} ${styles.received}`
                                            }
                                        >
                                            {item.message}
                                        </div>

                                    );
                                })

                            )}

                        </div>

                        {/* MESSAGE INPUT */}

                        <div className={styles.inputArea}>

                            <input
                                className={styles.input}
                                type="text"
                                placeholder="Type a message..."
                                value={messageInput}

                                onChange={(e) =>
                                    setMessageInput(
                                        e.target.value
                                    )
                                }

                                onKeyDown={(e) => {

                                    if (
                                        e.key ===
                                        "Enter"
                                    ) {
                                        sendMessage();
                                    }

                                }}
                            />

                            <button
                                className={
                                    styles.sendButton
                                }
                                onClick={sendMessage}
                            >
                                Send
                            </button>

                        </div>

                    </>

                ) : (

                    <div
                        className={
                            styles.emptyChat
                        }
                    >

                        <h1>
                            Select a user to start
                            chatting
                        </h1>

                        <p>
                            Choose someone from the
                            users list.
                        </p>

                    </div>

                )}

            </div>

        </div>
    );
}