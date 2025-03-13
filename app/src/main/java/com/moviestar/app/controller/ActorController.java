package com.moviestar.app.controller;

import com.moviestar.app.model.Response.ActorResponse;
import com.moviestar.app.service.ActorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.moviestar.app.model.MovieDTO;
import com.moviestar.app.model.Response.MovieResponse;
import com.moviestar.app.service.MovieService;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/actors")
@RequiredArgsConstructor
public class ActorController {
    private final ActorService actorService;
    private final MovieService movieService; // Add this dependency

    @GetMapping
    public ResponseEntity<List<ActorResponse>> getAllActors() {
        return ResponseEntity.ok(actorService.getAllActors());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActorResponse> getActorById(@PathVariable Long id) {
        return ResponseEntity.ok(actorService.getActorById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<ActorResponse>> searchActors(@RequestParam String query) {
        return ResponseEntity.ok(actorService.searchActors(query));
    }

    @GetMapping("/{id}/about")
    public ResponseEntity<Map<String, String>> getActorAbout(@PathVariable Long id) {
        ActorResponse actor = actorService.getActorById(id);
        Map<String, String> response = new HashMap<>();
        response.put("about", actor.getAbout());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/picture")
    public ResponseEntity<Map<String, String>> getActorPicture(@PathVariable Long id) {
        ActorResponse actor = actorService.getActorById(id);
        Map<String, String> response = new HashMap<>();
        response.put("pictureUrl", actor.getPictureUrl());
        return ResponseEntity.ok(response);
    }

    /**
     * Get all movies an actor has appeared in
     */
    @GetMapping("/{id}/movies")
    public ResponseEntity<List<MovieResponse>> getActorMovies(@PathVariable Long id) {
        List<MovieDTO> movies = actorService.getActorMovies(id);
        List<MovieResponse> movieResponses = movies.stream()
                .map(movieService::convertToResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(movieResponses);
    }
}