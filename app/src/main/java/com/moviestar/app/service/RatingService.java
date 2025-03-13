package com.moviestar.app.service;

import com.moviestar.app.model.RatingDTO;
import java.util.List;
import java.util.Optional;

public interface RatingService {
    void addRating(RatingDTO ratingDTO, String username);
    double getAverageRatingForMovie(Long movieId);
    long getRatingCountForMovie(Long movieId);
    
    // Get a user's rating for a movie
    Optional<Integer> getUserRatingForMovie(Long movieId, String username);
    
    // Remove a user's rating for a movie
    void removeRating(Long movieId, String username);
    
    // Get all ratings by a user
    List<RatingDTO> getUserRatings(String username);
}