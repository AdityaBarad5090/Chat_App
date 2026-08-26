const User = require("../models/User");

const getUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select("-password")
            .sort({ createdAt: -1 });

        res.status(200).json({
            users
        });

    } catch (error) {
        console.error("Get Users Error:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};

module.exports = {
    getUsers
};