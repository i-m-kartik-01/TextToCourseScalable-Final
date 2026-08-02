require("dotenv").config();
const amqp = require("amqplib");
const mongoose = require("mongoose");

const connectDB = require("../connectDB");
const Course = require("../models/courseModel");
const Module = require("../models/moduleModel");
const Lesson = require("../models/lessonModel");
const aiService = require("../services/ai");

mongoose.set("bufferCommands", false);
console.log("RabbitMQ URL:", process.env.RABBITMQ_URL);
async function retryLLM(fn, retries = 5) {
  let delay = 3000;

  while (retries--) {
    try {
      return await fn();
    } catch (err) {
      if (err.status === 429 || err.code === "rate_limit_exceeded") {
        console.log(`Rate limited. Waiting ${delay} ms...`);

        await new Promise((resolve) => setTimeout(resolve, delay));

        delay *= 2;
        continue;
      }

      throw err;
    }
  }

  throw new Error("Maximum retry attempts exceeded.");
}

(async () => {
  try {
    await connectDB();
    console.log("✅ Worker MongoDB connected");

    const conn = await amqp.connect(process.env.RABBITMQ_URL);

    conn.on("close", () => {
      console.error("RabbitMQ connection closed");
      process.exit(1);
    });

    conn.on("error", (err) => {
      console.error("RabbitMQ error:", err.message);
    });

    const channel = await conn.createChannel();

    await channel.assertQueue("course_generation", {
      durable: true,
    });

    // IMPORTANT
    channel.prefetch(1);

    console.log("🚀 Worker listening on queue: course_generation");

    channel.consume("course_generation", async (msg) => {
      if (!msg) return;

      const { courseId, topic } = JSON.parse(msg.content.toString());

      console.log(`Processing ${courseId}`);

      const start = Date.now();

      try {
        await Course.findByIdAndUpdate(courseId, {
          status: "GENERATING_MODULES",
        });

        const aiResult = await retryLLM(() =>
          aiService.generateCourseOutline(topic)
        );

        for (let i = 0; i < aiResult.modules.length; i++) {
          const moduleData = aiResult.modules[i];

          const module = await Module.create({
            title: moduleData.title,
            courseId,
            order: i + 1,
          });

          for (let j = 0; j < moduleData.lessons.length; j++) {
            await Lesson.create({
              title: moduleData.lessons[j],
              moduleId: module._id,
              courseId,
              orderNo: j + 1,
              content: [],
            });
          }
        }

        await Course.findByIdAndUpdate(courseId, {
          status: "READY",
        });

        console.log(
          `Course ${courseId} completed in ${
            (Date.now() - start) / 1000
          } sec`
        );

        try {
          channel.ack(msg);
        } catch (e) {
          console.error("Ack failed:", e.message);
        }
      } catch (err) {
        console.error("Worker failed:", err);

        await Course.findByIdAndUpdate(courseId, {
          status: "FAILED",
          error: err.message,
        });

        try {
          channel.nack(msg, false, false);
        } catch (e) {
          console.error("Nack failed:", e.message);
        }
      }
    });

    process.on("SIGINT", async () => {
      console.log("Closing worker...");

      await channel.close();
      await conn.close();

      process.exit(0);
    });
  } catch (err) {
    console.error("Worker startup failed:", err);
    process.exit(1);
  }
})();