package com.moviestar.app.service;

import com.moviestar.app.model.RatingDTO;
import java.util.List;
import java.util.Optional;

public interface RatingService {
    void addRating(RatingDTO ratingDTO, String username);
    double getAverageRatingForMovie(Long movieId);
    long getRatingCountForMovie(Long movieId);
    
    Optional<Integer> getUserRatingForMovie(Long movieId, String username);
    
    void removeRating(Long movieId, String username);
    
    List<RatingDTO> getUserRatings(String username);
}