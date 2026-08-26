export const saveAuth = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem(
        "user",
        JSON.stringify(data.user)
    );
};

export const getUser = () => {
    if (typeof window === "undefined") {
        return null;
    }

    const user = localStorage.getItem("user");

    return user ? JSON.parse(user) : null;
};

export const getToken = () => {
    if (typeof window === "undefined") {
        return null;
    }

    return localStorage.getItem("token");
};

export const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
};