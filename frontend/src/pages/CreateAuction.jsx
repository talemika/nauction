import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Loader2,
  Upload,
  Video,
  X,
  CheckCircle
} from 'lucide-react';
import { auctionsAPI, uploadAPI } from '../services/api';

const CreateAuction = () => {
  const navigate = useNavigate();
  
  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    category: '',
    condition: '',
    estimatedRetailValue: '',
    auctionType: 'pure_sale', // 'pure_sale' or 'reserve_price'
    reservePrice: '',
    startingPrice: '',
    buyItNowPrice: '',
    bidIncrement: '',
    startTime: '',
    endTime: '',
    images: [],
    videos: []
  });

  const [uploadedFiles, setUploadedFiles] = useState({
    images: [],
    videos: []
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');

  const categories = [
    'Electronics', 'Fashion', 'Home & Garden', 'Sports', 'Books', 
    'Art', 'Collectibles', 'Automotive', 'Other'
  ];

  const conditions = [
    'New',
    'Like New', 
    'Good',
    'Fair',
    'Poor'
  ];

  const handleFormChange = (field, value) => {
    setCreateForm(prev => ({ ...prev, [field]: value }));
    // Clear field-specific errors
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleFileUpload = async (files, type) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);
    setErrors(prev => ({ ...prev, upload: '' }));

    try {
      const uploadPromises = Array.from(files).map(async (file, index) => {
        // Validate file type and size
        if (type === 'images') {
          if (!file.type.startsWith('image/')) {
            throw new Error(`${file.name} is not a valid image file`);
          }
          if (file.size > 10 * 1024 * 1024) { // 10MB limit
            throw new Error(`${file.name} exceeds 10MB limit`);
          }
        } else if (type === 'videos') {
          if (!file.type.startsWith('video/')) {
            throw new Error(`${file.name} is not a valid video file`);
          }
          if (file.size > 50 * 1024 * 1024) { // 50MB limit
            throw new Error(`${file.name} exceeds 50MB limit`);
          }
        }

        const formData = new FormData();
        formData.append(type === 'images' ? 'images' : 'videos', file);

        let response;
        if (type === 'images') {
          response = await uploadAPI.uploadImages(formData);
        } else {
          response = await uploadAPI.uploadVideos(formData);
        }
        
        // Update progress
        const progress = ((index + 1) / files.length) * 100;
        setUploadProgress(progress);
        
        // Extract file name from response
        const uploadedFiles = response.data.files || [];
        return uploadedFiles[0] || response.data.fileName || file.name;
      });

      const uploadedFileNames = await Promise.all(uploadPromises);

      // Update state with uploaded files
      setUploadedFiles(prev => ({
        ...prev,
        [type]: [...prev[type], ...uploadedFileNames]
      }));

      setCreateForm(prev => ({
        ...prev,
        [type]: [...prev[type], ...uploadedFileNames]
      }));

    } catch (error) {
      setErrors(prev => ({ 
        ...prev, 
        upload: error.message || `Failed to upload ${type}` 
      }));
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const removeFile = (fileName, type) => {
    setUploadedFiles(prev => ({
      ...prev,
      [type]: prev[type].filter(f => f !== fileName)
    }));

    setCreateForm(prev => ({
      ...prev,
      [type]: prev[type].filter(f => f !== fileName)
    }));
  };

  const getFilePreviewUrl = (fileName, type) => {
    return `/api/uploads/${type}/${fileName}`;
  };

  const validateForm = () => {
    const newErrors = {};

    // Required fields validation
    if (!createForm.title.trim()) newErrors.title = 'Title is required';
    if (!createForm.description.trim()) newErrors.description = 'Description is required';
    if (!createForm.category) newErrors.category = 'Category is required';
    if (!createForm.condition) newErrors.condition = 'Condition is required';
    if (!createForm.startingPrice) newErrors.startingPrice = 'Starting price is required';
    if (!createForm.startTime) newErrors.startTime = 'Start time is required';
    if (!createForm.endTime) newErrors.endTime = 'End time is required';

    // Price validations
    if (createForm.startingPrice && parseFloat(createForm.startingPrice) <= 0) {
      newErrors.startingPrice = 'Starting price must be greater than 0';
    }

    if (createForm.auctionType === 'reserve_price' && !createForm.reservePrice) {
      newErrors.reservePrice = 'Reserve price is required for reserve price auctions';
    }

    if (createForm.reservePrice && parseFloat(createForm.reservePrice) <= 0) {
      newErrors.reservePrice = 'Reserve price must be greater than 0';
    }

    // Time validations
    if (createForm.startTime && createForm.endTime) {
      const startTime = new Date(createForm.startTime);
      const endTime = new Date(createForm.endTime);
      const now = new Date();

      if (startTime <= now) {
        newErrors.startTime = 'Start time must be in the future';
      }

      if (endTime <= startTime) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const startTime = new Date(createForm.startTime);
      const endTime = new Date(createForm.endTime);

      const auctionData = {
        title: createForm.title,
        description: createForm.description,
        category: createForm.category,
        condition: createForm.condition,
        estimatedRetailValue: createForm.estimatedRetailValue ? parseFloat(createForm.estimatedRetailValue) : null,
        auctionType: createForm.auctionType,
        reservePrice: createForm.auctionType === 'reserve_price' ? parseFloat(createForm.reservePrice) : null,
        startingPrice: parseFloat(createForm.startingPrice),
        buyItNowPrice: createForm.buyItNowPrice ? parseFloat(createForm.buyItNowPrice) : null,
        bidIncrement: createForm.bidIncrement ? parseFloat(createForm.bidIncrement) : 100,
        startDate: startTime.toISOString(),
        endDate: endTime.toISOString(),
        images: createForm.images,
        videos: createForm.videos
      };

      const response = await auctionsAPI.createAuction(auctionData);
      
      setSuccess('Auction created successfully! Redirecting to auction listing...');
      
      // Redirect to the newly created auction after a short delay
      setTimeout(() => {
        navigate(`/auctions/${response.data.id}`);
      }, 2000);

    } catch (error) {
      setErrors({ 
        submit: error.response?.data?.message || 'Failed to create auction' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Admin Dashboard
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">Create New Auction</h1>
          <p className="text-gray-600 mt-2">Fill in the details below to create a new auction listing</p>
        </div>

        {/* Success Message */}
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Auction Title *</Label>
                  <Input
                    id="title"
                    value={createForm.title}
                    onChange={(e) => handleFormChange('title', e.target.value)}
                    placeholder="Enter auction title"
                    disabled={isSubmitting}
                  />
                  {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <textarea
                    id="description"
                    className="w-full min-h-[120px] p-3 border border-input rounded-md resize-none"
                    value={createForm.description}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    placeholder="Enter detailed description of the item"
                    disabled={isSubmitting}
                  />
                  {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                </div>

                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={createForm.category} onValueChange={(value) => handleFormChange('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                </div>

                <div>
                  <Label htmlFor="condition">Item Condition *</Label>
                  <Select value={createForm.condition} onValueChange={(value) => handleFormChange('condition', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                    <SelectContent>
                      {conditions.map((condition) => (
                        <SelectItem key={condition} value={condition}>
                          {condition}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.condition && <p className="text-red-500 text-sm mt-1">{errors.condition}</p>}
                </div>

                <div>
                  <Label htmlFor="estimatedRetailValue">Estimated Retail Value (₦)</Label>
                  <Input
                    id="estimatedRetailValue"
                    type="number"
                    min="0"
                    step="0.01"
                    value={createForm.estimatedRetailValue}
                    onChange={(e) => handleFormChange('estimatedRetailValue', e.target.value)}
                    placeholder="Optional"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auction Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Auction Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="auctionType">Auction Type *</Label>
                  <Select value={createForm.auctionType} onValueChange={(value) => handleFormChange('auctionType', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pure_sale">Pure Sale</SelectItem>
                      <SelectItem value="reserve_price">Reserve Price</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-500 mt-1">
                    {createForm.auctionType === 'pure_sale' 
                      ? 'Item sells at any final bid price' 
                      : 'Item only sells if reserve price is met'
                    }
                  </p>
                </div>

                {createForm.auctionType === 'reserve_price' && (
                  <div>
                    <Label htmlFor="reservePrice">Reserve Price (₦) *</Label>
                    <Input
                      id="reservePrice"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={createForm.reservePrice}
                      onChange={(e) => handleFormChange('reservePrice', e.target.value)}
                      placeholder="Minimum price to sell"
                      disabled={isSubmitting}
                    />
                    {errors.reservePrice && <p className="text-red-500 text-sm mt-1">{errors.reservePrice}</p>}
                  </div>
                )}

                <div>
                  <Label htmlFor="startingPrice">Starting Price (₦) *</Label>
                  <Input
                    id="startingPrice"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={createForm.startingPrice}
                    onChange={(e) => handleFormChange('startingPrice', e.target.value)}
                    placeholder="Starting bid amount"
                    disabled={isSubmitting}
                  />
                  {errors.startingPrice && <p className="text-red-500 text-sm mt-1">{errors.startingPrice}</p>}
                </div>

                <div>
                  <Label htmlFor="buyItNowPrice">Buy It Now Price (₦)</Label>
                  <Input
                    id="buyItNowPrice"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={createForm.buyItNowPrice}
                    onChange={(e) => handleFormChange('buyItNowPrice', e.target.value)}
                    placeholder="Optional instant purchase price"
                    disabled={isSubmitting}
                  />
                </div>

                <div>
                  <Label htmlFor="bidIncrement">Bid Increment (₦)</Label>
                  <Input
                    id="bidIncrement"
                    type="number"
                    min="1"
                    step="0.01"
                    value={createForm.bidIncrement}
                    onChange={(e) => handleFormChange('bidIncrement', e.target.value)}
                    placeholder="Default: 100"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scheduling */}
          <Card>
            <CardHeader>
              <CardTitle>Auction Scheduling</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="startTime">Auction Start Date & Time *</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    value={createForm.startTime}
                    onChange={(e) => handleFormChange('startTime', e.target.value)}
                    min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                    disabled={isSubmitting}
                  />
                  <p className="text-sm text-gray-500 mt-1">When the auction will begin accepting bids</p>
                  {errors.startTime && <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>}
                </div>

                <div>
                  <Label htmlFor="endTime">Auction End Date & Time *</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    value={createForm.endTime}
                    onChange={(e) => handleFormChange('endTime', e.target.value)}
                    min={createForm.startTime || new Date(Date.now() + 120000).toISOString().slice(0, 16)}
                    disabled={isSubmitting}
                  />
                  <p className="text-sm text-gray-500 mt-1">When the auction will close</p>
                  {errors.endTime && <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Media Upload */}
          <Card>
            <CardHeader>
              <CardTitle>Media Upload</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Errors */}
              {errors.upload && (
                <Alert variant="destructive">
                  <AlertDescription>{errors.upload}</AlertDescription>
                </Alert>
              )}

              {/* Image Upload */}
              <div className="space-y-4">
                <Label>Images</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <div className="text-center">
                    <input
                      type="file"
                      id="image-upload"
                      multiple
                      accept="image/*"
                      onChange={(e) => handleFileUpload(e.target.files, 'images')}
                      className="hidden"
                      disabled={isUploading || isSubmitting}
                    />
                    <label
                      htmlFor="image-upload"
                      className="cursor-pointer inline-flex items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Upload className="h-5 w-5 mr-2" />
                      {isUploading ? 'Uploading...' : 'Upload Images'}
                    </label>
                    <p className="mt-3 text-sm text-gray-500">
                      PNG, JPG, GIF up to 10MB each. Multiple files allowed.
                    </p>
                  </div>
                </div>

                {/* Image Previews */}
                {uploadedFiles.images.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {uploadedFiles.images.map((fileName, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={getFilePreviewUrl(fileName, 'images')}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(fileName, 'images')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isSubmitting}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Video Upload */}
              <div className="space-y-4">
                <Label>Videos</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <div className="text-center">
                    <input
                      type="file"
                      id="video-upload"
                      multiple
                      accept="video/*"
                      onChange={(e) => handleFileUpload(e.target.files, 'videos')}
                      className="hidden"
                      disabled={isUploading || isSubmitting}
                    />
                    <label
                      htmlFor="video-upload"
                      className="cursor-pointer inline-flex items-center px-6 py-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Video className="h-5 w-5 mr-2" />
                      {isUploading ? 'Uploading...' : 'Upload Videos'}
                    </label>
                    <p className="mt-3 text-sm text-gray-500">
                      MP4, MOV, AVI up to 50MB each. Multiple files allowed.
                    </p>
                  </div>
                </div>

                {/* Video Previews */}
                {uploadedFiles.videos.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {uploadedFiles.videos.map((fileName, index) => (
                      <div key={index} className="relative group">
                        <video
                          src={getFilePreviewUrl(fileName, 'videos')}
                          className="w-full h-40 object-cover rounded-lg border"
                          controls
                        />
                        <button
                          type="button"
                          onClick={() => removeFile(fileName, 'videos')}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={isSubmitting}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-600 h-3 rounded-full transition-all duration-300" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Errors */}
          {errors.submit && (
            <Alert variant="destructive">
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          {/* Form Actions */}
          <div className="flex gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/admin')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Auction'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAuction;

