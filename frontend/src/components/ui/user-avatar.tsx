import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import userApi from "@/api/userApi";
import { useEffect, useState } from "react";

interface UserAvatarProps {
  username: string;
  profilePictureUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
  fetchIfMissing?: boolean;
}

export function UserAvatar({ 
  username, 
  profilePictureUrl, 
  size = "md",
  className = "",
  fetchIfMissing = true
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);
  const [fetchedPictureUrl, setFetchedPictureUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  useEffect(() => {
    if (profilePictureUrl || !fetchIfMissing || isLoading || fetchedPictureUrl !== null) return;
    
    const fetchProfilePicture = async () => {
      setIsLoading(true);
      try {
        const pictureUrl = await userApi.getUserProfilePicture(username);
        setFetchedPictureUrl(pictureUrl);
      } catch (error) {
        console.warn(`Failed to fetch profile picture for ${username}:`, error);
        setFetchedPictureUrl(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProfilePicture();
  }, [username, profilePictureUrl, fetchIfMissing, isLoading, fetchedPictureUrl]);
  
  const getInitials = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };
  
  const sizeClasses = {
    sm: "h-6 w-6 text-xs",
    md: "h-8 w-8 text-sm",
    lg: "h-12 w-12 text-base"
  };
  
  const avatarClass = `${sizeClasses[size]} ${className}`;
  const fallbackClass = "bg-rose-100 text-rose-800";

  const effectiveProfilePicture = profilePictureUrl || fetchedPictureUrl;

  return (
    <Avatar className={avatarClass}>
      {effectiveProfilePicture && !imageError ? (
        <img 
          src={effectiveProfilePicture} 
          alt={`${username}'s profile`}
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <AvatarFallback className={fallbackClass}>
          {getInitials(username)}
        </AvatarFallback>
      )}
    </Avatar>
  );
}

export default UserAvatar;
