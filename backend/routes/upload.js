const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const Auction = require('../models/Auction');

const router = express.Router();

// Ensure upload directories exist
const uploadDirs = ['uploads/images', 'uploads/videos', 'uploads/temp'];
uploadDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = 'uploads/temp';
    
    if (file.mimetype.startsWith('image/')) {
      uploadPath = 'uploads/images';
    } else if (file.mimetype.startsWith('video/')) {
      uploadPath = 'uploads/videos';
    }
    
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext);
    cb(null, `${name}-${uniqueSuffix}${ext}`);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed image types
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  // Allowed video types
  const allowedVideoTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv'];
  
  if (allowedImageTypes.includes(file.mimetype) || allowedVideoTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images (JPEG, PNG, GIF, WebP) and videos (MP4, AVI, MOV, WMV, FLV) are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 10 // Maximum 10 files per request
  }
});

// @route   POST /api/upload/images
// @desc    Upload images for auction
// @access  Private/Admin
router.post('/images', authenticateToken, requireAdmin, upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: 'No images uploaded',
        error: 'NO_FILES_UPLOADED'
      });
    }

    const uploadedImages = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      url: `/uploads/images/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date()
    }));

    res.json({
      message: 'Images uploaded successfully',
      images: uploadedImages,
      count: uploadedImages.length
    });
  } catch (error) {
    console.error('Image upload error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File size too large. Maximum size is 50MB per file.',
        error: 'FILE_TOO_LARGE'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: 'Too many files. Maximum 10 files per upload.',
        error: 'TOO_MANY_FILES'
      });
    }

    res.status(500).json({
      message: 'Image upload failed',
      error: 'UPLOAD_ERROR'
    });
  }
});

// @route   POST /api/upload/videos
// @desc    Upload videos for auction
// @access  Private/Admin
router.post('/videos', authenticateToken, requireAdmin, upload.array('videos', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: 'No videos uploaded',
        error: 'NO_FILES_UPLOADED'
      });
    }

    const uploadedVideos = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      url: `/uploads/videos/${file.filename}`,
      size: file.size,
      mimetype: file.mimetype,
      uploadedAt: new Date()
    }));

    res.json({
      message: 'Videos uploaded successfully',
      videos: uploadedVideos,
      count: uploadedVideos.length
    });
  } catch (error) {
    console.error('Video upload error:', error);
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        message: 'File size too large. Maximum size is 50MB per file.',
        error: 'FILE_TOO_LARGE'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        message: 'Too many files. Maximum 5 videos per upload.',
        error: 'TOO_MANY_FILES'
      });
    }

    res.status(500).json({
      message: 'Video upload failed',
      error: 'UPLOAD_ERROR'
    });
  }
});

// @route   POST /api/upload/auction/:auctionId/media
// @desc    Add media to specific auction
// @access  Private/Admin
router.post('/auction/:auctionId/media', authenticateToken, requireAdmin, upload.array('media', 15), async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { mainImageIndex = 0 } = req.body;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        message: 'No media files uploaded',
        error: 'NO_FILES_UPLOADED'
      });
    }

    // Find auction
    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({
        message: 'Auction not found',
        error: 'AUCTION_NOT_FOUND'
      });
    }

    // Process uploaded files
    const images = [];
    const videos = [];

    req.files.forEach((file, index) => {
      const mediaItem = {
        filename: file.filename,
        url: file.mimetype.startsWith('image/') 
          ? `/uploads/images/${file.filename}` 
          : `/uploads/videos/${file.filename}`,
        isMain: index === parseInt(mainImageIndex)
      };

      if (file.mimetype.startsWith('image/')) {
        images.push(mediaItem);
      } else if (file.mimetype.startsWith('video/')) {
        videos.push({
          ...mediaItem,
          thumbnail: null // You can add thumbnail generation logic here
        });
      }
    });

    // Update auction with new media
    if (images.length > 0) {
      // If this is the first image and no main image is set, make it main
      if (auction.images.length === 0 && images.length > 0) {
        images[0].isMain = true;
      }
      auction.images.push(...images);
    }

    if (videos.length > 0) {
      auction.videos.push(...videos);
    }

    await auction.save();

    res.json({
      message: 'Media uploaded and added to auction successfully',
      auction: {
        id: auction._id,
        title: auction.title,
        images: auction.images,
        videos: auction.videos
      },
      uploaded: {
        images: images.length,
        videos: videos.length,
        total: req.files.length
      }
    });
  } catch (error) {
    console.error('Auction media upload error:', error);
    res.status(500).json({
      message: 'Failed to upload media to auction',
      error: 'AUCTION_MEDIA_UPLOAD_ERROR'
    });
  }
});

// @route   DELETE /api/upload/auction/:auctionId/media/:mediaType/:filename
// @desc    Remove media from auction
// @access  Private/Admin
router.delete('/auction/:auctionId/media/:mediaType/:filename', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { auctionId, mediaType, filename } = req.params;

    if (!['images', 'videos'].includes(mediaType)) {
      return res.status(400).json({
        message: 'Invalid media type. Must be "images" or "videos"',
        error: 'INVALID_MEDIA_TYPE'
      });
    }

    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({
        message: 'Auction not found',
        error: 'AUCTION_NOT_FOUND'
      });
    }

    // Remove from auction
    if (mediaType === 'images') {
      auction.images = auction.images.filter(img => img.filename !== filename);
    } else {
      auction.videos = auction.videos.filter(vid => vid.filename !== filename);
    }

    await auction.save();

    // Delete physical file
    const filePath = path.join(__dirname, '..', 'uploads', mediaType, filename);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({
      message: `${mediaType.slice(0, -1)} removed successfully`,
      auction: {
        id: auction._id,
        title: auction.title,
        images: auction.images,
        videos: auction.videos
      }
    });
  } catch (error) {
    console.error('Remove media error:', error);
    res.status(500).json({
      message: 'Failed to remove media',
      error: 'REMOVE_MEDIA_ERROR'
    });
  }
});

// @route   PUT /api/upload/auction/:auctionId/main-image
// @desc    Set main image for auction
// @access  Private/Admin
router.put('/auction/:auctionId/main-image', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { filename } = req.body;

    if (!filename) {
      return res.status(400).json({
        message: 'Filename is required',
        error: 'MISSING_FILENAME'
      });
    }

    const auction = await Auction.findById(auctionId);
    if (!auction) {
      return res.status(404).json({
        message: 'Auction not found',
        error: 'AUCTION_NOT_FOUND'
      });
    }

    // Find the image and set it as main
    const imageIndex = auction.images.findIndex(img => img.filename === filename);
    if (imageIndex === -1) {
      return res.status(404).json({
        message: 'Image not found in auction',
        error: 'IMAGE_NOT_FOUND'
      });
    }

    // Reset all images to not main
    auction.images.forEach(img => img.isMain = false);
    // Set selected image as main
    auction.images[imageIndex].isMain = true;

    await auction.save();

    res.json({
      message: 'Main image updated successfully',
      mainImage: auction.images[imageIndex],
      auction: {
        id: auction._id,
        title: auction.title,
        images: auction.images
      }
    });
  } catch (error) {
    console.error('Set main image error:', error);
    res.status(500).json({
      message: 'Failed to set main image',
      error: 'SET_MAIN_IMAGE_ERROR'
    });
  }
});

// @route   GET /api/upload/media-info/:filename
// @desc    Get media file information
// @access  Public
router.get('/media-info/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Check in images directory
    let filePath = path.join(__dirname, '..', 'uploads', 'images', filename);
    let mediaType = 'image';
    
    if (!fs.existsSync(filePath)) {
      // Check in videos directory
      filePath = path.join(__dirname, '..', 'uploads', 'videos', filename);
      mediaType = 'video';
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          message: 'Media file not found',
          error: 'FILE_NOT_FOUND'
        });
      }
    }

    const stats = fs.statSync(filePath);
    
    res.json({
      message: 'Media info retrieved successfully',
      file: {
        filename,
        mediaType,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        url: `/${mediaType === 'image' ? 'uploads/images' : 'uploads/videos'}/${filename}`
      }
    });
  } catch (error) {
    console.error('Get media info error:', error);
    res.status(500).json({
      message: 'Failed to get media information',
      error: 'MEDIA_INFO_ERROR'
    });
  }
});

// @route   GET /api/upload/cleanup-unused
// @desc    Clean up unused media files (Admin only)
// @access  Private/Admin
router.get('/cleanup-unused', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const imageDir = path.join(__dirname, '..', 'uploads', 'images');
    const videoDir = path.join(__dirname, '..', 'uploads', 'videos');
    
    // Get all files
    const imageFiles = fs.existsSync(imageDir) ? fs.readdirSync(imageDir) : [];
    const videoFiles = fs.existsSync(videoDir) ? fs.readdirSync(videoDir) : [];
    
    // Get all used files from auctions
    const auctions = await Auction.find({}, 'images videos');
    const usedImageFiles = new Set();
    const usedVideoFiles = new Set();
    
    auctions.forEach(auction => {
      auction.images.forEach(img => usedImageFiles.add(img.filename));
      auction.videos.forEach(vid => usedVideoFiles.add(vid.filename));
    });
    
    // Find unused files
    const unusedImages = imageFiles.filter(file => !usedImageFiles.has(file));
    const unusedVideos = videoFiles.filter(file => !usedVideoFiles.has(file));
    
    res.json({
      message: 'Cleanup analysis completed',
      summary: {
        totalImages: imageFiles.length,
        usedImages: usedImageFiles.size,
        unusedImages: unusedImages.length,
        totalVideos: videoFiles.length,
        usedVideos: usedVideoFiles.size,
        unusedVideos: unusedVideos.length
      },
      unusedFiles: {
        images: unusedImages,
        videos: unusedVideos
      }
    });
  } catch (error) {
    console.error('Cleanup analysis error:', error);
    res.status(500).json({
      message: 'Failed to analyze unused files',
      error: 'CLEANUP_ANALYSIS_ERROR'
    });
  }
});

module.exports = router;

