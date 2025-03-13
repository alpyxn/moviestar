package com.moviestar.app.service;

import com.moviestar.app.model.RatingDTO;
import com.moviestar.app.repository.RatingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class RatingServiceImpl implements RatingService {
    private final RatingRepository ratingRepository;

    @Override
    @Transactional
    @CacheEvict(value = {"movieRatingAverage", "movieRatingCount"}, key = "#ratingDTO.movieId")
    public void addRating(RatingDTO ratingDTO, String username) {
        // Check if user already rated this movie
        Optional<RatingDTO> existingRating = ratingRepository.findByUsernameAndMovieId(username, ratingDTO.getMovieId());
        
        if (existingRating.isPresent()) {
            // Update existing rating
            RatingDTO rating = existingRating.get();
            rating.setRating(ratingDTO.getRating());
            ratingRepository.save(rating);
        } else {
            // Create new rating
            ratingDTO.setUsername(username);
            ratingRepository.save(ratingDTO);
        }
    }

    @Override
    @Cacheable(value = "movieRatingAverage", key = "#movieId")
    public double getAverageRatingForMovie(Long movieId) {
        Double rating = ratingRepository.findAverageRatingByMovieId(movieId);
        return rating != null ? rating : 0.0;
    }

    @Override
    @Cacheable(value = "movieRatingCount", key = "#movieId")
    public long getRatingCountForMovie(Long movieId) {
        return ratingRepository.countByMovieId(movieId);
    }
    
    @Override
    public Optional<Integer> getUserRatingForMovie(Long movieId, String username) {
        return ratingRepository.findByUsernameAndMovieId(username, movieId)
                .map(RatingDTO::getRating);
    }
    
    @Override
    @Transactional
    @CacheEvict(value = {"movieRatingAverage", "movieRatingCount"}, key = "#movieId")
    public void removeRating(Long movieId, String username) {
        ratingRepository.deleteByUsernameAndMovieId(username, movieId);
    }
    
    @Override
    public List<RatingDTO> getUserRatings(String username) {
        return ratingRepository.findByUsername(username);
    }
}