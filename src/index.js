require("dotenv").config();
const express = require("express");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const organizationRoutes = require("./routes/organization.routes");
const { authRequired } = require("./middleware/auth.middleware");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/auth", authRoutes);

app.use("/user", userRoutes);  

app.use("/organizations", organizationRoutes);

//router login
app.get("/me",authRequired, (req, res) => {
    return res.json({
        message: "This is protected data.",
        user: req.user
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});