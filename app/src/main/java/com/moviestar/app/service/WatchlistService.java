package com.moviestar.app.service;

import com.moviestar.app.model.MovieDTO;
import com.moviestar.app.model.Response.MovieResponse;
import com.moviestar.app.model.WatchlistItemDTO;
import com.moviestar.app.repository.MovieRepository;
import com.moviestar.app.repository.WatchlistRepository;
import com.moviestar.app.exception.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class WatchlistService {

    private final WatchlistRepository watchlistRepository;
    private final MovieRepository movieRepository;
    private final MovieService movieService;

    public List<MovieResponse> getUserWatchlist(String username) {
        List<WatchlistItemDTO> watchlistItems = watchlistRepository.findByUsername(username);
        
        return watchlistItems.stream()
                .map(item -> {
                    try {
                        Optional<MovieDTO> movieOptional = movieRepository.findById(item.getMovieId());
                        if (movieOptional.isPresent()) {
                            return movieService.convertToResponse(movieOptional.get());
                        } else {
                            return null;
                        }
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(movie -> movie != null) 
                .collect(Collectors.toList());
    }
    
    public List<MovieResponse> getPublicUserWatchlist(String username) {
        List<WatchlistItemDTO> watchlistItems = watchlistRepository.findByUsername(username);
        
        return watchlistItems.stream()
                .map(item -> {
                    try {
                        Optional<MovieDTO> movieOptional = movieRepository.findById(item.getMovieId());
                        if (movieOptional.isPresent()) {
                            return movieService.convertToResponse(movieOptional.get());
                        } else {
                            return null;
                        }
                    } catch (Exception e) {
                        return null;
                    }
                })
                .filter(movie -> movie != null)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public void addMovieToWatchlist(String username, Long movieId) {
        if (!movieRepository.existsById(movieId)) {
            throw new EntityNotFoundException("Movie not found with id: " + movieId);
        }
        
        if (watchlistRepository.existsByUsernameAndMovieId(username, movieId)) {
            return;
        }
        
        WatchlistItemDTO watchlistItem = new WatchlistItemDTO();
        watchlistItem.setUsername(username);
        watchlistItem.setMovieId(movieId);
        watchlistRepository.save(watchlistItem);
    }
    
    @Transactional
    public void removeMovieFromWatchlist(String username, Long movieId) {
        watchlistRepository.deleteByUsernameAndMovieId(username, movieId);
    }
    
    public boolean isMovieInWatchlist(String username, Long movieId) {
        return watchlistRepository.existsByUsernameAndMovieId(username, movieId);
    }
}
