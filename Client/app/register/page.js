"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

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
        <div className={styles.container}>

            <form onSubmit={handleRegister} className={styles.form}>

                <h1>Create Account</h1>

                {error && (
                    <p className={styles.error}>
                        {error}
                    </p>
                )}

                <div className={styles.field}>
                    <label>Name</label>
                    <input
                        type="text"
                        placeholder="Name"
                        value={name}
                        onChange={(e) =>
                            setName(e.target.value)
                        }
                        required
                        className={styles.input}
                    />
                </div>

                <div className={styles.field}>
                    <label>Email</label>
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={(e) =>
                            setEmail(e.target.value)
                        }
                        required
                        className={styles.input}
                    />
                </div>

                <div className={styles.field}>
                    <label>Password</label>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) =>
                            setPassword(e.target.value)
                        }
                        required
                        className={styles.input}
                    />
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={styles.button}
                >
                    {loading
                        ? "Creating..."
                        : "Register"}
                </button>

                <p>
                    Already have an account?{" "}
                    <a href="/login" className={styles.link}>
                        Login
                    </a>
                </p>

            </form>

        </div>
    );
}