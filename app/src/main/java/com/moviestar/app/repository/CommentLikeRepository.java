package com.moviestar.app.repository;

import com.moviestar.app.model.CommentLikeDTO;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface CommentLikeRepository extends CrudRepository<CommentLikeDTO, Long> {
    
    Optional<CommentLikeDTO> findByCommentIdAndUsername(Long commentId, String username);
    
    boolean existsByCommentIdAndUsername(Long commentId, String username);
    
    @Modifying
    @Query("DELETE FROM CommentLikeDTO cl WHERE cl.commentId = :commentId AND cl.username = :username")
    void deleteByCommentIdAndUsername(@Param("commentId") Long commentId, @Param("username") String username);
    
    @Query("SELECT COUNT(cl) FROM CommentLikeDTO cl WHERE cl.commentId = :commentId AND cl.isLike = TRUE")
    int countLikesByCommentId(@Param("commentId") Long commentId);
    
    @Query("SELECT COUNT(cl) FROM CommentLikeDTO cl WHERE cl.commentId = :commentId AND cl.isLike = FALSE")
    int countDislikesByCommentId(@Param("commentId") Long commentId);

    void deleteByCommentId(Long commentId);
}
