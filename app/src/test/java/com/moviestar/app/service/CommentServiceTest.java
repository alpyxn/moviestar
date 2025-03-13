package com.moviestar.app.service;

import com.moviestar.app.model.CommentDTO;
import com.moviestar.app.model.CommentLikeDTO;
import com.moviestar.app.model.Response.CommentResponse;
import com.moviestar.app.repository.CommentLikeRepository;
import com.moviestar.app.repository.CommentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.Comparator;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommentServiceTest {

    @Mock
    private CommentRepository commentRepository;
    
    @Mock
    private CommentLikeRepository commentLikeRepository;

    @InjectMocks
    private CommentService commentService;

    @Test
    void getCommentsByMovieId() {
        LocalDateTime now = LocalDateTime.now();
        List<CommentDTO> comments = Arrays.asList(
            createCommentDTO(1L, "Great movie!", "user1", now, 5, 2),
            createCommentDTO(2L, "Loved it!", "user2", now, 3, 1)
        );
        when(commentRepository.getCommentDTOByMovieId(1L)).thenReturn(comments);

        List<CommentResponse> result = commentService.getCommentsByMovieId(1L);

        assertEquals(2, result.size());
        assertEquals("Great movie!", result.get(0).getComment());
        assertEquals("user1", result.get(0).getUsername());
        assertEquals(5, result.get(0).getLikesCount());
        assertEquals(2, result.get(0).getDislikesCount());
        assertEquals("Loved it!", result.get(1).getComment());
        assertEquals(3, result.get(1).getLikesCount());
        assertEquals(1, result.get(1).getDislikesCount());
    }

    @Test
    void addComment() {
        CommentDTO commentDTO = createCommentDTO(1L, "Great movie!", "user1", LocalDateTime.now(), 0, 0);
        when(commentRepository.save(any(CommentDTO.class))).thenReturn(commentDTO);

        commentService.addComment(commentDTO);

        verify(commentRepository).save(commentDTO);
    }

    @Test
    void likeComment_NewLike() {
        CommentDTO comment = createCommentDTO(1L, "Great movie!", "user1", LocalDateTime.now(), 0, 0);
        when(commentRepository.findById(1L)).thenReturn(Optional.of(comment));
        when(commentLikeRepository.findByCommentIdAndUsername(1L, "user2")).thenReturn(Optional.empty());
        when(commentRepository.save(any(CommentDTO.class))).thenReturn(comment);
        
        CommentResponse response = commentService.likeComment(1L, "user2", true);
        
        assertEquals(1, response.getLikesCount());
        assertEquals(0, response.getDislikesCount());
        verify(commentLikeRepository).save(any(CommentLikeDTO.class));
    }
    
    @Test
    void likeComment_ChangeFromDislikeToLike() {
        CommentDTO comment = createCommentDTO(1L, "Great movie!", "user1", LocalDateTime.now(), 0, 1);
        CommentLikeDTO existingLike = new CommentLikeDTO();
        existingLike.setId(1L);
        existingLike.setCommentId(1L);
        existingLike.setUsername("user2");
        existingLike.setIsLike(false);
        
        when(commentRepository.findById(1L)).thenReturn(Optional.of(comment));
        when(commentLikeRepository.findByCommentIdAndUsername(1L, "user2")).thenReturn(Optional.of(existingLike));
        when(commentRepository.save(any(CommentDTO.class))).thenAnswer(i -> i.getArgument(0));
        
        CommentResponse response = commentService.likeComment(1L, "user2", true);
        
        assertEquals(1, response.getLikesCount());
        assertEquals(0, response.getDislikesCount());
        verify(commentLikeRepository).save(existingLike);
    }
    
    @Test
    void removeLike() {
        CommentDTO comment = createCommentDTO(1L, "Great movie!", "user1", LocalDateTime.now(), 1, 0);
        CommentLikeDTO existingLike = new CommentLikeDTO();
        existingLike.setId(1L);
        existingLike.setCommentId(1L);
        existingLike.setUsername("user2");
        existingLike.setIsLike(true);
        
        when(commentRepository.findById(1L)).thenReturn(Optional.of(comment));
        when(commentLikeRepository.findByCommentIdAndUsername(1L, "user2")).thenReturn(Optional.of(existingLike));
        when(commentRepository.save(any(CommentDTO.class))).thenAnswer(i -> i.getArgument(0));
        
        CommentResponse response = commentService.removeLike(1L, "user2");
        
        assertEquals(0, response.getLikesCount());
        assertEquals(0, response.getDislikesCount());
        verify(commentLikeRepository).deleteByCommentIdAndUsername(1L, "user2");
    }
    
    @Test
    void hasUserLiked() {
        CommentLikeDTO like = new CommentLikeDTO();
        like.setIsLike(true);
        
        when(commentLikeRepository.findByCommentIdAndUsername(1L, "user1")).thenReturn(Optional.of(like));
        
        assertTrue(commentService.hasUserLiked(1L, "user1"));
        assertFalse(commentService.hasUserDisliked(1L, "user1"));
    }
    
    @Test
    void hasUserDisliked() {
        CommentLikeDTO like = new CommentLikeDTO();
        like.setIsLike(false);
        
        when(commentLikeRepository.findByCommentIdAndUsername(1L, "user1")).thenReturn(Optional.of(like));
        
        assertFalse(commentService.hasUserLiked(1L, "user1"));
        assertTrue(commentService.hasUserDisliked(1L, "user1"));
    }

    @Test
    void getCommentsByMovieIdSortedByLikes() {
        LocalDateTime now = LocalDateTime.now();
        List<CommentDTO> comments = Arrays.asList(
            createCommentDTO(1L, "Less liked comment", "user1", now, 3, 1),
            createCommentDTO(2L, "Most liked comment", "user2", now, 10, 2),
            createCommentDTO(3L, "Medium liked comment", "user3", now, 5, 1)
        );
        
        when(commentRepository.getCommentsByMovieIdOrderByLikesDesc(1L)).thenReturn(comments.stream()
                .sorted(Comparator.comparing(CommentDTO::getLikesCount).reversed())
                .collect(Collectors.toList()));

        List<CommentResponse> result = commentService.getCommentsByMovieIdSorted(1L, "likes");

        assertEquals(3, result.size());
        assertEquals("Most liked comment", result.get(0).getComment());
        assertEquals("Medium liked comment", result.get(1).getComment());
        assertEquals("Less liked comment", result.get(2).getComment());
    }

    @Test
    void getCommentsByMovieIdSortedByDislikes() {
        LocalDateTime now = LocalDateTime.now();
        List<CommentDTO> comments = Arrays.asList(
            createCommentDTO(1L, "Medium disliked comment", "user1", now, 5, 3),
            createCommentDTO(2L, "Most disliked comment", "user2", now, 2, 8),
            createCommentDTO(3L, "Less disliked comment", "user3", now, 7, 1)
        );
        
        when(commentRepository.getCommentsByMovieIdOrderByDislikesDesc(1L)).thenReturn(comments.stream()
                .sorted(Comparator.comparing(CommentDTO::getDislikesCount).reversed())
                .collect(Collectors.toList()));

        List<CommentResponse> result = commentService.getCommentsByMovieIdSorted(1L, "dislikes");

        assertEquals(3, result.size());
        assertEquals("Most disliked comment", result.get(0).getComment());
        assertEquals("Medium disliked comment", result.get(1).getComment());
        assertEquals("Less disliked comment", result.get(2).getComment());
    }

    @Test
    void getCommentsByMovieIdSortedByRating() {
        LocalDateTime now = LocalDateTime.now();
        List<CommentDTO> comments = Arrays.asList(
            createCommentDTO(1L, "Negative rating", "user1", now, 2, 5),  // -3
            createCommentDTO(2L, "Highest rating", "user2", now, 10, 2),  // +8
            createCommentDTO(3L, "Medium rating", "user3", now, 6, 3)    // +3
        );
        
        when(commentRepository.getCommentsByMovieIdOrderByRatingDesc(1L)).thenReturn(List.of(
            comments.get(1), comments.get(2), comments.get(0)
        ));

        List<CommentResponse> result = commentService.getCommentsByMovieIdSorted(1L, "rating");

        assertEquals(3, result.size());
        assertEquals("Highest rating", result.get(0).getComment());
        assertEquals("Medium rating", result.get(1).getComment());
        assertEquals("Negative rating", result.get(2).getComment());
    }

    @Test
    void updateComment_SuccessfulUpdate() {
        Long commentId = 1L;
        String username = "testuser";
        String originalComment = "Original comment";
        String updatedText = "Updated comment";
        
        CommentDTO originalCommentDTO = createCommentDTO(commentId, originalComment, username, 
                                                  LocalDateTime.now(), 5, 2);
        
        when(commentRepository.findById(commentId)).thenReturn(Optional.of(originalCommentDTO));
        when(commentRepository.save(any(CommentDTO.class))).thenAnswer(i -> i.getArgument(0));
        
        CommentResponse result = commentService.updateComment(commentId, username, updatedText);
        
        assertEquals(updatedText, result.getComment());
        assertEquals(username, result.getUsername());
        assertNotNull(result.getUpdatedAt());
        assertEquals(5, result.getLikesCount());
        assertEquals(2, result.getDislikesCount());
        
        verify(commentRepository).save(any(CommentDTO.class));
    }
    
    @Test
    void updateComment_NotOwnComment() {
        Long commentId = 1L;
        String commentOwner = "user1";
        String attemptingUser = "user2";
        String originalComment = "Original comment";
        String updatedText = "Updated comment";
        
        CommentDTO originalCommentDTO = createCommentDTO(commentId, originalComment, commentOwner, 
                                                  LocalDateTime.now(), 5, 2);
        
        when(commentRepository.findById(commentId)).thenReturn(Optional.of(originalCommentDTO));
        
        // The service throws RuntimeException, not IllegalAccessException
        assertThrows(RuntimeException.class, () -> {
            commentService.updateComment(commentId, attemptingUser, updatedText);
        });
        
        verify(commentRepository, never()).save(any(CommentDTO.class));
    }
    
    @Test
    void updateComment_CommentNotFound() {
        Long commentId = 999L;
        String username = "testuser";
        String updatedText = "Updated comment";
        
        when(commentRepository.findById(commentId)).thenReturn(Optional.empty());
        
        assertThrows(RuntimeException.class, () -> {
            commentService.updateComment(commentId, username, updatedText);
        });
        
        verify(commentRepository, never()).save(any(CommentDTO.class));
    }

    @Test
    void deleteComment_SuccessfulDeletion() {
        Long commentId = 1L;
        String username = "testuser";
        
        CommentDTO commentDTO = createCommentDTO(commentId, "Comment to delete", username, 
                                           LocalDateTime.now(), 5, 2);
        
        when(commentRepository.findById(commentId)).thenReturn(Optional.of(commentDTO));
        doNothing().when(commentRepository).deleteById(commentId);

        assertDoesNotThrow(() -> {
            commentService.deleteUserComment(commentId, username);
        });
        
        // Update to verify deleteById instead of delete
        verify(commentRepository).deleteById(commentId);
    }
    
    @Test
    void deleteComment_NotOwnComment() {
        Long commentId = 1L;
        String commentOwner = "user1";
        String attemptingUser = "user2";
        
        CommentDTO commentDTO = createCommentDTO(commentId, "Comment to delete", commentOwner, 
                                           LocalDateTime.now(), 5, 2);
        
        when(commentRepository.findById(commentId)).thenReturn(Optional.of(commentDTO));
        
        // The service should throw an exception when a user tries to delete someone else's comment
        assertThrows(RuntimeException.class, () -> {
            commentService.deleteUserComment(commentId, attemptingUser);
        });
        
        verify(commentRepository, never()).delete(any(CommentDTO.class));
    }
    
    @Test
    void deleteComment_CommentNotFound() {
        Long commentId = 999L;
        String username = "testuser";
        
        when(commentRepository.findById(commentId)).thenReturn(Optional.empty());
        
        assertThrows(RuntimeException.class, () -> {
            commentService.deleteUserComment(commentId, username);
        });
        
        verify(commentRepository, never()).delete(any(CommentDTO.class));
    }

    @Test
    void getCommentsByUsername() {
        LocalDateTime now = LocalDateTime.now();
        List<CommentDTO> comments = Arrays.asList(
            createCommentDTO(1L, "First comment", "testuser", now.minusDays(2), 5, 2),
            createCommentDTO(2L, "Second comment", "testuser", now, 3, 1),
            createCommentDTO(3L, "Comment by another user", "anotheruser", now, 7, 3)
        );
        
        when(commentRepository.findByUsernameOrderByCreatedAtDesc("testuser")).thenReturn(
            comments.stream()
                .filter(comment -> "testuser".equals(comment.getUsername()))
                .sorted(Comparator.comparing(CommentDTO::getCreatedAt).reversed())
                .collect(Collectors.toList())
        );

        // Call the service method
        List<CommentResponse> result = commentService.getCommentsByUsername("testuser");

        // Verify the results
        assertEquals(2, result.size());
        assertEquals("Second comment", result.get(0).getComment());
        assertEquals("First comment", result.get(1).getComment());
        assertEquals("testuser", result.get(0).getUsername());
        assertEquals("testuser", result.get(1).getUsername());
        
        // Verify the repository method was called with correct parameters
        verify(commentRepository).findByUsernameOrderByCreatedAtDesc("testuser");
    }

    @Test
    void deleteComment() {
        Long commentId = 1L;
        
        // Mock repository behavior
        doNothing().when(commentLikeRepository).deleteByCommentId(commentId);
        doNothing().when(commentRepository).deleteById(commentId);
        
        // Call the service method
        commentService.deleteComment(commentId);
        
        // Verify that both repository methods were called with the correct parameters
        verify(commentLikeRepository).deleteByCommentId(commentId);
        verify(commentRepository).deleteById(commentId);
    }

    @Test
    void deleteAllUserComments() {
        // Create test data - list of comments for a specific user
        String username = "testuser";
        List<CommentDTO> userComments = Arrays.asList(
            createCommentDTO(1L, "First comment to delete", username, LocalDateTime.now(), 5, 2),
            createCommentDTO(2L, "Second comment to delete", username, LocalDateTime.now(), 3, 1)
        );
        
        // Mock repository behavior
        when(commentRepository.findByUsernameOrderByCreatedAtDesc(username)).thenReturn(userComments);
        doNothing().when(commentLikeRepository).deleteByCommentId(anyLong());
        doNothing().when(commentRepository).deleteById(anyLong());
        
        // Call the service method
        assertDoesNotThrow(() -> {
            commentService.deleteAllUserComments(username);
        });
        
        // Verify that repository methods were called with the correct parameters
        verify(commentRepository).findByUsernameOrderByCreatedAtDesc(username);
        verify(commentLikeRepository).deleteByCommentId(1L);
        verify(commentLikeRepository).deleteByCommentId(2L);
        verify(commentRepository).deleteById(1L);
        verify(commentRepository).deleteById(2L);
    }

    @Test
    void deleteAllUserComments_HandlesExceptions() {
        String username = "testuser";
        List<CommentDTO> userComments = Arrays.asList(
            createCommentDTO(1L, "Comment", username, LocalDateTime.now(), 5, 2),
            createCommentDTO(2L, "Comment with error", username, LocalDateTime.now(), 3, 1)
        );
        
        when(commentRepository.findByUsernameOrderByCreatedAtDesc(username)).thenReturn(userComments);
        doNothing().when(commentLikeRepository).deleteByCommentId(1L);
        doThrow(new RuntimeException("Test exception")).when(commentLikeRepository).deleteByCommentId(2L);
        
        // The method should throw a RuntimeException with a descriptive message
        RuntimeException exception = assertThrows(RuntimeException.class, () -> {
            commentService.deleteAllUserComments(username);
        });
        
        // Verify the exception message includes the username
        assertTrue(exception.getMessage().contains(username));
        assertTrue(exception.getMessage().contains("Failed to delete all comments"));
        
        // Verify the repository methods were called correctly
        verify(commentRepository).findByUsernameOrderByCreatedAtDesc(username);
        verify(commentLikeRepository).deleteByCommentId(1L);
        verify(commentLikeRepository).deleteByCommentId(2L);
    }

    private CommentDTO createCommentDTO(Long id, String comment, String username, LocalDateTime createdAt, 
                                       int likesCount, int dislikesCount) {
        CommentDTO commentDTO = new CommentDTO();
        commentDTO.setId(id);
        commentDTO.setComment(comment);
        commentDTO.setUsername(username);
        commentDTO.setCreatedAt(createdAt);
        commentDTO.setMovieId(1L);
        commentDTO.setLikesCount(likesCount);
        commentDTO.setDislikesCount(dislikesCount);
        return commentDTO;
    }
}