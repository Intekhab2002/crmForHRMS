import multer from "multer";

const MAX_HOLIDAY_IMPORT_SIZE = 2 * 1024 * 1024;
const XLSX_MIME_TYPES = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

const storage = multer.memoryStorage();

const fileFilter = (req, file, callback) => {
  const isXlsxExtension = /\.xlsx$/i.test(file.originalname ?? "");

  if (!isXlsxExtension || !XLSX_MIME_TYPES.has(file.mimetype)) {
    const error = new Error("Only .xlsx Excel files are allowed.");
    error.code = "SLA_HOLIDAY_IMPORT_INVALID_FILE_TYPE";
    return callback(error);
  }

  return callback(null, true);
};

const holidayExcelUpload = multer({
  storage,
  limits: {
    fileSize: MAX_HOLIDAY_IMPORT_SIZE,
    files: 1,
  },
  fileFilter,
});

export {
  MAX_HOLIDAY_IMPORT_SIZE,
  holidayExcelUpload,
};
