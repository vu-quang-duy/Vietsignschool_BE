require("dotenv").config();
const pool = require("./src/db");

(async () => {
    try {
        const [rows] = await pool.query("SELECT 1");
        console.log("✅ Kết nối MySQL OK:", rows);
        process.exit(0);
    } catch (err) {
        console.error("❌ Lỗi kết nối DB:", err.message);
        process.exit(1);
    }
})();
