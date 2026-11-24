const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const multer = require('multer');

const RESUME_DIR = path.join(__dirname, '..', '..', 'uploads', 'resumes');
fs.mkdirSync(RESUME_DIR, { recursive: true });          // create the folder if it is missing

const ALLOWED_EXT = ['.pdf', '.doc', '.docx'];

const upload = multer({
  storage: multer.diskStorage({
    destination: RESUME_DIR,
    // random name: never trust the name the user sent
    filename: (req, file, cb) =>
      cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${path.extname(file.originalname).toLowerCase()}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 },                // 5 MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_EXT.includes(ext)) return cb(new Error('Only PDF, DOC or DOCX files are allowed'));
    cb(null, true);
  },
});

// wrapper so upload errors become clean 400 JSON responses
exports.uploadResume = (req, res, next) => {
  upload.single('resume')(req, res, (err) => {
    if (err) {
      const message = err.code === 'LIMIT_FILE_SIZE' ? 'File is too large (max 5 MB)' : err.message;
      return res.status(400).json({ success: false, message });
    }
    next();
  });
};

exports.RESUME_DIR = RESUME_DIR;

// delete a stored file, ignoring errors
exports.removeFile = (filename) => {
  if (filename) fs.unlink(path.join(RESUME_DIR, path.basename(filename)), () => {});
};