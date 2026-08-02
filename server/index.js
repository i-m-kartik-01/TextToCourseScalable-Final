const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { connectRedis } = require('./config/redis'); // [cite: 44, 53]
const connectDB = require("./connectDB"); // 
const { connectRabbitMQ } = require("./config/rabbitmq");

const courseRoutes = require("./routes/courseRoutes");
const lessonRoutes = require("./routes/lessonRoutes");
const moduleRoutes = require("./routes/moduleRoutes");
const youtubeRoutes = require('./routes/youtubeRoutes');
const userRoutes = require('./routes/userRoutes');

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use((req, res, next) => {
  console.log("========== REQUEST ==========");
  console.log(req.method, req.originalUrl);
  console.log("Authorization:", req.headers.authorization);
  next();
});
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});
console.log("RabbitMQ URL:", process.env.RABBITMQ_URL);
app.use("/api", courseRoutes);
app.use("/api", lessonRoutes);
app.use("/api", moduleRoutes);
app.use('/api', youtubeRoutes);
app.use('/api/users', userRoutes);

app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    message: "Internal server error",
  });
});
// 3. Merged Global Error Handler (Must be AFTER routes)
app.use((err, req, res, next) => {
  // Catch Auth0 / JWT specific errors
  if (err.name === 'UnauthorizedError' || err.name === 'InvalidTokenError' || err.status === 401 || err.status === 400) {
    return res.status(err.status || 401).json({ 
      message: 'Authentication Error', 
      error: err.message || 'Invalid or missing token'
    });
  }
  
  // Catch all other server errors
  console.error("Server Error:", err);
  res.status(500).json({ 
    message: "Internal Server Error",
    error: process.env.NODE_ENV === 'development' ? err.message : undefined 
  });
});
const PORT = process.env.PORT;

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis(); 
    await connectRabbitMQ();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Critical Startup Error:", error);
    process.exit(1); 
  }
};

startServer();