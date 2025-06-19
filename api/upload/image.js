const formidable = require('formidable');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (req.method) {
      case 'POST': {
        // Create uploads directory if it doesn't exist
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const form = formidable({
          uploadDir: uploadsDir,
          keepExtensions: true,
          maxFileSize: 5 * 1024 * 1024, // 5MB
        });

        const [fields, files] = await form.parse(req);

        if (!files.image) {
          return res.status(400).json({ error: 'No image file provided' });
        }

        const file = Array.isArray(files.image) ? files.image[0] : files.image;

        // Check file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.mimetype)) {
          // Clean up uploaded file
          if (fs.existsSync(file.filepath)) {
            fs.unlinkSync(file.filepath);
          }
          return res.status(400).json({ error: 'Only image files (JPEG, PNG, GIF, WebP) are allowed' });
        }

        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const fileExtension = path.extname(file.originalFilename || '');
        const newFilename = 'task-image-' + uniqueSuffix + fileExtension;
        const newPath = path.join(uploadsDir, newFilename);

        // Move file to final location
        fs.renameSync(file.filepath, newPath);

        const fileInfo = {
          filename: newFilename,
          originalName: file.originalFilename,
          size: file.size,
          mimetype: file.mimetype,
          url: `/uploads/${newFilename}`
        };

        res.json({
          message: 'Image uploaded successfully',
          file: fileInfo
        });
        break;
      }

      case 'DELETE': {
        // For deleting images - you'd need to implement this based on filename
        res.status(501).json({ error: 'Delete functionality not implemented yet' });
        break;
      }

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ 
      error: 'Upload failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
    });
  }
}; 