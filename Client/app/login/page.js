"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

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
                `${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`,
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
        <div className={styles.container}>

            <h1>Login</h1>

            <form onSubmit={handleLogin} className={styles.form}>

                <div className={styles.field}>
                    <label>Email</label>

                    <input
                        type="email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                        placeholder="Enter email"
                        required
                        className={styles.input}
                    />
                </div>

                <div className={styles.field}>
                    <label>Password</label>

                    <input
                        type="password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        placeholder="Enter password"
                        required
                        className={styles.input}
                    />
                </div>

                {error && (
                    <p className={styles.error}>
                        {error}
                    </p>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className={styles.button}
                >
                    {loading
                        ? "Logging in..."
                        : "Login"
                    }
                </button>

                <p>
                    Don't have an account?{" "}
                    <a href="/register" className={styles.link}>
                        Register
                    </a>
                </p>

            </form>

        </div>
    );
}