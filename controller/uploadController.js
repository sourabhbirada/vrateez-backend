const multer = require("multer");
const asyncHandler = require("../utilits/asyncHandler");
const ApiError = require("../utilits/ApiError");
const { ok } = require("../utilits/response");
const { uploadBufferToS3, createPresignedUploads } = require("../services/s3Service");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype?.startsWith("image/")) {
      cb(new Error("Only image files are allowed"));
      return;
    }
    cb(null, true);
  },
});

const uploadImages = asyncHandler(async (req, res) => {
  const files = Array.isArray(req.body?.files) ? req.body.files : [];
  if (!files.length) {
    throw new ApiError(400, "No files uploaded");
  }

  const uploads = await createPresignedUploads(files);
  return ok(res, { uploads }, "Upload URLs generated");
});

const uploadImagesDirect = [
  (req, res, next) => {
    upload.array("images", 10)(req, res, (err) => {
      if (!err) return next();
      if (err.code === "LIMIT_FILE_SIZE") {
        return next(new ApiError(400, "Image must be 5MB or smaller"));
      }
      return next(new ApiError(400, err.message || "Invalid image upload"));
    });
  },
  asyncHandler(async (req, res) => {
    const files = Array.isArray(req.files) ? req.files : [];
    if (!files.length) {
      throw new ApiError(400, "No files uploaded");
    }

    const uploads = await Promise.all(
      files.map((file) => uploadBufferToS3(file.buffer, file.originalname, file.mimetype))
    );

    return ok(res, { uploads }, "Images uploaded", 201);
  }),
];

module.exports = { uploadImages, uploadImagesDirect };
