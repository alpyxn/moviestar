package com.moviestar.app.controller;

import com.moviestar.app.model.MovieDTO;
import com.moviestar.app.model.Requests.ActorAboutRequest;
import com.moviestar.app.model.Requests.ActorPictureRequest;
import com.moviestar.app.model.Requests.ActorRequest;
import com.moviestar.app.model.Requests.DirectorAboutRequest;
import com.moviestar.app.model.Requests.DirectorPictureRequest;
import com.moviestar.app.model.Requests.DirectorRequest;
import com.moviestar.app.model.Requests.MovieRequest;
import com.moviestar.app.model.Requests.GenreRequest;
import com.moviestar.app.model.Response.ActorResponse;
import com.moviestar.app.model.Response.DirectorResponse;
import com.moviestar.app.model.Response.GenreResponse;
import com.moviestar.app.model.Response.MovieResponse;
import com.moviestar.app.service.ActorService;
import com.moviestar.app.service.DirectorService;
import com.moviestar.app.service.MovieService;
import com.moviestar.app.service.GenreService;
import com.moviestar.app.service.CommentService;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
@AllArgsConstructor
public class AdminController {
    private final MovieService movieService;
    private final ActorService actorService;
    private final DirectorService directorService;
    private final GenreService genreService;
    private final CommentService commentService;

