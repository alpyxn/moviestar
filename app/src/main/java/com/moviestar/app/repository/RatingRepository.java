package com.moviestar.app.repository;

import com.moviestar.app.model.RatingDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RatingRepository extends JpaRepository<RatingDTO, Long> {
    @Query("SELECT AVG(r.rating) FROM RatingDTO r WHERE r.movieId = :movieId")
    Double findAverageRatingByMovieId(@Param("movieId") Long movieId);

    long countByMovieId(Long movieId);
    
    Optional<RatingDTO> findByUsernameAndMovieId(String username, Long movieId);
    
    void deleteByUsernameAndMovieId(String username, Long movieId);
    
    List<RatingDTO> findByUsername(String username);
}