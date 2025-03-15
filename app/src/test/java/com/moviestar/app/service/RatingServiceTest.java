package com.moviestar.app.service;

import com.moviestar.app.model.RatingDTO;
import com.moviestar.app.repository.MovieRepository;
import com.moviestar.app.repository.RatingRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class RatingServiceImplTest {

    @Mock
    private RatingRepository ratingRepository;

    @Mock
    private MovieRepository movieRepository;

    @Mock
    private MovieService movieService;

    @InjectMocks
    private RatingServiceImpl ratingService;

    @Test
    void addRating() {
        RatingDTO ratingDTO = new RatingDTO();
        ratingDTO.setMovieId(1L);
        ratingDTO.setRating(8);

        when(ratingRepository.save(any(RatingDTO.class))).thenReturn(ratingDTO);

        ratingService.addRating(ratingDTO, "testuser");

        assertEquals("testuser", ratingDTO.getUsername());
        verify(ratingRepository).save(ratingDTO);
    }

    @Test
    void getAverageRatingForMovie_WithRatings() {
        when(ratingRepository.findAverageRatingByMovieId(1L)).thenReturn(8.5);

        double result = ratingService.getAverageRatingForMovie(1L);

        assertEquals(8.5, result);
    }

    @Test
    void getAverageRatingForMovie_NoRatings() {
        when(ratingRepository.findAverageRatingByMovieId(1L)).thenReturn(null);

        double result = ratingService.getAverageRatingForMovie(1L);

        assertEquals(0.0, result);
    }

    @Test
    void getRatingCountForMovie() {
        when(ratingRepository.countByMovieId(1L)).thenReturn(10L);

        long result = ratingService.getRatingCountForMovie(1L);

        assertEquals(10L, result);
    }

    @Test
    void getUserRatingForMovie_Found() {
        String username = "testuser";
        Long movieId = 1L;
        RatingDTO ratingDTO = new RatingDTO();
        ratingDTO.setId(1L);
        ratingDTO.setUsername(username);
        ratingDTO.setMovieId(movieId);
        ratingDTO.setRating(9);

        when(ratingRepository.findByUsernameAndMovieId(username, movieId))
            .thenReturn(Optional.of(ratingDTO));

        Optional<Integer> result = ratingService.getUserRatingForMovie(movieId, username);

        assertTrue(result.isPresent());
        assertEquals(9, result.get());  
    }

    @Test
    void getUserRatingForMovie_NotFound() {
        String username = "testuser";
        Long movieId = 1L;

        when(ratingRepository.findByUsernameAndMovieId(username, movieId))
            .thenReturn(Optional.empty());

        Optional<Integer> result = ratingService.getUserRatingForMovie(movieId, username);

        assertFalse(result.isPresent());
    }

    @Test
    void removeRating() {
        String username = "testuser";
        Long movieId = 1L;

        ratingService.removeRating(movieId, username);

        verify(ratingRepository).deleteByUsernameAndMovieId(username, movieId);
    }

    @Test
    void getUserRatings_WithMovies() {
        String username = "testuser";
        
        RatingDTO rating1 = new RatingDTO();
        rating1.setId(1L);
        rating1.setUsername(username);
        rating1.setMovieId(1L);
        rating1.setRating(8);
        
        RatingDTO rating2 = new RatingDTO();
        rating2.setId(2L);
        rating2.setUsername(username);
        rating2.setMovieId(2L);
        rating2.setRating(9);
        
        when(ratingRepository.findByUsername(username)).thenReturn(Arrays.asList(rating1, rating2));
        

        List<RatingDTO> results = ratingService.getUserRatings(username);

        assertEquals(2, results.size());
        assertEquals(1L, results.get(0).getMovieId());
        assertEquals(8, results.get(0).getRating());
        assertEquals(2L, results.get(1).getMovieId());
        assertEquals(9, results.get(1).getRating());
        
        verify(ratingRepository).findByUsername(username);
    }
    
    @Test
    void getUserRatings_WithMissingMovie() {
        String username = "testuser";
        
        RatingDTO rating1 = new RatingDTO();
        rating1.setId(1L);
        rating1.setUsername(username);
        rating1.setMovieId(1L);
        rating1.setRating(8);
        
        when(ratingRepository.findByUsername(username)).thenReturn(Collections.singletonList(rating1));
        

        List<RatingDTO> results = ratingService.getUserRatings(username);

        assertEquals(1, results.size());
        assertEquals(1L, results.get(0).getMovieId());
        assertEquals(8, results.get(0).getRating());
    }
    
    @Test
    void getUserRatings_Empty() {
        String username = "testuser";
        
        when(ratingRepository.findByUsername(username)).thenReturn(Collections.emptyList());

        List<RatingDTO> results = ratingService.getUserRatings(username);

        assertTrue(results.isEmpty());
    }
}