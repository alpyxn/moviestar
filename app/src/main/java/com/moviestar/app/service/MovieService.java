package com.moviestar.app.service;

import com.moviestar.app.exception.EntityNotFoundException;
import com.moviestar.app.model.ActorDTO;
import com.moviestar.app.model.GenreDTO;
import com.moviestar.app.model.MovieDTO;
import com.moviestar.app.model.DirectorDTO;
import com.moviestar.app.model.Requests.MovieRequest;
import com.moviestar.app.model.Response.ActorResponse;
import com.moviestar.app.model.Response.GenreResponse;
import com.moviestar.app.model.Response.MovieResponse;
import com.moviestar.app.model.Response.DirectorResponse;
import com.moviestar.app.repository.MovieRepository;
import com.moviestar.app.repository.ActorRepository;
import com.moviestar.app.repository.GenreRepository;
import com.moviestar.app.repository.DirectorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.ArrayList;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MovieService {

    private final MovieRepository movieRepository;
    private final ActorRepository actorRepository;
    private final GenreRepository genreRepository;
    private final RatingService ratingService;
    private final DirectorRepository directorRepository;

    @Cacheable(value = "movies")
    public List<MovieDTO> getAllMovies() {
        return movieRepository.findAll();
    }

    @Cacheable(value = "movies", key = "#id")
    public MovieDTO getMovieById(Long id) {
        return movieRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Movie not found with id: " + id));
    }

    @Transactional
    @CacheEvict(value = "movies", allEntries = true)
    public MovieDTO createMovie(MovieRequest request) {
        validateRequest(request);
        MovieDTO movie = new MovieDTO();
        updateMovieFromRequest(movie, request);
        return movieRepository.save(movie);
    }

    @Transactional
    @CacheEvict(value = "movies", allEntries = true)
    public MovieDTO updateMovie(Long id, MovieRequest request) {
        validateRequest(request);
        MovieDTO movie = movieRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Movie not found with id: " + id));
        updateMovieFromRequest(movie, request);
        return movieRepository.save(movie);
    }

    @Transactional
    @CacheEvict(value = "movies", allEntries = true)
    public void deleteMovie(Long id) {
        if (!movieRepository.existsById(id)) {
            throw new EntityNotFoundException("Movie not found with id: " + id);
        }
        movieRepository.deleteById(id);
    }

    @Cacheable(value = "moviesByTitle", key = "#title")
    public List<MovieDTO> getMoviesByTitle(String title) {
        return movieRepository.findByTitle(title);
    }

    @Cacheable(value = "moviesByActor", key = "#actor")
    public List<MovieDTO> getMoviesByActor(String actor) {
        return movieRepository.findByActor(actor);
    }

    @Cacheable(value = "moviesByGenre", key = "#genre")
    public List<MovieDTO> getMoviesByGenre(String genre) {
        return movieRepository.findByGenresGenre(genre);
    }

    public List<MovieDTO> getRandomizedMovies() {
        return movieRepository.findAllRandomized();
    }

    public MovieResponse convertToResponse(MovieDTO movieDTO) {
        List<ActorResponse> actors = movieDTO.getActors().stream()
                .map(this::convertActorToResponse)
                .collect(Collectors.toList());

        double averageRating = ratingService.getAverageRatingForMovie(movieDTO.getId());
        long ratingCount = ratingService.getRatingCountForMovie(movieDTO.getId());

        List<GenreResponse> genreResponses = movieDTO.getGenres().stream()
                .map(this::convertGenreToResponse)
                .collect(Collectors.toList());
                
        List<DirectorResponse> directors = movieDTO.getDirectors().stream()
                .map(this::convertDirectorToResponse)
                .collect(Collectors.toList());

        return MovieResponse.builder()
                .id(movieDTO.getId())
                .title(movieDTO.getTitle())
                .description(movieDTO.getDescription())
                .year(movieDTO.getYear())
                .genres(genreResponses)
                .actors(actors)
                .directors(directors) 
                .posterURL(movieDTO.getPosterURL())
                .backdropURL(movieDTO.getBackdropURL())
                .averageRating(averageRating)
                .totalRatings((int) ratingCount)
                .build();
    }

    private void validateRequest(MovieRequest request) {
        if (request.getGenreIds() == null || request.getGenreIds().isEmpty()) {
            throw new IllegalArgumentException("At least one genre must be selected");
        }
        
        List<GenreDTO> genres = genreRepository.findAllById(request.getGenreIds());
        if (genres.size() != request.getGenreIds().size()) {
            throw new EntityNotFoundException("One or more genres not found");
        }
        
        if (request.getActorIds() != null && !request.getActorIds().isEmpty()) {
            List<ActorDTO> actors = actorRepository.findAllById(request.getActorIds());
            if (actors.size() != request.getActorIds().size()) {
                throw new EntityNotFoundException("One or more actors not found");
            }
        }
        
       
    }

    private ActorResponse convertActorToResponse(ActorDTO actor) {
        List<Long> movieIds = actor.getMovies().stream()
                .map(MovieDTO::getId)
                .collect(Collectors.toList());

        return ActorResponse.builder()
                .id(actor.getId())
                .name(actor.getName())
                .surname(actor.getSurname())
                .birthDay(actor.getBirthDay())
                .movieIds(movieIds)
                .build();
    }

    private GenreResponse convertGenreToResponse(GenreDTO genre) {
        return GenreResponse.builder()
                .id(genre.getId())
                .genre(genre.getGenre())
                .build();
    }

    // Add a method to convert director DTOs to responses
    private DirectorResponse convertDirectorToResponse(DirectorDTO director) {
        List<Long> movieIds = director.getMovies().stream()
                .map(MovieDTO::getId)
                .collect(Collectors.toList());

        return DirectorResponse.builder()
                .id(director.getId())
                .name(director.getName())
                .surname(director.getSurname())
                .birthDay(director.getBirthDay())
                .about(director.getAbout())
                .pictureUrl(director.getPictureUrl())
                .movieIds(movieIds)
                .build();
    }

    private void updateMovieFromRequest(MovieDTO movie, MovieRequest request) {
        movie.setTitle(request.getTitle());
        movie.setDescription(request.getDescription());
        movie.setYear(request.getYear());

        List<GenreDTO> genres = genreRepository.findAllById(request.getGenreIds());
        if (genres.size() != request.getGenreIds().size()) {
            throw new EntityNotFoundException("One or more genres not found");
        }
        movie.setGenres(genres);

        if (request.getActorIds() != null && !request.getActorIds().isEmpty()) {
            List<ActorDTO> actors = actorRepository.findAllById(request.getActorIds());
            if (actors.size() != request.getActorIds().size()) {
                throw new EntityNotFoundException("One or more actors not found");
            }
            movie.setActors(actors);
        } else {
            movie.setActors(new ArrayList<>());
        }

        if (request.getDirectorIds() != null && !request.getDirectorIds().isEmpty()) {
            List<DirectorDTO> directors = directorRepository.findAllById(request.getDirectorIds());
            if (directors.size() != request.getDirectorIds().size()) {
                throw new EntityNotFoundException("One or more directors not found");
            }
            movie.setDirectors(directors);
        } else {
            movie.setDirectors(new ArrayList<>());
        }

        movie.setPosterURL(request.getPosterURL());
        movie.setBackdropURL(request.getBackdropURL());
    }

    @Transactional
    @CacheEvict(value = "movies", key = "#movieId")
    public MovieDTO addDirectorToMovie(Long movieId, Long directorId) {
        MovieDTO movie = getMovieById(movieId);
        DirectorDTO director = directorRepository.findById(directorId)
                .orElseThrow(() -> new EntityNotFoundException("Director not found with id: " + directorId));
        
        if (movie.getDirectors() == null) {
            movie.setDirectors(new ArrayList<>());
        }
        
        boolean directorExists = movie.getDirectors().stream()
                .anyMatch(d -> d.getId().equals(directorId));
        
        if (!directorExists) {
            movie.getDirectors().add(director);
            return movieRepository.save(movie);
        }
        
        return movie;
    }

    @Transactional
    @CacheEvict(value = "movies", key = "#movieId")
    public MovieDTO removeDirectorFromMovie(Long movieId, Long directorId) {
        MovieDTO movie = getMovieById(movieId);
        
        if (movie.getDirectors() != null) {
            movie.getDirectors().removeIf(director -> director.getId().equals(directorId));
            return movieRepository.save(movie);
        }
        
        return movie;
    }
}