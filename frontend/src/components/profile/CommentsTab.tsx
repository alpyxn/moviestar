import React from 'react';
import { Comment, User } from '@/api/apiService';
import { Loader2, Trash2, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface CommentsTabProps {
  userComments: Comment[];
  displayedComments: Comment[];
  commentUsers: Record<string, User>;
  movieTitles: Record<number, string>;
  commentsLoading: boolean;
  loadingMoreComments: boolean;
  hasMoreComments: boolean;
  commentsEndRef: React.RefObject<HTMLDivElement>;
  onDeleteComment: (commentId: number) => void;
  isAdmin: boolean;
}

const CommentsTab: React.FC<CommentsTabProps> = ({
  userComments,
  displayedComments,
  commentUsers,
  movieTitles,
  commentsLoading,
  loadingMoreComments,
  hasMoreComments,
  commentsEndRef,
  onDeleteComment,
  isAdmin
}) => {
  const getInitials = (username: string): string => {
    return username.charAt(0).toUpperCase();
  };

  if (commentsLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-rose-600" />
        <span className="ml-2">Loading comments...</span>
      </div>
    );
  }

  if (userComments.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md bg-muted/50">
        <p className="text-muted-foreground">No comments found for this user.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {displayedComments.map(comment => (
        <Card key={comment.id} className="overflow-hidden">
          <CardContent className="p-4">
            <div className="flex justify-between">
              <div className="flex gap-2 items-center mb-2">
                <Avatar className="h-6 w-6">
                  {commentUsers[comment.username]?.profilePictureUrl ? (
                    <img 
                      src={commentUsers[comment.username].profilePictureUrl} 
                      alt={comment.username}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.style.display = "none";
                      }}
                    />
                  ) : (
                    <AvatarFallback>
                      {getInitials(comment.username)}
                    </AvatarFallback>
                  )}
                </Avatar>
                
                <Link 
                  to={`/movies/${comment.movieId}`} 
                  className="text-sm font-medium hover:underline"
                >
                  {movieTitles[comment.movieId] || `Movie #${comment.movieId}`}
                </Link>
                
                <span className="text-xs text-muted-foreground">
                  {format(new Date(comment.createdAt), 'MMM d, yyyy')}
                </span>
              </div>

              {/* Add delete button for admins */}
              {isAdmin && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onDeleteComment(comment.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:bg-red-100 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete comment</span>
                </Button>
              )}
            </div>

            <p className="text-sm mt-1">{comment.comment}</p>

            <div className="mt-2 flex justify-end">
              <Button 
                variant="ghost" 
                size="sm" 
                asChild 
                className="h-7 text-xs"
              >
                <Link to={`/movies/${comment.movieId}`} className="flex items-center gap-1">
                  <ExternalLink className="h-3 w-3" />
                  View movie
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {loadingMoreComments && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-rose-600" />
        </div>
      )}
      
      {hasMoreComments && !loadingMoreComments && (
        <div ref={commentsEndRef} className="h-4"></div>
      )}
      
      {!hasMoreComments && userComments.length > 0 && (
        <p className="text-center text-sm text-muted-foreground py-2">
          You've reached the end of the comments list
        </p>
      )}
    </div>
  );
};

export default CommentsTab;
