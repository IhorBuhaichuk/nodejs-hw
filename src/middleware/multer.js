import multer from 'multer';

const storage = multer.memoryStorage();

const fileFilter = (_request, file, callback) => {
  if (!file.mimetype.startsWith('image/')) {
    callback(new Error('Only images allowed'));
    return;
  }

  callback(null, true);
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024,
  },
  fileFilter,
});
