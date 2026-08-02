const courseService = require("../services/courseService");
const { getChannel } = require("../config/rabbitmq");
const Course = require("../models/courseModel");

/**
 * Generate a new course using AI
 * POST /api/courses/generate
 */
/**
 * POST /api/courses/generate
 * ASYNC – does NOT call AI
 */
exports.generateCourse = async (req, res) => {
  try {
    console.log("========== GENERATE COURSE ==========");
    const { topic } = req.body;
    console.log("2", topic);
    if (!topic || topic.trim().length < 3) {
      return res.status(400).json({
        message: "Topic must be at least 3 characters",
      });
    }

    const userId = req.auth?.payload?.sub || "dev-user";
    console.log("3", userId); 
    // 1. Create course immediately
    const course = await Course.create({
      title: topic,
      createdBy: userId,
      status: "PENDING",
    });
    console.log("4", course._id);
    // 2. Push job to RabbitMQ
    const channel = getChannel();
    channel.sendToQueue(
      "course_generation",
      Buffer.from(
        JSON.stringify({
          courseId: course._id,
          topic,
          userId,
        })
      ),
      { persistent: true }
    );
    console.log("5", course._id);
    // 3. Respond immediately
    return res.status(202).json({
      message: "Course generation started",
      _id: course._id,
      status: course.status,
    });
  } catch (error) {
    console.error("Generate course error:", error);
    return res.status(500).json({
      message: "Failed to start course generation",
    });
  }
};

/**
 * Get all courses created by the logged-in user
 * GET /api/courses
 */
exports.getMyCourses = async (req, res) => {
  try {
    const courses = await courseService.getCoursesByUser(req.auth.payload.sub);
    return res.json(courses);
  } catch (error) {
    console.error("Get courses error:", error);
    return res.status(500).json({
      message: "Failed to fetch courses",
    });
  }
};

/**
 * Get a single course with its modules
 * GET /api/courses/:courseId
 */
exports.getCourseById = async (req, res) => {
  try {
    console.log("Incoming request:", req.originalUrl);
    console.log("courseId param:", req.params.courseId);

    const { courseId } = req.params;
    const course = await courseService.getCourseDetails(courseId);
    
    return res.json(course);
  } catch (error) {
    console.error("Get course error:", error.message);
    return res.status(400).json({
      message: error.message,
    });
  }
};


/**
 * Delete a course (and related modules & lessons)
 * DELETE /api/courses/:courseId
 */
exports.deleteCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    await courseService.deleteCourse(courseId, req.auth.payload.sub);

    return res.json({
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error("Delete course error:", error);
    return res.status(403).json({
      message: error.message || "Not authorized",
    });
  }
};
