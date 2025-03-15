import adminApi from '@/api/adminApi';

/**
 * Deletes a movie by its ID
 * @param movieId The ID of the movie to delete
 * @param toast Toast function to display notifications
 * @returns Promise<boolean> indicating success or failure
 */
export async function deleteMovie(
  movieId: number, 
  toast: {
    (props: { title?: string; description?: string; variant?: "default" | "destructive" }): void;
    dismiss?: (toastId?: string) => void;
  }
): Promise<boolean> {
  try {
    await adminApi.deleteMovie(movieId);
    toast({
      title: "Success",
      description: "Movie deleted successfully",
    });
    return true;
  } catch (error) {
    console.error('Error deleting movie:', error);
    toast({
      title: "Error",
      description: "Failed to delete movie",
      variant: "destructive",
    });
    return false;
  }
}