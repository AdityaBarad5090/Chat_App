"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser } from "../lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    if (user) {
      router.replace("/chat");
    } else {
      router.replace("/login");
    }
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#000000",
        color: "#a1a1aa",
        fontFamily: "system-ui, -apple-system, sans-serif",
        fontSize: "1.1rem"
      }}
    >
      Redirecting...
    </div>
  );
}