    @PostMapping("/movies")
    public ResponseEntity<MovieResponse> createMovie(@Valid @RequestBody MovieRequest request) {
        MovieDTO movie = movieService.createMovie(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(movieService.convertToResponse(movie));
    }

    @PutMapping("/movies/{id}")
    public ResponseEntity<MovieResponse> updateMovie(
            @PathVariable Long id,
            @Valid @RequestBody MovieRequest request) {
        MovieDTO movie = movieService.updateMovie(id, request);
        return ResponseEntity.ok(movieService.convertToResponse(movie));
    }

    @DeleteMapping("/movies/{id}")
    public ResponseEntity<Void> deleteMovie(@PathVariable Long id) {
        movieService.deleteMovie(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/actors")
    public ResponseEntity<ActorResponse> createActor(@Valid @RequestBody ActorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(actorService.createActor(request));
    }

    @PutMapping("/actors/{id}")
    public ResponseEntity<ActorResponse> updateActor(
            @PathVariable Long id,
            @Valid @RequestBody ActorRequest request) {
        return ResponseEntity.ok(actorService.updateActor(id, request));
    }

    @DeleteMapping("/actors/{id}")
    public ResponseEntity<Void> deleteActor(@PathVariable Long id) {
        actorService.deleteActor(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/actors/{id}/about")
    public ResponseEntity<ActorResponse> updateActorAbout(
            @PathVariable Long id,
            @Valid @RequestBody ActorAboutRequest request) {
        
        ActorRequest actorRequest = new ActorRequest();
        ActorResponse currentActor = actorService.getActorById(id);
        
        actorRequest.setName(currentActor.getName());
        actorRequest.setSurname(currentActor.getSurname());
        actorRequest.setBirthDay(currentActor.getBirthDay());
        actorRequest.setPictureUrl(currentActor.getPictureUrl());
        actorRequest.setMovieIds(currentActor.getMovieIds());
        
        actorRequest.setAbout(request.getAbout());
        
        return ResponseEntity.ok(actorService.updateActor(id, actorRequest));
    }

    @PutMapping("/actors/{id}/picture")
    public ResponseEntity<ActorResponse> updateActorPicture(
            @PathVariable Long id,
            @Valid @RequestBody ActorPictureRequest request) {
        
        ActorRequest actorRequest = new ActorRequest();
        ActorResponse currentActor = actorService.getActorById(id);
        
        actorRequest.setName(currentActor.getName());
        actorRequest.setSurname(currentActor.getSurname());
        actorRequest.setBirthDay(currentActor.getBirthDay());
        actorRequest.setAbout(currentActor.getAbout());
        actorRequest.setMovieIds(currentActor.getMovieIds());
        
        actorRequest.setPictureUrl(request.getPictureUrl());
        
        return ResponseEntity.ok(actorService.updateActor(id, actorRequest));
    }

    @PostMapping("/directors")
    public ResponseEntity<DirectorResponse> createDirector(@Valid @RequestBody DirectorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(directorService.createDirector(request));
    }

    @PutMapping("/directors/{id}")
    public ResponseEntity<DirectorResponse> updateDirector(
            @PathVariable Long id,
            @Valid @RequestBody DirectorRequest request) {
        return ResponseEntity.ok(directorService.updateDirector(id, request));
    }

    @DeleteMapping("/directors/{id}")
    public ResponseEntity<Void> deleteDirector(@PathVariable Long id) {
        directorService.deleteDirector(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/directors/{id}/about")
    public ResponseEntity<DirectorResponse> updateDirectorAbout(
            @PathVariable Long id,
            @Valid @RequestBody DirectorAboutRequest request) {
        
        DirectorRequest directorRequest = new DirectorRequest();
        DirectorResponse currentDirector = directorService.getDirectorById(id);
        
        directorRequest.setName(currentDirector.getName());
        directorRequest.setSurname(currentDirector.getSurname());
        directorRequest.setBirthDay(currentDirector.getBirthDay());
        directorRequest.setPictureUrl(currentDirector.getPictureUrl());
        directorRequest.setMovieIds(currentDirector.getMovieIds());
        
        directorRequest.setAbout(request.getAbout());
        
        return ResponseEntity.ok(directorService.updateDirector(id, directorRequest));
    }

    @PutMapping("/directors/{id}/picture")
    public ResponseEntity<DirectorResponse> updateDirectorPicture(
            @PathVariable Long id,
            @Valid @RequestBody DirectorPictureRequest request) {
        
        DirectorRequest directorRequest = new DirectorRequest();
        DirectorResponse currentDirector = directorService.getDirectorById(id);
        
        directorRequest.setName(currentDirector.getName());
        directorRequest.setSurname(currentDirector.getSurname());
        directorRequest.setBirthDay(currentDirector.getBirthDay());
        directorRequest.setAbout(currentDirector.getAbout());
        directorRequest.setMovieIds(currentDirector.getMovieIds());
        
        directorRequest.setPictureUrl(request.getPictureUrl());
        
        return ResponseEntity.ok(directorService.updateDirector(id, directorRequest));
    }

    @GetMapping("/genres")
    public ResponseEntity<List<GenreResponse>> getAllGenres() {
        return ResponseEntity.ok(genreService.getAllGenres());
    }

    @PostMapping("/genres")
    public ResponseEntity<GenreResponse> createGenre(@Valid @RequestBody GenreRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(genreService.createGenre(request));
    }

    @PutMapping("/genres/{id}")
    public ResponseEntity<GenreResponse> updateGenre(
            @PathVariable Long id,
            @Valid @RequestBody GenreRequest request) {
        return ResponseEntity.ok(genreService.updateGenre(id, request));
    }

    @DeleteMapping("/genres/{id}")
    public ResponseEntity<Void> deleteGenre(@PathVariable Long id) {
        genreService.deleteGenre(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/actors")
    public ResponseEntity<List<ActorResponse>> getAllActors() {
        return ResponseEntity.ok(actorService.getAllActors());
    }

    @GetMapping("/directors")
    public ResponseEntity<List<DirectorResponse>> getAllDirectors() {
        return ResponseEntity.ok(directorService.getAllDirectors());
    }

    @PostMapping("/movies/{movieId}/directors/{directorId}")
    public ResponseEntity<MovieResponse> addDirectorToMovie(
            @PathVariable Long movieId,
            @PathVariable Long directorId) {
        MovieDTO movie = movieService.addDirectorToMovie(movieId, directorId);
        return ResponseEntity.ok(movieService.convertToResponse(movie));
    }

    @DeleteMapping("/movies/{movieId}/directors/{directorId}")
    public ResponseEntity<MovieResponse> removeDirectorFromMovie(
            @PathVariable Long movieId,
            @PathVariable Long directorId) {
        MovieDTO movie = movieService.removeDirectorFromMovie(movieId, directorId);
        return ResponseEntity.ok(movieService.convertToResponse(movie));
    }

    @DeleteMapping("/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(@PathVariable Long commentId) {
        commentService.deleteComment(commentId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/users/{username}/comments")
    public ResponseEntity<Void> deleteAllUserComments(@PathVariable String username) {
        commentService.deleteAllUserComments(username);
        return ResponseEntity.noContent().build();
    }
}