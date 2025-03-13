package com.moviestar.app.repository;

import com.moviestar.app.model.CommentDTO;
import org.springframework.data.repository.CrudRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommentRepository extends CrudRepository<CommentDTO, Long> {

    List<CommentDTO> getCommentDTOByMovieId(Long movieId);
    
    @Query("SELECT c FROM CommentDTO c WHERE c.movieId = :movieId ORDER BY c.likesCount DESC, c.createdAt DESC")
    List<CommentDTO> getCommentsByMovieIdOrderByLikesDesc(@Param("movieId") Long movieId);
    
    @Query("SELECT c FROM CommentDTO c WHERE c.movieId = :movieId ORDER BY c.dislikesCount DESC, c.createdAt DESC")
    List<CommentDTO> getCommentsByMovieIdOrderByDislikesDesc(@Param("movieId") Long movieId);
    
    @Query("SELECT c FROM CommentDTO c WHERE c.movieId = :movieId ORDER BY (c.likesCount - c.dislikesCount) DESC, c.createdAt DESC")
    List<CommentDTO> getCommentsByMovieIdOrderByRatingDesc(@Param("movieId") Long movieId);
    
    // New method to fetch comments by username
    List<CommentDTO> findByUsernameOrderByCreatedAtDesc(String username);
    
    // New method to delete comments by username
    @Modifying
    @Query("DELETE FROM CommentDTO c WHERE c.username = :username")
    void deleteByUsername(@Param("username") String username);
}
