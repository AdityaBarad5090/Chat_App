"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {

    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {

        e.preventDefault();

        setError("");
        setLoading(true);

        try {

            const response = await fetch(
                "http://localhost:5000/api/auth/login",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || "Login failed");
                return;
            }

            // Save JWT
            localStorage.setItem(
                "token",
                data.token
            );

            // Save logged-in user
            localStorage.setItem(
                "user",
                JSON.stringify(data.user)
            );

            console.log("Login successful:", data);

            // Go to chat page
            router.push("/chat");

        } catch (error) {

            console.error(error);

            setError(
                "Unable to connect to server"
            );

        } finally {

            setLoading(false);

        }
    };

    return (
        <div style={{
            minHeight: "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            background: "#111",
            color: "white"
        }}>

            <h1>Login</h1>

            <form onSubmit={handleLogin} style={{ width: "350px", padding: "30px", background: "#222", borderRadius: "10px" }}>

                <div style={{ marginBottom: "15px" }}>
                    <label>Email</label>

                    <input
                        type="email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                        placeholder="Enter email"
                        required
                        style={{
                            display: "block",
                            width: "100%",
                            padding: "10px"
                        }}
                    />
                </div>

                <div style={{ marginBottom: "15px" }}>
                    <label>Password</label>

                    <input
                        type="password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        placeholder="Enter password"
                        required
                        style={{
                            display: "block",
                            width: "100%",
                            padding: "10px"
                        }}
                    />
                </div>

                {error && (
                    <p style={{ color: "red" }}>
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        width: "100%",
                        padding: "12px",
                        background: "#25d366",
                        color: "white",
                        border: "none",
                        borderRadius: "5px",
                        cursor: "pointer"
                    }}
                >
                    {loading
                        ? "Logging in..."
                        : "Login"
                    }
                </button>

                <p>
                    Don't have an account?{" "}
                    <a href="/register" style={{ color: "#25d366", cursor: "pointer" }}>
                        Register
                    </a>
                </p>

            </form>

        </div>
    );
}