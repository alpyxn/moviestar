package com.moviestar.app.controller;

import com.moviestar.app.model.Response.DirectorResponse;
import com.moviestar.app.model.Response.MovieResponse;
import com.moviestar.app.service.DirectorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/directors")
@RequiredArgsConstructor
public class DirectorController {
    private final DirectorService directorService;

    @GetMapping
    public ResponseEntity<List<DirectorResponse>> getAllDirectors() {
        return ResponseEntity.ok(directorService.getAllDirectors());
    }

    @GetMapping("/{id}")
    public ResponseEntity<DirectorResponse> getDirectorById(@PathVariable Long id) {
        return ResponseEntity.ok(directorService.getDirectorById(id));
    }

    @GetMapping("/search")
    public ResponseEntity<List<DirectorResponse>> searchDirectors(@RequestParam String query) {
        return ResponseEntity.ok(directorService.searchDirectors(query));
    }

    @GetMapping("/{id}/about")
    public ResponseEntity<Map<String, String>> getDirectorAbout(@PathVariable Long id) {
        DirectorResponse director = directorService.getDirectorById(id);
        Map<String, String> response = new HashMap<>();
        response.put("about", director.getAbout());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/picture")
    public ResponseEntity<Map<String, String>> getDirectorPicture(@PathVariable Long id) {
        DirectorResponse director = directorService.getDirectorById(id);
        Map<String, String> response = new HashMap<>();
        response.put("pictureUrl", director.getPictureUrl());
        return ResponseEntity.ok(response);
    }

    /**
     * Get all movies directed by a specific director
     */
    @GetMapping("/{id}/movies")
    public ResponseEntity<List<MovieResponse>> getDirectorMovies(@PathVariable Long id) {
        // The service now directly returns MovieResponse objects, so no conversion needed
        List<MovieResponse> movieResponses = directorService.getDirectorMovies(id);
        return ResponseEntity.ok(movieResponses);
    }
}