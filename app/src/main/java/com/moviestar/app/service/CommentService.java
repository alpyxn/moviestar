package com.moviestar.app.service;

import com.moviestar.app.model.CommentDTO;
import com.moviestar.app.model.CommentLikeDTO;
import com.moviestar.app.model.Response.CommentResponse;
import com.moviestar.app.repository.CommentLikeRepository;
import com.moviestar.app.repository.CommentRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@AllArgsConstructor
public class CommentService {
    private final CommentRepository commentRepository;
    private final CommentLikeRepository commentLikeRepository;

    public List<CommentResponse> getCommentsByMovieId(Long movieId) {
        return commentRepository.getCommentDTOByMovieId(movieId).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
    
    public List<CommentResponse> getCommentsByMovieIdSorted(Long movieId, String sortBy) {
        List<CommentDTO> comments;
        
        switch (sortBy) {
            case "likes":
                comments = commentRepository.getCommentsByMovieIdOrderByLikesDesc(movieId);
                break;
            case "dislikes":
                comments = commentRepository.getCommentsByMovieIdOrderByDislikesDesc(movieId);
                break;
            case "rating":
                comments = commentRepository.getCommentsByMovieIdOrderByRatingDesc(movieId);
                break;
            case "newest":
                comments = commentRepository.getCommentDTOByMovieId(movieId).stream()
                    .sorted(Comparator.comparing(CommentDTO::getCreatedAt).reversed())
                    .collect(Collectors.toList());
                break;
            default:
                comments = commentRepository.getCommentDTOByMovieId(movieId);
                break;
        }
        
        return comments.stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    private CommentResponse convertToResponse(CommentDTO dto) {
        return CommentResponse.builder()
                .id(dto.getId())
                .comment(dto.getComment())
                .username(dto.getUsername())
                .createdAt(dto.getCreatedAt())
                .updatedAt(dto.getUpdatedAt())
                .movieId(dto.getMovieId())
                .likesCount(dto.getLikesCount())
                .dislikesCount(dto.getDislikesCount())
                .build();
    }

    @Transactional
    public void addComment(CommentDTO commentDTO) {
        commentRepository.save(commentDTO);
    }

    @Transactional
    public CommentResponse likeComment(Long commentId, String username, boolean isLike) {
        CommentDTO comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + commentId));
        
        Optional<CommentLikeDTO> existingLike = commentLikeRepository.findByCommentIdAndUsername(commentId, username);
        
        if (existingLike.isPresent()) {
            CommentLikeDTO like = existingLike.get();
            
            if (like.getIsLike()) {
                comment.setLikesCount(comment.getLikesCount() - 1);
            } else {
                comment.setDislikesCount(comment.getDislikesCount() - 1);
            }
            
            like.setIsLike(isLike);
            commentLikeRepository.save(like);
        } else {
            CommentLikeDTO like = new CommentLikeDTO();
            like.setCommentId(commentId);
            like.setUsername(username);
            like.setIsLike(isLike);
            commentLikeRepository.save(like);
        }
        
        if (isLike) {
            comment.setLikesCount(comment.getLikesCount() + 1);
        } else {
            comment.setDislikesCount(comment.getDislikesCount() + 1);
        }
        
        CommentDTO updatedComment = commentRepository.save(comment);
        return convertToResponse(updatedComment);
    }

    @Transactional
    public CommentResponse removeLike(Long commentId, String username) {
        CommentDTO comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + commentId));
        
        Optional<CommentLikeDTO> existingLike = commentLikeRepository.findByCommentIdAndUsername(commentId, username);
        
        if (existingLike.isPresent()) {
            CommentLikeDTO like = existingLike.get();
            
            if (like.getIsLike()) {
                comment.setLikesCount(Math.max(0, comment.getLikesCount() - 1));
            } else {
                comment.setDislikesCount(Math.max(0, comment.getDislikesCount() - 1));
            }
            
            commentLikeRepository.deleteByCommentIdAndUsername(commentId, username);
            
            CommentDTO updatedComment = commentRepository.save(comment);
            return convertToResponse(updatedComment);
        }
        
        return convertToResponse(comment);
    }

    @Transactional
    public void deleteComment(Long commentId) {
        // First delete all likes for this comment
        commentLikeRepository.deleteByCommentId(commentId);
        
        // Then delete the comment
        commentRepository.deleteById(commentId);
    }

    public boolean hasUserLiked(Long commentId, String username) {
        Optional<CommentLikeDTO> like = commentLikeRepository.findByCommentIdAndUsername(commentId, username);
        return like.isPresent() && like.get().getIsLike();
    }

    public boolean hasUserDisliked(Long commentId, String username) {
        Optional<CommentLikeDTO> like = commentLikeRepository.findByCommentIdAndUsername(commentId, username);
        return like.isPresent() && !like.get().getIsLike();
    }

    /**
     * Update a comment
     * Only allows updating if the user is the comment author
     */
    @Transactional
    public CommentResponse updateComment(Long commentId, String username, String newText) {
        CommentDTO comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + commentId));
        
        if (!comment.getUsername().equals(username)) {
            throw new RuntimeException("You can only edit your own comments");
        }
        
        comment.setComment(newText);
        comment.setUpdatedAt(java.time.LocalDateTime.now());
        
        CommentDTO updatedComment = commentRepository.save(comment);
        return convertToResponse(updatedComment);
    }

    /**
     * Delete a user's own comment
     * Only allows deletion if the user is the comment author
     */
    @Transactional
    public void deleteUserComment(Long commentId, String username) {
        CommentDTO comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new RuntimeException("Comment not found with id: " + commentId));
        
        if (!comment.getUsername().equals(username)) {
            throw new RuntimeException("You can only delete your own comments");
        }
        
        // Delete all likes for this comment
        commentLikeRepository.deleteByCommentId(commentId);
        
        // Delete the comment
        commentRepository.deleteById(commentId);
    }

    /**
     * Get all comments by a specific user
     */
    public List<CommentResponse> getCommentsByUsername(String username) {
        return commentRepository.findByUsernameOrderByCreatedAtDesc(username).stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }
}
