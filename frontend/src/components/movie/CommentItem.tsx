import { Comment, User } from "@/api/apiService";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import UserAvatar from "@/components/ui/user-avatar";
import { format } from "date-fns";
import { Edit2, Loader2, ThumbsDown, ThumbsUp, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";

interface CommentItemProps {
  comment: Comment;
  userProfile?: User;
  isCurrentUserComment?: boolean;
  isAdmin?: boolean;
  isLiked?: boolean;
  isDisliked?: boolean;
  onLike?: () => void;
  onDislike?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isSubmittingLike?: boolean;
  showMovieLink?: boolean;
  movieTitle?: string;
}

export default function CommentItem({
  comment,
  userProfile,
  isCurrentUserComment = false,
  isAdmin = false,
  isLiked = false,
  isDisliked = false,
  onLike,
  onDislike,
  onEdit,
  onDelete,
  isSubmittingLike = false,
  showMovieLink = false,
  movieTitle
}: CommentItemProps) {
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch (error) {
      return '';
    }
  };

  return (
    <Card className={`border border-muted mb-4 ${isCurrentUserComment ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
      <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <UserAvatar 
            username={comment.username}
            profilePictureUrl={userProfile?.profilePictureUrl}
            size="lg" 
          />
          <div>
            <Link 
              to={`/users/${comment.username}`} 
              className="text-base md:text-lg font-medium hover:underline"
            >
              {comment.username}
              {isCurrentUserComment && (
                <span className="ml-2 text-xs bg-blue-100 text-blue-800 py-0.5 px-1.5 rounded-full dark:bg-blue-900 dark:text-blue-300">You</span>
              )}
            </Link>
            <div className="flex items-center gap-1">

              <p className="text-sm text-muted-foreground">
                {formatDate(comment.createdAt)}
              </p>
              
              {showMovieLink && movieTitle && (
                <>
                  <span className="text-sm text-muted-foreground">•</span>
                  <Link 
                    to={`/movies/${comment.movieId}`} 
                    className="text-sm text-muted-foreground hover:underline hover:text-primary truncate max-w-[150px]"
                  >
                    {movieTitle}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-3 pt-2">
        <p className="break-words text-base">
          {comment.comment}
        </p>
      </CardContent>
      
      <CardFooter className="p-3 pt-1 flex justify-between flex-wrap gap-2">
        <div className="flex gap-3">
          {onLike && (
            <Button
              size="sm"
              variant="ghost"
              className={`h-9 px-3 ${isLiked ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : ''}`}
              disabled={isSubmittingLike}
              onClick={onLike}
            >
              {isSubmittingLike ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <ThumbsUp className={`h-5 w-5 mr-2 ${isLiked ? 'fill-current' : ''}`} />
              )}
              <span className="text-sm">{comment.likesCount || 0}</span>
            </Button>
          )}
          
          {onDislike && (
            <Button
              size="sm"
              variant="ghost"
              className={`h-9 px-3 ${isDisliked ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400' : ''}`}
              disabled={isSubmittingLike}
              onClick={onDislike}
            >
              {isSubmittingLike ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <ThumbsDown className={`h-5 w-5 mr-2 ${isDisliked ? 'fill-current' : ''}`} />
              )}
              <span className="text-sm">{comment.dislikesCount || 0}</span>
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          {isCurrentUserComment && onEdit && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-9"
              onClick={onEdit}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              <span className="text-sm">Edit</span>
            </Button>
          )}
          
          {(isCurrentUserComment || isAdmin) && onDelete && (
            <Button 
              size="sm" 
              variant="ghost" 
              className="h-9 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              <span className="text-sm">Delete</span>
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
