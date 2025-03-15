package com.moviestar.app.controller;

import com.moviestar.app.model.Response.MovieResponse;
import com.moviestar.app.service.WatchlistService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class WatchlistController {

    private final WatchlistService watchlistService;

    @GetMapping("/watchlist")
    public ResponseEntity<List<MovieResponse>> getWatchlist(@AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        return ResponseEntity.ok(watchlistService.getUserWatchlist(username));
    }
    
    @GetMapping("/users/{username}/watchlist")
    public ResponseEntity<List<MovieResponse>> getUserWatchlist(@PathVariable String username) {
        return ResponseEntity.ok(watchlistService.getPublicUserWatchlist(username));
    }

    @PostMapping("/watchlist/{movieId}")
    public ResponseEntity<Void> addToWatchlist(
            @PathVariable Long movieId,
            @AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        watchlistService.addMovieToWatchlist(username, movieId);
        return ResponseEntity.ok().build();
    }
    
    @DeleteMapping("/watchlist/{movieId}")
    public ResponseEntity<Void> removeFromWatchlist(
            @PathVariable Long movieId,
            @AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        watchlistService.removeMovieFromWatchlist(username, movieId);
        return ResponseEntity.ok().build();
    }
    
    @GetMapping("/watchlist/{movieId}/status")
    public ResponseEntity<Map<String, Boolean>> checkWatchlistStatus(
            @PathVariable Long movieId,
            @AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        boolean isInWatchlist = watchlistService.isMovieInWatchlist(username, movieId);
        return ResponseEntity.ok(Map.of("inWatchlist", isInWatchlist));
    }
}
