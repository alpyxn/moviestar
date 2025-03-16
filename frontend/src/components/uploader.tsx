import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, AlertCircle } from 'lucide-react';
import axios from 'axios';

interface ImageUploadProps {
  onImageUploaded: (url: string) => void;
  defaultImage?: string;
  className?: string;
  id?: string;
  aspectRatio?: 'vertical' | 'horizontal' | 'square';
  placeholderText?: string; 
}

export function Uploader({ 
  onImageUploaded, 
  defaultImage, 
  className = '', 
  id = 'image-upload',
  aspectRatio = 'horizontal',
  placeholderText 
}: ImageUploadProps) {
  const [image, setImage] = useState<string | null>(defaultImage || null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [configValid, setConfigValid] = useState(true);
  
  const inputId = `${id}-input`;

  useEffect(() => {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
    
    if (!cloudName || !uploadPreset) {
      console.error('Missing Cloudinary configuration:', { cloudName, uploadPreset });
      setConfigValid(false);
      setError('Cloudinary configuration is incomplete. Please check your environment variables.');
    }
  }, []);

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'vertical':
        return 'aspect-[2/3] max-h-[450px]'; 
      case 'square':
        return 'aspect-square max-h-[300px]';
      case 'horizontal':
      default:
        return 'aspect-[16/9] max-h-[300px]'; 
    }
  };

  const handleUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);

    if (!file.type.includes('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);

    // Create form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
    

    try {
      console.log('Cloudinary upload request:', {
        cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
        uploadPreset: import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET,
        fileName: file.name,
        fileType: file.type,
        fileSize: `${(file.size / 1024).toFixed(2)} KB`
      });
      
      const response = await axios.post(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          },
          timeout: 30000
        }
      );

      console.log('Cloudinary response:', response.data);
      
      const imageUrl = response.data.secure_url;
      setImage(imageUrl);
      onImageUploaded(imageUrl);
    } catch (err: any) {
      console.error('Upload failed:', err);
      
      const statusCode = err.response?.status;
      const cloudinaryError = err.response?.data?.error?.message;
      
      if (statusCode === 401 || statusCode === 403) {
        setError(`Authentication error (${statusCode}). Please check your Cloudinary credentials.`);
      } else if (cloudinaryError) {
        setError(`Cloudinary error: ${cloudinaryError}`);
      } else if (err.code === 'ECONNABORTED') {
        setError('Upload timed out. Please try with a smaller image or check your connection.');
      } else {
        setError(`Failed to upload image: ${err.message || 'Unknown error'}`);
      }
      
      if (err.response?.data) {
        console.error('Cloudinary error details:', err.response.data);
      }
    } finally {
      setIsUploading(false);
    }
  }, [onImageUploaded, aspectRatio]);

  const removeImage = useCallback(() => {
    setImage(null);
    onImageUploaded('');
  }, [onImageUploaded]);

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {image ? (
        <div className="relative w-full">
          <img 
            src={image} 
            alt="Uploaded" 
            className={`w-full h-auto rounded-md object-cover ${getAspectRatioClass()}`}
          />
          <Button 
            variant="destructive" 
            size="icon"
            className="absolute top-2 right-2 rounded-full"
            onClick={removeImage}
            type="button"
          >
            <X size={16} />
          </Button>
        </div>
      ) : (
        <div className={`w-full border-2 border-dashed border-gray-300 rounded-md p-6 
                        flex flex-col items-center justify-center bg-gray-50 ${getAspectRatioClass()}`}>
          <Upload className="h-10 w-10 text-gray-400 mb-2" />
          <p className="text-sm text-gray-500 mb-2">
            {placeholderText || (aspectRatio === 'vertical' ? 'Upload poster image' : 'Upload image')}
          </p>
          <p className="text-xs text-gray-400">PNG, JPG, GIF up to 5MB</p>
        </div>
      )}

      <input 
        type="file" 
        id={inputId}
        className="hidden" 
        accept="image/*" 
        onChange={handleUpload} 
        disabled={isUploading || !configValid}
      />
      
      {!image && (
        <Button 
          variant="outline" 
          onClick={(e) => {
            e.preventDefault(); 
            document.getElementById(inputId)?.click();
          }}
          disabled={isUploading || !configValid}
          className="w-full"
          type="button" 
        >
          {isUploading ? 'Uploading...' : 'Choose Image'}
        </Button>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-md w-full">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}
      
      {!configValid && !error && (
        <div className="bg-yellow-50 p-3 rounded-md text-yellow-800 text-sm w-full">
          Configuration issue: Please check Cloudinary setup in your environment variables.
        </div>
      )}
    </div>
  );
}