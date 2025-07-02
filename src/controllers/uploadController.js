const sharp = require("sharp");
const multer = require("multer");
const { createClient } = require("@supabase/supabase-js");
const catchAsync = require("../services/CatchAsync");
const ResponseError = require("../services/ResponseError");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

const multerStorage = multer.memoryStorage();
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    cb(null, true);
  } else {
    cb(new ResponseError("Not an image! Please upload only images", 400));
  }
};

const upload = multer({
  storage: multerStorage,
  fileFilter: multerFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

exports.uploadImage = upload.single("image");

exports.processAndUploadImage = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(new ResponseError("No image file provided", 400));
  }

  try {
    const processedImage = await sharp(req.file.buffer)
      .resize(200, 200, { fit: "inside" })
      .toFormat("jpeg")
      .jpeg({ quality: 90 })
      .toBuffer();

    const fileName = `template-${req.params.id || "new"}-${Date.now()}.jpeg`;

    const { error } = await supabase.storage
      .from("images")
      .upload(fileName, processedImage, {
        contentType: "image/jpeg",
        upsert: true,
      });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(fileName);

    res.status(200).json({
      status: "success",
      url: publicUrl,
    });
  } catch (err) {
    return new ResponseError("Failed to process and upload image", 500);
  }
});
