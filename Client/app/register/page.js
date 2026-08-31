"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {

    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {

        e.preventDefault();

        setError("");
        setLoading(true);

        try {

            const response = await fetch(
                `${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        name,
                        email,
                        password
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {

                setError(
                    data.message || "Registration failed"
                );

                setLoading(false);
                return;
            }

            alert("Registration successful!");

            router.push("/login");

        } catch (error) {

            console.error(
                "Register error:",
                error
            );

            setError(
                "Server error. Please try again."
            );

        } finally {

            setLoading(false);

        }
    };

    return (

        <div
            style={{
                minHeight: "100vh",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                background: "#111",
                color: "white"
            }}
        >

            <form
                onSubmit={handleRegister}
                style={{
                    width: "350px",
                    padding: "30px",
                    background: "#222",
                    borderRadius: "10px"
                }}
            >

                <h1>
                    Create Account
                </h1>

                {error && (
                    <p
                        style={{
                            color: "#ff5555"
                        }}
                    >
                        {error}
                    </p>
                )}

                <input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) =>
                        setName(e.target.value)
                    }
                    required
                    style={{
                        width: "100%",
                        padding: "12px",
                        marginBottom: "15px",
                        boxSizing: "border-box"
                    }}
                />

                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) =>
                        setEmail(e.target.value)
                    }
                    required
                    style={{
                        width: "100%",
                        padding: "12px",
                        marginBottom: "15px",
                        boxSizing: "border-box"
                    }}
                />

                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) =>
                        setPassword(e.target.value)
                    }
                    required
                    style={{
                        width: "100%",
                        padding: "12px",
                        marginBottom: "15px",
                        boxSizing: "border-box"
                    }}
                />

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
                        ? "Creating..."
                        : "Register"}
                </button>

                <p
                    style={{
                        marginTop: "20px"
                    }}
                >
                    Already have an account?{" "}

                    <span
                        onClick={() =>
                            router.push("/login")
                        }
                        style={{
                            color: "#25d366",
                            cursor: "pointer"
                        }}
                    >
                        Login
                    </span>

                </p>

            </form>

        </div>
    );
}