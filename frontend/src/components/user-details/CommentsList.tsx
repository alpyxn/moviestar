import { Comment } from '@/api/apiService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';
import UserAvatar from '@/components/ui/user-avatar';
import { format } from 'date-fns';
import { Loader2, MessageSquare, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

interface CommentsListProps {
  username: string;
  comments: Comment[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  endRef: React.RefObject<HTMLDivElement>;
  movieTitles: Record<number, string>;
  totalCount: number;
  isAdmin: boolean;
  isDeletingAll: boolean;
  onDeleteComment: (id: number) => void;
  onDeleteAllComments: () => void;
  isCurrentUser: boolean;
  showDeleteControls?: boolean; 
}

export default function CommentsList({
  username,
  comments,
  isLoading,
  isLoadingMore,
  hasMore,
  endRef,
  movieTitles,
  totalCount,
  isAdmin,
  isDeletingAll,
  onDeleteComment,
  onDeleteAllComments,
  isCurrentUser,
  showDeleteControls = false 
}: CommentsListProps) {
  
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    try {
      return format(new Date(dateString), 'MMMM d, yyyy');
    } catch (error) {
      return 'Invalid date format';
    }
  };

  return (
    <TabsContent value="comments">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              <span className="break-all">{username}'s Comments</span>
            </div>
            {isAdmin && totalCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                onClick={onDeleteAllComments}
                disabled={isDeletingAll}
              >
                {isDeletingAll ? (
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5 mr-2" />
                )}
                Delete All Comments
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Comments this user has made on movies
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-4">
              {comments.map(comment => (
                <Card key={comment.id} className="border border-muted">
                  <CardHeader className="p-3 pb-1">
                    <div className="flex justify-between items-start gap-2 flex-wrap">
                      <div className="flex items-center">
                        <UserAvatar 
                          username={comment.username}
                          size="sm"
                          className="mr-2"
                          fetchIfMissing={true}
                        />
                        <Link to={`/movies/${comment.movieId}`} className="text-sm font-medium hover:underline line-clamp-2">
                          {movieTitles[comment.movieId] || `Movie #${comment.movieId}`}
                        </Link>
                      </div>
                      
                      <div className="flex flex-shrink-0 text-xs text-muted-foreground">
                        {formatDate(comment.createdAt)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-3 pt-2">
                    <p className="break-words">{comment.comment}</p>
                  </CardContent>
                  <CardFooter className="p-3 pt-1 flex justify-between flex-wrap gap-2">
                    <div className="flex gap-3">
                      <span className="flex items-center">
                        👍 {comment.likesCount}
                      </span>
                      <span className="flex items-center">
                        👎 {comment.dislikesCount}
                      </span>
                    </div>
                    
                    {/* Show delete button for own comments or for admins */}
                    {showDeleteControls && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => onDeleteComment(comment.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        <span className="text-xs">Delete</span>
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
              
              {/* Infinite scroll loader for comments */}
              <div ref={endRef} className="py-4 flex justify-center">
                {isLoadingMore && (
                  <Loader2 className="h-6 w-6 animate-spin text-rose-600" />
                )}
                {!hasMore && totalCount > 10 && (
                  <p className="text-sm text-muted-foreground">You've reached the end of comments</p>
                )}
              </div>
              
              <div className="mt-2 text-sm text-gray-500">
                Showing {comments.length} of {totalCount} comments
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-muted/50 rounded-md">
              <MessageSquare className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
              <h3 className="font-medium text-lg mb-1">No Comments Available</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                {isCurrentUser
                  ? "You haven't made any comments yet."
                  : `${username} hasn't made any comments yet.`
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
