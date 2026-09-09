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
    const [showVideoCall, setShowVideoCall] = useState(false);
    const [localStream, setLocalStream] = useState(null);
    const [remoteStream, setRemoteStream] = useState(null);
    const [incomingCall, setIncomingCall] = useState(null);

    const localVideoRef = useRef(null);
    const selectedUserRef = useRef(null);
    const messagesEndRef = useRef(null);
    const peerConnectionRef = useRef(null);

    const [notifications, setNotifications] = useState([]);

    // Logout
    const handleLogout = () => {
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    const startCamera = async (remoteUserId) => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true,
            });

            setLocalStream(stream);
            setShowVideoCall(true);

            console.log("Camera and microphone access granted");

            const peerConnection = createPeerConnection(stream, remoteUserId);

            console.log("Peer connection ready:", peerConnection);

        } catch (error) {
            console.error("Camera/microphone access error:", error);
        }
    };

    const createPeerConnection = (stream, remoteUserId) => {
        const peerConnection = new RTCPeerConnection({
            iceServers: [
                {
                    urls: "stun:stun.l.google.com:19302"
                }
            ]
        });

        // Add local audio/video tracks
        stream.getTracks().forEach((track) => {
            peerConnection.addTrack(track, stream);
        });

        // Send ICE candidates to the other user
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("ice_candidate", {
                    receiverId: remoteUserId,
                    candidate: event.candidate,
                });

                console.log("ICE candidate sent");
            }
        };

        // Receive remote audio/video
        peerConnection.ontrack = (event) => {
            console.log("Remote track received");

            const [remoteStream] = event.streams;

            if (remoteStream) {
                setRemoteStream(remoteStream);
            }
        };

        peerConnectionRef.current = peerConnection;

        console.log("RTCPeerConnection created");
        console.log("Local tracks added:", stream.getTracks());

        return peerConnection;
    };

    const callUser = async () => {
        if (!selectedUser) {
            console.log("No user selected");
            return;
        }

        if (!user) {
            console.log("User not available");
            return;
        }

        if (!peerConnectionRef.current) {
            console.log("Peer connection not available");
            return;
        }

        try {
            // Create WebRTC offer
            const offer = await peerConnectionRef.current.createOffer();

            console.log("Offer created:", offer);

            // Save offer as local description
            await peerConnectionRef.current.setLocalDescription(offer);

            console.log("Local description set");

            // Send offer to the other user
            socket.emit("call_user", {
                receiverId: selectedUser._id,
                caller: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                },
                offer: offer,
            });

            console.log("Offer sent to:", selectedUser.name);

        } catch (error) {
            console.error("Create offer error:", error);
        }
    };

    const acceptCall = async () => {
        try {
            console.log("Call accepted");

            if (!incomingCall?.offer) {
                console.log("No offer received");
                return;
            }

            // Start camera and microphone
            await startCamera(incomingCall.caller.id);

            const peerConnection = peerConnectionRef.current;

            if (!peerConnection) {
                console.log("Peer connection not available");
                return;
            }

            // Set caller's offer as remote description
            await peerConnection.setRemoteDescription(
                new RTCSessionDescription(incomingCall.offer)
            );

            console.log("Remote offer set");

            // Create answer
            const answer = await peerConnection.createAnswer();

            console.log("Answer created:", answer);

            // Save answer as local description
            await peerConnection.setLocalDescription(answer);

            console.log("Local description set for answer");

            // Send answer back to caller
            socket.emit("answer_call", {
                callerId: incomingCall.caller.id,
                answer: answer,
            });

            console.log("Answer sent to caller");

            setIncomingCall(null);

        } catch (error) {
            console.error("Accept call error:", error);
        }
    };

    const rejectCall = () => {
        console.log("Call rejected");

        setIncomingCall(null);
    };

    // Load messages between logged-in user and selected user
    const loadMessages = async (otherUserId) => {
        if (!user) {
            console.log("User not available yet");
            return;
        }

        try {
            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/messages/${user.id}/${otherUserId}`
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

        socket.on("incoming_call", (data) => {
            console.log("Incoming call from:", data.caller);
            console.log("Incoming offer:", data.offer);

            setIncomingCall({
                caller: data.caller,
                offer: data.offer,
            });
        });

        socket.on("call_answered", async (data) => {
            try {
                console.log("Call answered");

                if (!peerConnectionRef.current) {
                    console.log("Peer connection not available");
                    return;
                }

                await peerConnectionRef.current.setRemoteDescription(
                    new RTCSessionDescription(data.answer)
                );

                console.log("Remote answer set");

            } catch (error) {
                console.error("Set remote answer error:", error);
            }
        });

        socket.on("ice_candidate", async ({ candidate }) => {
            try {
                if (!peerConnectionRef.current || !candidate) {
                    return;
                }

                await peerConnectionRef.current.addIceCandidate(
                    new RTCIceCandidate(candidate)
                );

                console.log("ICE candidate added");

            } catch (error) {
                console.error("Add ICE candidate error:", error);
            }
        });

        // Socket disconnected
        socket.on("disconnect", () => {
            setConnected(false);
        });

        // Get all users
        const fetchUsers = async () => {
            try {
                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/users`
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
            socket.off("incoming_call");
            socket.off("call_answered");
            socket.off("ice_candidate");
            socket.disconnect();
        };

    }, []);

    useEffect(() => {
        if (remoteVideoRef.current && remoteStream) {
            remoteVideoRef.current.srcObject = remoteStream;
        }
    }, [remoteStream]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

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

            {incomingCall && (
                <div className={styles.incomingCall}>
                    <div className={styles.incomingCallBox}>
                        <h2>📹 Incoming Video Call</h2>

                        <p>
                            {incomingCall.caller.name} is calling you
                        </p>

                        <div className={styles.callButtons}>
                            <button
                                className={styles.acceptCallButton}
                                onClick={acceptCall}
                            >
                                Accept
                            </button>

                            <button
                                className={styles.rejectCallButton}
                                onClick={rejectCall}
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* LEFT SIDEBAR */}

            <div className={`${styles.sidebar} ${selectedUser ? styles.sidebarHiddenMobile : styles.sidebarActiveMobile}`}>

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
                                                <span className={styles.badge}>{notificationCount}</span>
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

            <div className={`${styles.chatArea} ${selectedUser ? styles.chatAreaActiveMobile : styles.chatAreaHiddenMobile}`}>

                {selectedUser ? (

                    <>

                        {/* CHAT HEADER */}

                        <div className={styles.chatHeader}>

                            <button
                                className={styles.backButton}
                                onClick={() => {
                                    setSelectedUser(null);
                                    selectedUserRef.current = null;
                                }}
                                aria-label="Back to contact list"
                            >
                                ←
                            </button>

                            <div className={styles.chatHeaderInfo}>
                                <h1>
                                    Chat with{" "}
                                    {selectedUser.name}
                                </h1>

                                <p>
                                    {selectedUser.email}
                                </p>
                            </div>

                            {/* Video Call Button */}
                            <button
                                className={styles.videoCallButton}
                                onClick={async () => {
                                    await startCamera(selectedUser._id);
                                    await callUser();
                                }}
                                title="Start video call"
                                aria-label="Start video call"
                            >
                                📹
                            </button>

                        </div>
                        {showVideoCall && (
                            <div className={styles.videoCallContainer}>

                                <video
                                    ref={remoteVideoRef}
                                    autoPlay
                                    playsInline
                                    className={styles.remoteVideo}
                                />

                                <video
                                    ref={localVideoRef}
                                    autoPlay
                                    playsInline
                                    muted
                                    className={styles.localVideo}
                                />

                            </div>
                        )}

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
                            <div ref={messagesEndRef} />

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
                    <div className={styles.emptyChat}>
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