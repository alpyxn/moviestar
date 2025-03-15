package com.moviestar.app.repository;

import com.moviestar.app.model.CommentDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class CommentRepositoryTest {

    @Mock
    private CommentRepository commentRepository;

    @Test
    void findByUsernameOrderByCreatedAtDesc() {
        // Create test users and comments
        String username1 = "testuser1";
        String username2 = "testuser2";
        
        CommentDTO comment1 = createComment("First comment by user1", username1, 1L);
        CommentDTO comment2 = createComment("Second comment by user1", username1, 2L);
        CommentDTO comment3 = createComment("Comment by user2", username2, 1L);
        
        List<CommentDTO> user1Comments = Arrays.asList(comment1, comment2);
        List<CommentDTO> user2Comments = Arrays.asList(comment3);
        
        when(commentRepository.findByUsernameOrderByCreatedAtDesc(username1)).thenReturn(user1Comments);
        when(commentRepository.findByUsernameOrderByCreatedAtDesc(username2)).thenReturn(user2Comments);
        
        List<CommentDTO> resultUser1Comments = commentRepository.findByUsernameOrderByCreatedAtDesc(username1);
        assertEquals(2, resultUser1Comments.size());
        assertTrue(resultUser1Comments.stream().allMatch(c -> c.getUsername().equals(username1)));
        
        List<CommentDTO> resultUser2Comments = commentRepository.findByUsernameOrderByCreatedAtDesc(username2);
        assertEquals(1, resultUser2Comments.size());
        assertEquals(username2, resultUser2Comments.get(0).getUsername());
        
        verify(commentRepository).findByUsernameOrderByCreatedAtDesc(username1);
        verify(commentRepository).findByUsernameOrderByCreatedAtDesc(username2);
    }

    @Test
    void deleteByUsername() {
        String username = "testuser1";
        
        doNothing().when(commentRepository).deleteByUsername(anyString());
        
        commentRepository.deleteByUsername(username);
        
        verify(commentRepository).deleteByUsername(username);
    }
    
    private CommentDTO createComment(String text, String username, Long movieId) {
        CommentDTO comment = new CommentDTO();
        comment.setComment(text);
        comment.setUsername(username);
        comment.setMovieId(movieId);
        comment.setCreatedAt(LocalDateTime.now());
        comment.setLikesCount(0);
        comment.setDislikesCount(0);
        return comment;
    }
}
