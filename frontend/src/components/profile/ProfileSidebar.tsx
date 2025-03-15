import { User } from '@/api/apiService';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Film, User as UserIcon } from 'lucide-react';
import { format } from 'date-fns';

interface ProfileSidebarProps {
  user: User | null;
  watchlistCount: number;
  onSignOut: () => void;
}

export default function ProfileSidebar({ user, watchlistCount, onSignOut }: ProfileSidebarProps) {
  const getInitials = (name: string): string => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-muted">
        <div className="flex flex-col items-center text-center">
          <Avatar className="h-24 w-24 mb-2">
            {user?.profilePictureUrl ? (
              <img 
                src={user.profilePictureUrl} 
                alt={`${user.username}'s profile`}
                className="h-full w-full object-cover"
                onError={(e) => {
                  console.log(1);
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.style.display = "none";
                }}
              />
            ) : (
              <AvatarFallback className="bg-rose-100 text-rose-800 text-xl">
                {user?.username ? getInitials(user.username) : "U"}
              </AvatarFallback>
            )}
          </Avatar>
          <CardTitle className="break-words max-w-full">{user?.username || 'User'}</CardTitle>
          <CardDescription className="break-words max-w-full">
            {user?.email || 'No email available'}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ul className="divide-y">
          <li className="px-4 py-3 hover:bg-muted transition-colors">
            <div className="flex items-center">
              <UserIcon className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
              <span className="truncate">Member since: {user?.createdAt ? format(new Date(user.createdAt), 'MMMM yyyy') : 'Unknown'}</span>
            </div>
          </li>
          <li className="px-4 py-3 hover:bg-muted transition-colors">
            <div className="flex items-center">
              <Film className="h-4 w-4 mr-2 text-muted-foreground shrink-0" />
              <span>Watchlist: {watchlistCount} movies</span>
            </div>
          </li>
        </ul>
      </CardContent>
      <CardFooter className="flex justify-center p-4">
        <Button 
          variant="outline" 
          size="sm"
          className="w-full"
          onClick={onSignOut}
        >
          Sign Out
        </Button>
      </CardFooter>
    </Card>
  );
}
