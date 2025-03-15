import { User } from '@/api/apiService';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle, 
} from "@/components/ui/card";
import { Uploader } from '@/components/uploader';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Loader2, Trash2 } from 'lucide-react';

interface SettingsTabProps {
  user: User | null;
  newProfilePicture: string | null;
  isUpdatingProfile: boolean;
  onProfilePictureSelected: (imageUrl: string) => void;
  onUpdateProfile: () => Promise<void>;
  onRemoveProfilePicture: () => Promise<void>;
}

export default function SettingsTab({
  user,
  newProfilePicture,
  isUpdatingProfile,
  onProfilePictureSelected,
  onUpdateProfile,
  onRemoveProfilePicture,
}: SettingsTabProps) {

  const getInitials = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            Update your profile picture
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
            <div className="flex-shrink-0">
              <Avatar className="h-24 w-24 sm:h-32 sm:w-32">
                {/* Show new profile picture if available, otherwise show current or fallback */}
                {newProfilePicture || user?.profilePictureUrl ? (
                  <img 
                    src={newProfilePicture || user?.profilePictureUrl || ''} 
                    alt={`${user?.username}'s profile`}
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.style.display = "none";
                    }}
                  />
                ) : (
                  <AvatarFallback className="bg-rose-100 text-rose-800 text-4xl">
                    {user?.username ? getInitials(user.username) : "U"}
                  </AvatarFallback>
                )}
              </Avatar>
              
              {/* Remove Picture Button - Only show if there's a current picture */}
              {(user?.profilePictureUrl || newProfilePicture) && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4 w-full text-xs border-red-200 text-red-600 hover:bg-red-50"
                  onClick={onRemoveProfilePicture}
                  disabled={isUpdatingProfile}
                  type="button"
                >
                  {isUpdatingProfile ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  ) : (
                    <Trash2 className="h-3 w-3 mr-2" />
                  )}
                  Remove Picture
                </Button>
              )}
            </div>
            
            <div className="w-full max-w-md mt-4 sm:mt-0">
              <Uploader
                onImageUploaded={onProfilePictureSelected}
                defaultImage={newProfilePicture || user?.profilePictureUrl || ""}
                id="profile-picture-upload"
                aspectRatio="square"
                placeholderText="Upload profile image"
              />

              <div className="mt-3 text-xs sm:text-sm text-muted-foreground">
                <p>Recommended: Upload a square image for best results.</p>
                <p>Maximum file size: 5MB</p>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end border-t pt-6">
          <Button
            onClick={onUpdateProfile}
            disabled={isUpdatingProfile || (newProfilePicture === null && user?.profilePictureUrl !== null)}
            className="bg-rose-600 hover:bg-rose-700"
            type="button"
          >
            {isUpdatingProfile ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Profile'
            )}
          </Button>
        </CardFooter>
      </Card>
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Username</h3>
              <p className="break-all">{user?.username}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Email Address</h3>
              <p className="break-all">{user?.email || 'No email provided'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Member Since</h3>
              <p>{user?.createdAt ? format(new Date(user.createdAt), 'MMMM d, yyyy') : 'Unknown'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
