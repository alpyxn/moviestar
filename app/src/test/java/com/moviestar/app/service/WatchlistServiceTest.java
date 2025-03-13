package com.moviestar.app.service;

import com.moviestar.app.exception.EntityNotFoundException;
import com.moviestar.app.model.MovieDTO;
import com.moviestar.app.model.Response.MovieResponse;
import com.moviestar.app.model.WatchlistItemDTO;
import com.moviestar.app.repository.MovieRepository;
import com.moviestar.app.repository.WatchlistRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class WatchlistServiceTest {

    @Mock
    private WatchlistRepository watchlistRepository;

    @Mock
    private MovieRepository movieRepository;

    @Mock
    private MovieService movieService;

    @InjectMocks
    private WatchlistService watchlistService;

    @Test
    void getUserWatchlist_Success() {
        String username = "testuser";
        WatchlistItemDTO item1 = new WatchlistItemDTO();
        item1.setId(1L);
        item1.setUsername(username);
        item1.setMovieId(1L);
        item1.setAddedAt(LocalDateTime.now());

        WatchlistItemDTO item2 = new WatchlistItemDTO();
        item2.setId(2L);
        item2.setUsername(username);
        item2.setMovieId(2L);
        item2.setAddedAt(LocalDateTime.now());

        MovieDTO movie1 = new MovieDTO();
        movie1.setId(1L);
        movie1.setTitle("Movie 1");

        MovieDTO movie2 = new MovieDTO();
        movie2.setId(2L);
        movie2.setTitle("Movie 2");

        MovieResponse response1 = new MovieResponse(
            1L, 
            "Movie 1", 
            "Description", 
            2020, 
            Collections.emptyList(), // genres
            Collections.emptyList(), // actors
            Collections.emptyList(), // directors
            "poster", 
            "backdrop", 
            8.5, 
            10
        );
        
        MovieResponse response2 = new MovieResponse(
            2L, 
            "Movie 2", 
            "Description", 
            2021, 
            Collections.emptyList(), // genres
            Collections.emptyList(), // actors
            Collections.emptyList(), // directors
            "poster", 
            "backdrop", 
            7.5, 
            5
        );

        when(watchlistRepository.findByUsername(username)).thenReturn(Arrays.asList(item1, item2));
        when(movieRepository.findById(1L)).thenReturn(Optional.of(movie1));
        when(movieRepository.findById(2L)).thenReturn(Optional.of(movie2));
        when(movieService.convertToResponse(movie1)).thenReturn(response1);
        when(movieService.convertToResponse(movie2)).thenReturn(response2);

        List<MovieResponse> result = watchlistService.getUserWatchlist(username);

        assertEquals(2, result.size());
        assertEquals("Movie 1", result.get(0).getTitle());
        assertEquals("Movie 2", result.get(1).getTitle());
    }

    @Test
    void addMovieToWatchlist_Success() {
        String username = "testuser";
        Long movieId = 1L;
        when(movieRepository.existsById(movieId)).thenReturn(true);
        when(watchlistRepository.existsByUsernameAndMovieId(username, movieId)).thenReturn(false);

        watchlistService.addMovieToWatchlist(username, movieId);

        verify(watchlistRepository).save(any(WatchlistItemDTO.class));
    }

    @Test
    void addMovieToWatchlist_AlreadyExists() {
        String username = "testuser";
        Long movieId = 1L;
        when(movieRepository.existsById(movieId)).thenReturn(true);
        when(watchlistRepository.existsByUsernameAndMovieId(username, movieId)).thenReturn(true);

        watchlistService.addMovieToWatchlist(username, movieId);

        verify(watchlistRepository, never()).save(any(WatchlistItemDTO.class));
    }

    @Test
    void addMovieToWatchlist_MovieNotFound() {
        String username = "testuser";
        Long movieId = 999L;
        when(movieRepository.existsById(movieId)).thenReturn(false);

        assertThrows(EntityNotFoundException.class, () -> {
            watchlistService.addMovieToWatchlist(username, movieId);
        });
    }

    @Test
    void removeMovieFromWatchlist_Success() {
        String username = "testuser";
        Long movieId = 1L;

        watchlistService.removeMovieFromWatchlist(username, movieId);

        verify(watchlistRepository).deleteByUsernameAndMovieId(username, movieId);
    }

    @Test
    void isMovieInWatchlist_True() {
        String username = "testuser";
        Long movieId = 1L;
        when(watchlistRepository.existsByUsernameAndMovieId(username, movieId)).thenReturn(true);

        boolean result = watchlistService.isMovieInWatchlist(username, movieId);

        assertTrue(result);
    }

    @Test
    void isMovieInWatchlist_False() {
        String username = "testuser";
        Long movieId = 1L;
        when(watchlistRepository.existsByUsernameAndMovieId(username, movieId)).thenReturn(false);

        boolean result = watchlistService.isMovieInWatchlist(username, movieId);

        assertFalse(result);
    }
    
    @Test
    void getUserWatchlist_EmptyWatchlist() {
        String username = "testuser";
        when(watchlistRepository.findByUsername(username)).thenReturn(Collections.emptyList());

        List<MovieResponse> result = watchlistService.getUserWatchlist(username);

        assertTrue(result.isEmpty());
        verify(watchlistRepository).findByUsername(username);
        verifyNoInteractions(movieRepository);
        verifyNoInteractions(movieService);
    }
    
    @Test
    void getUserWatchlist_MovieNoLongerExists() {
        String username = "testuser";
        WatchlistItemDTO item = new WatchlistItemDTO();
        item.setId(1L);
        item.setUsername(username);
        item.setMovieId(999L);
        item.setAddedAt(LocalDateTime.now());

        when(watchlistRepository.findByUsername(username)).thenReturn(Collections.singletonList(item));
        when(movieRepository.findById(999L)).thenReturn(Optional.empty());

        // Need to modify the service to handle this case gracefully instead of throwing exception
        try {
            // Just test that it doesn't throw an exception
            List<MovieResponse> result = watchlistService.getUserWatchlist(username);
            assertTrue(result.isEmpty());
        } catch (Exception e) {
            fail("Should handle missing movies gracefully: " + e.getMessage());
        }
        verify(movieRepository).findById(999L);
    }

    @Test
    void removeMovieFromWatchlist_NonExistentMovie() {
        String username = "testuser";
        Long movieId = 999L;
        
        // Even if the movie doesn't exist in the database, we should be able to remove it from watchlist
        doNothing().when(watchlistRepository).deleteByUsernameAndMovieId(username, movieId);

        // This should not throw any exception
        assertDoesNotThrow(() -> {
            watchlistService.removeMovieFromWatchlist(username, movieId);
        });
        
        verify(watchlistRepository).deleteByUsernameAndMovieId(username, movieId);
    }
    
    // Remove the tests for getUserWatchlistMovieIds since this method doesn't exist in the service
    // If you need this functionality, you'll need to implement it in the service first
    
}
