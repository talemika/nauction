import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { auctionsAPI } from '../lib/api';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Loader2, Plus } from 'lucide-react';

const CreateAuction = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startingPrice: '',
    duration: '24', // hours
    currency: 'NGN', // Default to Naira
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadedMedia, setUploadedMedia] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const uploadFiles = async () => {
    if (selectedFiles.length === 0) return [];

    setUploading(true);
    const uploadedFiles = [];

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await api.post('/upload/single', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.file) {
          uploadedFiles.push({
            url: response.data.file.url,
            type: file.type.startsWith('image/') ? 'image' : 'video',
            filename: response.data.file.filename,
            originalName: response.data.file.originalName
          });
        }
      }

      setUploadedMedia(uploadedFiles);
      return uploadedFiles;
    } catch (error) {
      console.error('Upload error:', error);
      setError('Failed to upload files. Please try again.');
      return [];
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Validate form data
      if (parseFloat(formData.startingPrice) <= 0) {
        setError('Starting price must be greater than 0');
        setLoading(false);
        return;
      }

      if (parseInt(formData.duration) <= 0) {
        setError('Duration must be greater than 0 hours');
        setLoading(false);
        return;
      }

      // Upload files first if any are selected
      let mediaData = uploadedMedia;
      if (selectedFiles.length > 0 && uploadedMedia.length === 0) {
        mediaData = await uploadFiles();
        if (mediaData.length === 0 && selectedFiles.length > 0) {
          setLoading(false);
          return; // Upload failed, error already set
        }
      }

      const auctionData = {
        ...formData,
        startingPrice: parseFloat(formData.startingPrice),
        duration: parseInt(formData.duration),
        media: mediaData,
      };

      const response = await auctionsAPI.create(auctionData);
      
      // Redirect to the created auction
      navigate(`/auction/${response.data.auction._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create auction');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Create New Auction</span>
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                type="text"
                placeholder="Enter auction title"
                value={formData.title}
                onChange={handleChange}
                required
                maxLength={100}
              />
              <p className="text-sm text-muted-foreground">
                {formData.title.length}/100 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Describe your item in detail..."
                value={formData.description}
                onChange={handleChange}
                required
                maxLength={1000}
                rows={5}
              />
              <p className="text-sm text-muted-foreground">
                {formData.description.length}/1000 characters
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startingPrice">
                  Starting Price ({formData.currency === 'NGN' ? '₦' : '$'}) *
                </Label>
                <Input
                  id="startingPrice"
                  name="startingPrice"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.00"
                  value={formData.startingPrice}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency *</Label>
                <select
                  id="currency"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  required
                >
                  <option value="NGN">₦ Nigerian Naira (NGN)</option>
                  <option value="USD">$ US Dollar (USD)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duration (hours) *</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  min="1"
                  max="168" // 1 week
                  placeholder="24"
                  value={formData.duration}
                  onChange={handleChange}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Maximum 168 hours (1 week)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="media">Media Files (optional)</Label>
              <Input
                id="media"
                name="media"
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
              />
              <p className="text-sm text-muted-foreground">
                Upload images or videos of your item (max 50MB per file)
              </p>
              {selectedFiles.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium">Selected files:</p>
                  <ul className="text-sm text-muted-foreground">
                    {selectedFiles.map((file, index) => (
                      <li key={index}>{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Media Preview */}
            {uploadedMedia.length > 0 && (
              <div className="space-y-2">
                <Label>Media Preview</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {uploadedMedia.map((media, index) => (
                    <div key={index} className="w-full h-48 bg-muted rounded-md overflow-hidden">
                      {media.type === 'image' ? (
                        <img 
                          src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${media.url}`}
                          alt={media.originalName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <video 
                          src={`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${media.url}`}
                          className="w-full h-full object-cover"
                          controls
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <Button type="submit" className="flex-1" disabled={loading || uploading}>
                {(loading || uploading) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {uploading ? 'Uploading Files...' : loading ? 'Creating Auction...' : 'Create Auction'}
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => navigate('/')}
                disabled={loading}
              >
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CreateAuction;

