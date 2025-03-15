import { User } from '@/api/apiService';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AdminDialogsProps {
  user: User;
  showBanDialog: boolean;
  showDeleteCommentDialog: boolean;
  showDeleteAllCommentsDialog: boolean;
  onBanDialogClose: () => void;
  onDeleteCommentDialogClose: () => void;
  onDeleteAllCommentsDialogClose: () => void;
  onBanUser: (shouldBan: boolean) => void;
  onDeleteComment: () => void;
  onDeleteAllComments: () => void;
}

export default function AdminDialogs({
  user,
  showBanDialog,
  showDeleteCommentDialog,
  showDeleteAllCommentsDialog,
  onBanDialogClose,
  onDeleteCommentDialogClose,
  onDeleteAllCommentsDialogClose,
  onBanUser,
  onDeleteComment,
  onDeleteAllComments
}: AdminDialogsProps) {
  return (
    <>
      {/* Ban/Unban Dialog */}
      <AlertDialog open={showBanDialog} onOpenChange={onBanDialogClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {user.status === 'BANNED' ? 'Unban User' : 'Ban User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {user.status === 'BANNED' 
                ? `Are you sure you want to unban ${user.username}? They will regain access to all features.` 
                : `Are you sure you want to ban ${user.username}? They will lose access to all features.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => onBanUser(user.status !== 'BANNED')} 
              className={user.status === 'BANNED' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {user.status === 'BANNED' ? 'Unban' : 'Ban'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Delete Comment Dialog */}
      <AlertDialog open={showDeleteCommentDialog} onOpenChange={onDeleteCommentDialogClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Comment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this comment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onDeleteComment}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete All Comments Dialog */}
      <AlertDialog open={showDeleteAllCommentsDialog} onOpenChange={onDeleteAllCommentsDialogClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete All Comments</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete all comments from {user?.username}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={onDeleteAllComments}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
