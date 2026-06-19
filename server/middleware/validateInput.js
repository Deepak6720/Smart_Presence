const { z } = require("zod");

const validate = (schema) => (req, res, next) => {
  try {
    req.body = schema.parse(req.body);
    next();
  } catch (error) {
    const messages = error.errors?.map((e) => e.message) || ["Invalid input"];

    return res.status(400).json({
      message: "Validation failed",
      errors: messages,
    });
  }
};

const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters")
    .trim(),
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password is too long"),
  role: z.enum(["admin", "teacher", "student"]).default("student"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format").toLowerCase().trim(),
  password: z.string().min(1, "Password is required"),
});

const createUserSchema = z.object({
  name: z.string().min(2).max(50).trim(),
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(6).max(100),
  role: z.enum(["teacher", "student"]),
});

const markAttendanceSchema = z.object({
  subjectId: z
    .string()
    .min(24, "Invalid subject ID")
    .max(24, "Invalid subject ID"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  records: z
    .array(
      z.object({
        studentId: z.string().min(24).max(24),
        status: z.enum(["present", "absent", "late"]),
      })
    )
    .min(1, "At least one student record is required"),
  markedBy: z.enum(["manual", "face-recognition"]).default("manual"),
});

const createSubjectSchema = z.object({
  name: z.string().min(2, "Subject name too short").max(100).trim(),
  code: z
    .string()
    .min(2, "Subject code too short")
    .max(20, "Subject code too long")
    .toUpperCase()
    .trim(),
  semester: z.string().max(50).optional().default(""),
});

const saveFaceDescriptorSchema = z.object({
  descriptor: z
    .array(z.number())
    .length(128, "Face descriptor must have exactly 128 values"),
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  createUserSchema,
  markAttendanceSchema,
  createSubjectSchema,
  saveFaceDescriptorSchema,
};
