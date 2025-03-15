package com.moviestar.app.controller;

import com.moviestar.app.model.CommentDTO;
import com.moviestar.app.model.RatingDTO;
import com.moviestar.app.model.Requests.CommentLikeRequest;
import com.moviestar.app.model.Requests.CommentRequest;
import com.moviestar.app.model.Requests.RatingRequest;
import com.moviestar.app.model.Response.CommentResponse;
import com.moviestar.app.model.Response.MovieResponse;
import com.moviestar.app.service.CommentService;
import com.moviestar.app.service.MovieService;
import com.moviestar.app.service.RatingService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.HashMap;

@RestController
@RequestMapping("/api/movies")
@AllArgsConstructor
public class MovieController {
    private final MovieService movieService;
    private final CommentService commentService;
    private final RatingService ratingService;

    @GetMapping
    public ResponseEntity<List<MovieResponse>> getMovies() {
        return ResponseEntity.ok(movieService.getAllMovies().stream()
                .map(movieService::convertToResponse)
                .collect(Collectors.toList()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MovieResponse> getMovieById(@PathVariable Long id) {
        return ResponseEntity.ok(movieService.convertToResponse(movieService.getMovieById(id)));
    }

    @GetMapping("/search")
    public ResponseEntity<List<MovieResponse>> searchMovies(
            @RequestParam(required = false) String title,
            @RequestParam(required = false) String actor,
            @RequestParam(required = false) String genre) {
        List<MovieResponse> response;
        if (title != null) {
            response = movieService.getMoviesByTitle(title).stream()
                    .map(movieService::convertToResponse)
                    .collect(Collectors.toList());
        } else if (actor != null) {
            response = movieService.getMoviesByActor(actor).stream()
                    .map(movieService::convertToResponse)
                    .collect(Collectors.toList());
        } else if (genre != null) {
            response = movieService.getMoviesByGenre(genre).stream()
                    .map(movieService::convertToResponse)
                    .collect(Collectors.toList());
        } else {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/{movieId}/comments")
    public ResponseEntity<Void> addComment(
            @PathVariable Long movieId,
            @Valid @RequestBody CommentRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        CommentDTO commentDTO = new CommentDTO();
        commentDTO.setComment(request.getComment());
        commentDTO.setMovieId(movieId);
        commentDTO.setUsername(jwt.getClaimAsString("preferred_username"));
        commentDTO.setLikesCount(0);
        commentDTO.setDislikesCount(0);
        commentService.addComment(commentDTO);
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/{movieId}/comments")
    public ResponseEntity<List<CommentResponse>> getMovieComments(
            @PathVariable Long movieId,
            @RequestParam(required = false, defaultValue = "newest") String sortBy) {
        return ResponseEntity.ok(commentService.getCommentsByMovieIdSorted(movieId, sortBy));
    }
    
    @PostMapping("/comments/{commentId}/like")
    public ResponseEntity<CommentResponse> likeOrDislikeComment(
            @PathVariable Long commentId,
            @Valid @RequestBody CommentLikeRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        CommentResponse response = commentService.likeComment(commentId, username, request.getIsLike());
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/comments/{commentId}/like")
    public ResponseEntity<CommentResponse> removeCommentLike(
            @PathVariable Long commentId,
            @AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        CommentResponse response = commentService.removeLike(commentId, username);
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/comments/{commentId}/like/status")
    public ResponseEntity<?> getLikeStatus(
            @PathVariable Long commentId,
            @AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        boolean hasLiked = commentService.hasUserLiked(commentId, username);
        boolean hasDisliked = commentService.hasUserDisliked(commentId, username);
        
        return ResponseEntity.ok(new Object() {
            public final boolean liked = hasLiked;
            public final boolean disliked = hasDisliked;
        });
    }

    @PutMapping("/comments/{commentId}")
    public ResponseEntity<CommentResponse> updateComment(
            @RequestBody @Valid CommentRequest request,
            @PathVariable("commentId") Long commentId,
            @AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        try {
            CommentResponse response = commentService.updateComment(commentId, username, request.getComment());
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable Long commentId,
            @AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        try {
            commentService.deleteUserComment(commentId, username);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }
    }

    @PostMapping("/{movieId}/ratings")
    public ResponseEntity<Void> addRating(
            @PathVariable Long movieId,
            @Valid @RequestBody RatingRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        RatingDTO ratingDTO = new RatingDTO();
        ratingDTO.setRating(request.getRating());
        ratingDTO.setMovieId(movieId);
        ratingService.addRating(ratingDTO, jwt.getClaimAsString("preferred_username"));
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @GetMapping("/{movieId}/ratings")
    public ResponseEntity<Double> getMovieRating(@PathVariable Long movieId) {
        return  ResponseEntity.ok(ratingService.getAverageRatingForMovie(movieId));
    }

    @GetMapping("/{movieId}/ratings/user")
    public ResponseEntity<?> getUserRating(
            @PathVariable Long movieId,
            @AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        return ratingService.getUserRatingForMovie(movieId, username)
                .map(ratingValue -> ResponseEntity.ok(new Object() {
                    public final int rating = ratingValue;
                }))
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{movieId}/ratings")
    public ResponseEntity<Void> removeRating(
            @PathVariable Long movieId,
            @AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        ratingService.removeRating(movieId, username);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/users/me/ratings")
    public ResponseEntity<List<Map<String, Object>>> getUserRatings(@AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        List<RatingDTO> ratings = ratingService.getUserRatings(username);
        
        List<Map<String, Object>> response = ratings.stream()
            .map(rating -> {
                Map<String, Object> ratingMap = new HashMap<>();
                try {
                    MovieResponse movie = movieService.convertToResponse(
                        movieService.getMovieById(rating.getMovieId())
                    );
                    
                    ratingMap.put("id", rating.getId());
                    ratingMap.put("movieId", rating.getMovieId());
                    ratingMap.put("rating", rating.getRating());
                    ratingMap.put("movie", movie);
                } catch (Exception e) {
                    ratingMap.put("id", rating.getId());
                    ratingMap.put("movieId", rating.getMovieId());
                    ratingMap.put("rating", rating.getRating());
                    ratingMap.put("error", "Movie not found");
                }
                return ratingMap;
            })
            .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/random")
    public ResponseEntity<List<MovieResponse>> getRandomizedMovies() {
        return ResponseEntity.ok(movieService.getRandomizedMovies().stream()
                .map(movieService::convertToResponse)
                .collect(Collectors.toList()));
    }
}