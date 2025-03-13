package com.moviestar.app.repository;

import com.moviestar.app.model.CommentLikeDTO;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommentLikeRepositoryTest {

    @Mock
    private CommentLikeRepository commentLikeRepository;

    @Test
    void findByCommentIdAndUsername() {
        CommentLikeDTO like = new CommentLikeDTO();
        like.setId(1L);
        like.setCommentId(1L);
        like.setUsername("testuser");
        like.setIsLike(true);
        
        when(commentLikeRepository.findByCommentIdAndUsername(1L, "testuser"))
            .thenReturn(Optional.of(like));
        
        Optional<CommentLikeDTO> result = commentLikeRepository.findByCommentIdAndUsername(1L, "testuser");
        
        assertTrue(result.isPresent());
        assertEquals(1L, result.get().getCommentId());
        assertEquals("testuser", result.get().getUsername());
        assertEquals(true, result.get().getIsLike());
        
        verify(commentLikeRepository).findByCommentIdAndUsername(1L, "testuser");
    }

    @Test
    void existsByCommentIdAndUsername() {
        when(commentLikeRepository.existsByCommentIdAndUsername(1L, "testuser"))
            .thenReturn(true);
        when(commentLikeRepository.existsByCommentIdAndUsername(1L, "otheruser"))
            .thenReturn(false);
        
        boolean exists = commentLikeRepository.existsByCommentIdAndUsername(1L, "testuser");
        boolean notExists = commentLikeRepository.existsByCommentIdAndUsername(1L, "otheruser");
        
        assertTrue(exists);
        assertFalse(notExists);
        
        verify(commentLikeRepository, times(1)).existsByCommentIdAndUsername(1L, "testuser");
        verify(commentLikeRepository, times(1)).existsByCommentIdAndUsername(1L, "otheruser");
    }

    @Test
    void deleteByCommentIdAndUsername() {
        doNothing().when(commentLikeRepository).deleteByCommentIdAndUsername(anyLong(), anyString());
        
        commentLikeRepository.deleteByCommentIdAndUsername(1L, "testuser");
        
        verify(commentLikeRepository).deleteByCommentIdAndUsername(1L, "testuser");
    }

    @Test
    void countLikesByCommentId() {
        when(commentLikeRepository.countLikesByCommentId(1L))
            .thenReturn((int) 3);
        
        long count = commentLikeRepository.countLikesByCommentId(1L);
        
        assertEquals(3, count);
        verify(commentLikeRepository).countLikesByCommentId(1L);
    }
    
    @Test
    void countDislikesByCommentId() {
        when(commentLikeRepository.countDislikesByCommentId(1L))
            .thenReturn((int) 2);
        
        long count = commentLikeRepository.countDislikesByCommentId(1L);
        
        assertEquals(2, count);
        verify(commentLikeRepository).countDislikesByCommentId(1L);
    }
}
