require("dotenv").config();
const express = require("express");
const cors = require("cors");
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const organizationRoutes = require("./routes/organization.routes");
const organizationManagerRoutes = require("./routes/organizationManager.routes");
const { authRequired } = require("./middleware/auth.middleware");
const { specs, swaggerUi } = require("./swagger/index");

const app = express();

// CORS - cho phép FE từ mọi domain gọi API
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use("/auth", authRoutes);
app.use("/users", userRoutes);  
app.use("/organizations", organizationRoutes);
app.use("/organization-managers", organizationManagerRoutes);

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