import { User } from '@/api/apiService';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { format } from 'date-fns';
import { 
  AlertTriangle, 
  Ban, 
  Calendar, 
  CheckCircle, 
  Loader2, 
  Shield, 
  UserIcon 
} from 'lucide-react';

interface UserProfileCardProps {
  user: User;
  isAdmin: boolean;
  isBanning: boolean;
  notesForDeveloper: string[];
  onBanClick: () => void;
}

export default function UserProfileCard({ 
  user, 
  isAdmin, 
  isBanning, 
  notesForDeveloper,
  onBanClick 
}: UserProfileCardProps) {
  
  const getInitials = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (error) {
      return 'Invalid date format';
    }
  };

  return (
    <div className="lg:col-span-1">
      <Card>
        <CardHeader className={`text-center ${user.status === 'BANNED' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-muted'}`}>
          <div className="flex flex-col items-center">
            <Avatar className="h-20 w-20 md:h-24 md:w-24 mb-4">
              {user.profilePictureUrl ? (
                <img 
                  src={user.profilePictureUrl} 
                  alt={`${user.username}'s profile`}
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.style.display = "none";
                  }}
                />
              ) : (
                <AvatarFallback className="bg-rose-100 text-rose-800 text-xl">
                  {getInitials(user.username)}
                </AvatarFallback>
              )}
            </Avatar>
            <CardTitle className="text-xl md:text-2xl break-all">{user.username}</CardTitle>
            {user.email && <CardDescription className="break-all">{user.email}</CardDescription>}
            
            {user.status && (
              <Badge 
                className={`mt-2 ${
                  user.status === 'ACTIVE' ? 'bg-green-100 text-green-800 hover:bg-green-200' : 
                  'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                {user.status === 'ACTIVE' ? (
                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                ) : (
                  <Ban className="h-3.5 w-3.5 mr-1" />
                )}
                {user.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex items-center">
              <UserIcon className="h-5 w-5 mr-3 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p>{user.username}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Member since</p>
                <p>{formatDate(user.createdAt)}</p>
              </div>
            </div>
            
            {user.lastLogin && (
              <div className="flex items-center">
                <Calendar className="h-5 w-5 mr-3 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Last login</p>
                  <p>{formatDate(user.lastLogin)}</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
        
        {/* Admin Controls */}
        {isAdmin && (
          <CardFooter className="flex flex-col gap-2">
            <div className="w-full mb-2 border-t pt-4">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-amber-600" />
                <p className="text-sm font-medium text-center">Admin Controls</p>
              </div>
            </div>
            
            {/* Ban/Unban button */}
            <Button 
              onClick={onBanClick} 
              variant="outline" 
              className={`w-full ${
                user.status === 'BANNED' 
                  ? 'border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950/30'
                  : 'border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950/30'
              }`}
              disabled={isBanning}
            >
              {isBanning ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                user.status === 'BANNED' ? (
                  <CheckCircle className="h-4 w-4 mr-2" />
                ) : (
                  <Ban className="h-4 w-4 mr-2" />
                )
              )}
              {user.status === 'BANNED' ? 'Unban User' : 'Ban User'}
            </Button>
          </CardFooter>
        )}
      </Card>
      
      {/* Developer Notes */}
      {isAdmin && notesForDeveloper.length > 0 && (
        <Card className="mt-4 border-amber-200">
          <CardHeader className="bg-amber-50 py-2">
            <CardTitle className="text-sm text-amber-800 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Developer Notes
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <ul className="list-disc pl-5 text-xs text-amber-700 space-y-1">
              {notesForDeveloper.map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
