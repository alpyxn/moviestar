import { Comment, LikeStatus, User } from "@/api/apiService";
import { Button } from "@/components/ui/button";
import CommentSorter from "@/components/ui/comment-sorter";
import { Textarea } from "@/components/ui/textarea";
import { InfiniteScroll } from "@/components/infinite-scroll";
import { Loader2, MessageSquare } from "lucide-react";
import CommentItem from "@/components/movie/CommentItem";
import { useKeycloak } from "@react-keycloak/web";
import { useState, useRef } from "react";

interface CommentsSectionProps {
  comments: Comment[];
  commentUsers: Record<string, User>;
  commentLikeStatuses: Record<number, LikeStatus>;
  isSubmittingLike: number | null;
  hasMoreComments: boolean;
  loadingMoreComments: boolean;
  commentSortBy: string;
  submittingComment: boolean;
  isAdmin: boolean;
  onSortChange: (sortBy: string) => void;
  onLoadMoreComments: () => Promise<void>; 
  onLike: (commentId: number, isLike: boolean) => Promise<void>; 
  onAddComment: (text: string) => Promise<void>; 
  onEditComment: (commentId: number, text: string) => Promise<boolean | void>; // Fix: Accept Promise<boolean | void>
  onDeleteComment: (commentId: number) => void;
}

export default function CommentsSection({
  comments,
  commentUsers,
  commentLikeStatuses,
  isSubmittingLike,
  hasMoreComments,
  loadingMoreComments,
  commentSortBy,
  submittingComment,
  isAdmin,
  onSortChange,
  onLoadMoreComments,
  onLike,
  onAddComment,
  onEditComment,
  onDeleteComment,
}: CommentsSectionProps) {
  const { keycloak, initialized } = useKeycloak();
  const isAuthenticated = initialized && keycloak.authenticated;
  const [commentText, setCommentText] = useState("");
  const [editCommentId, setEditCommentId] = useState<number | null>(null);
  const [editCommentText, setEditCommentText] = useState("");
  const [isEditingComment, setIsEditingComment] = useState(false);
  const editTextAreaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmitComment = async () => {
    if (commentText.trim()) {
      await onAddComment(commentText);
      setCommentText("");
    }
  };

  const handleEditComment = async () => {
    if (!editCommentId || !editCommentText.trim()) return;
    
    setIsEditingComment(true);
    try {
      await onEditComment(editCommentId, editCommentText);
      setEditCommentId(null);
      setEditCommentText("");
    } finally {
      setIsEditingComment(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <h2 className="text-2xl font-bold">Comments</h2>
        <CommentSorter
          currentValue={commentSortBy}
          onChange={(value) => onSortChange(value)}
        />
      </div>

      {/* Add comment form - only for authenticated users */}
      {isAuthenticated ? (
        <div className="space-y-4">
          <Textarea
            placeholder="Share your thoughts about this movie..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitComment}
              disabled={submittingComment || !commentText.trim()}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {submittingComment ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Post Comment
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-2">Sign in to leave a comment</p>
          <Button
            variant="outline"
            onClick={() => keycloak.login()}
          >
            Sign In
          </Button>
        </div>
      )}

      {/* Comments List with Infinite Scroll */}
      <div className="space-y-4 mt-6">
        {comments.length === 0 && !loadingMoreComments ? (
          <div className="text-center py-6 text-gray-500">
            <MessageSquare className="mx-auto h-12 w-12 opacity-20 mb-2" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <InfiniteScroll
            loadMore={onLoadMoreComments}
            hasMore={hasMoreComments}
            isLoading={loadingMoreComments}
            className="space-y-4"
            endMessage={<p className="text-center text-sm text-gray-500 pt-4">No more comments to load</p>}
          >
            {comments.map((comment) => {
              const likeStatus = commentLikeStatuses[comment.id] || { liked: false, disliked: false };
              const isCommentAuthor = isAuthenticated && keycloak.tokenParsed?.preferred_username === comment.username;
              
              return (
                <CommentItem 
                  key={comment.id}
                  comment={comment}
                  userProfile={commentUsers[comment.username]}
                  isCurrentUserComment={isCommentAuthor}
                  isAdmin={isAdmin}
                  isLiked={likeStatus.liked}
                  isDisliked={likeStatus.disliked}
                  isSubmittingLike={isSubmittingLike === comment.id}
                  onLike={() => onLike(comment.id, true)}
                  onDislike={() => onLike(comment.id, false)}
                  onEdit={() => {
                    setEditCommentId(comment.id);
                    setEditCommentText(comment.comment);
                    // Focus on textarea when it appears
                    setTimeout(() => {
                      if (editTextAreaRef.current) {
                        editTextAreaRef.current.focus();
                      }
                    }, 0);
                  }}
                  onDelete={() => onDeleteComment(comment.id)}
                />
              );
            })}
          </InfiniteScroll>
        )}
      </div>

      {/* Edit Comment Dialog */}
      {editCommentId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full space-y-4">
            <h3 className="text-lg font-bold">Edit Comment</h3>
            <Textarea
              ref={editTextAreaRef}
              value={editCommentText}
              onChange={(e) => setEditCommentText(e.target.value)}
              className="min-h-[120px] resize-none"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setEditCommentId(null)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleEditComment}
                disabled={isEditingComment || !editCommentText.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isEditingComment ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
