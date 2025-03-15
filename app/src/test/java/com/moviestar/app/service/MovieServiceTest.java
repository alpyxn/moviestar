package com.moviestar.app.service;

import com.moviestar.app.exception.EntityNotFoundException;
import com.moviestar.app.model.ActorDTO;
import com.moviestar.app.model.GenreDTO;
import com.moviestar.app.model.MovieDTO;
import com.moviestar.app.model.Requests.MovieRequest;
import com.moviestar.app.model.Response.MovieResponse;
import com.moviestar.app.repository.ActorRepository;
import com.moviestar.app.repository.GenreRepository;
import com.moviestar.app.repository.MovieRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MovieServiceTest {

    @Mock
    private MovieRepository movieRepository;

    @Mock
    private ActorRepository actorRepository;

    @Mock
    private GenreRepository genreRepository;

    @Mock
    private RatingService ratingService;

    @InjectMocks
    private MovieService movieService;

    @Test
    void getAllMovies() {
        List<MovieDTO> movies = Arrays.asList(
            createMovieDTO(1L, "Movie 1"),
            createMovieDTO(2L, "Movie 2")
        );
        when(movieRepository.findAll()).thenReturn(movies);

        List<MovieDTO> result = movieService.getAllMovies();

        assertEquals(2, result.size());
        assertEquals("Movie 1", result.get(0).getTitle());
        assertEquals("Movie 2", result.get(1).getTitle());
    }

    @Test
    void getMovieById_Success() {
        MovieDTO movie = createMovieDTO(1L, "Inception");
        when(movieRepository.findById(1L)).thenReturn(Optional.of(movie));

        MovieDTO result = movieService.getMovieById(1L);

        assertEquals("Inception", result.getTitle());
    }

    @Test
    void getMovieById_NotFound() {
        when(movieRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> movieService.getMovieById(1L));
    }

    @Test
    void createMovie_Success() {
        MovieRequest request = createMovieRequest();
        GenreDTO genre1 = new GenreDTO(1L, "Action");
        GenreDTO genre2 = new GenreDTO(2L, "Thriller");
        ActorDTO actor = createTestActor(1L, "John", "Doe");

        List<Long> genreIds = Arrays.asList(1L, 2L);
        when(genreRepository.findAllById(genreIds))
                .thenReturn(Arrays.asList(genre1, genre2));
        when(actorRepository.findAllById(Collections.singletonList(1L)))
                .thenReturn(Collections.singletonList(actor));
        when(movieRepository.save(any(MovieDTO.class)))
                .thenAnswer(invocation -> {
                    MovieDTO savedMovie = invocation.getArgument(0);
                    savedMovie.setId(1L);
                    return savedMovie;
                });

        MovieDTO result = movieService.createMovie(request);

        assertEquals("Test Movie", result.getTitle());
        assertEquals(2, result.getGenres().size());
        assertEquals("Action", result.getGenres().get(0).getGenre());
        assertEquals("Thriller", result.getGenres().get(1).getGenre());
        assertEquals(1, result.getActors().size());
    }

    @Test
    void convertToResponse() {
        MovieDTO movie = createMovieDTO(1L, "Inception");
        when(ratingService.getAverageRatingForMovie(1L)).thenReturn(8.5);
        when(ratingService.getRatingCountForMovie(1L)).thenReturn(100L);

        MovieResponse response = movieService.convertToResponse(movie);

        assertEquals(1L, response.getId());
        assertEquals("Inception", response.getTitle());
        assertEquals(2, response.getGenres().size());
        assertEquals("Action", response.getGenres().get(0).getGenre());
        assertEquals(8.5, response.getAverageRating());
        assertEquals(100, response.getTotalRatings());
    }

    @Test
    void getMoviesByTitle() {
        List<MovieDTO> movies = Collections.singletonList(createMovieDTO(1L, "Inception"));
        when(movieRepository.findByTitle("Inception")).thenReturn(movies);

        List<MovieDTO> result = movieService.getMoviesByTitle("Inception");

        assertEquals(1, result.size());
        assertEquals("Inception", result.get(0).getTitle());
    }

    @Test
    void updateMovie_Success() {
        MovieRequest request = createMovieRequest();
        Long movieId = 1L;

        MovieDTO existingMovie = createMovieDTO(movieId, "Old Title");
        GenreDTO genre1 = new GenreDTO(1L, "Action");
        GenreDTO genre2 = new GenreDTO(2L, "Thriller");
        ActorDTO actor = createTestActor(1L, "John", "Doe");

        when(movieRepository.findById(movieId)).thenReturn(Optional.of(existingMovie));
        when(genreRepository.findAllById(Arrays.asList(1L, 2L)))
                .thenReturn(Arrays.asList(genre1, genre2));
        when(actorRepository.findAllById(Collections.singletonList(1L)))
                .thenReturn(Collections.singletonList(actor));
        when(movieRepository.save(any(MovieDTO.class))).thenReturn(existingMovie);

        MovieDTO result = movieService.updateMovie(movieId, request);

        assertEquals("Test Movie", result.getTitle());
        assertEquals(1L, result.getId());
        assertEquals(2, result.getGenres().size());
        assertEquals("Action", result.getGenres().get(0).getGenre());
    }

    @Test
    void deleteMovie_Success() {
        Long movieId = 1L;
        when(movieRepository.existsById(movieId)).thenReturn(true);
        doNothing().when(movieRepository).deleteById(movieId);

        assertDoesNotThrow(() -> movieService.deleteMovie(movieId));
        verify(movieRepository).deleteById(movieId);
    }

    @Test
    void getMoviesByActor() {
        String actorName = "DiCaprio";
        List<MovieDTO> movies = Collections.singletonList(createMovieDTO(1L, "Inception"));
        when(movieRepository.findByActor(actorName)).thenReturn(movies);

        List<MovieDTO> result = movieService.getMoviesByActor(actorName);

        assertEquals(1, result.size());
        assertEquals("Inception", result.get(0).getTitle());
    }

    @Test
    void getMoviesByGenre() {
        String genre = "Action";
        List<MovieDTO> movies = Arrays.asList(
                createMovieDTO(1L, "Die Hard"),
                createMovieDTO(2L, "John Wick")
        );
        when(movieRepository.findByGenresGenre(genre)).thenReturn(movies);

        List<MovieDTO> result = movieService.getMoviesByGenre(genre);

        assertEquals(2, result.size());
        assertEquals("Die Hard", result.get(0).getTitle());
        assertEquals("John Wick", result.get(1).getTitle());
    }

    @Test
    void createMovie_InvalidGenre() {
        MovieRequest request = createMovieRequest();
        when(genreRepository.findAllById(any())).thenReturn(Collections.singletonList(new GenreDTO()));

        EntityNotFoundException exception = assertThrows(
                EntityNotFoundException.class,
                () -> movieService.createMovie(request)
        );
        assertTrue(exception.getMessage().contains("One or more genres not found"));
    }

    @Test
    void getRandomizedMovies() {
        List<MovieDTO> movies = Arrays.asList(
            createMovieDTO(1L, "Movie 1"),
            createMovieDTO(2L, "Movie 2")
        );
        when(movieRepository.findAllRandomized()).thenReturn(movies);

        List<MovieDTO> result = movieService.getRandomizedMovies();

        assertEquals(2, result.size());
        verify(movieRepository).findAllRandomized();
    }

    private MovieDTO createMovieDTO(Long id, String title) {
        GenreDTO genre1 = new GenreDTO(1L, "Action");
        GenreDTO genre2 = new GenreDTO(2L, "Thriller");
        
        MovieDTO movie = new MovieDTO();
        movie.setId(id);
        movie.setTitle(title);
        movie.setDescription("Description");
        movie.setYear(2020);
        
        List<GenreDTO> genres = new ArrayList<>();
        genres.add(genre1);
        genres.add(genre2);
        movie.setGenres(genres);
        
        movie.setActors(new ArrayList<>());
        movie.setDirectors(new ArrayList<>());
        movie.setPosterURL("poster.jpg");
        movie.setBackdropURL("backdrop.jpg");
        return movie;
    }

    private MovieRequest createMovieRequest() {
        MovieRequest request = new MovieRequest();
        request.setTitle("Test Movie");
        request.setDescription("Description");
        request.setYear(2020);
        
        request.setGenreIds(Arrays.asList(1L, 2L));
        
        request.setActorIds(Collections.singletonList(1L));
        request.setPosterURL("poster.jpg");
        request.setBackdropURL("backdrop.jpg");
        return request;
    }

    private ActorDTO createTestActor(long id, String name, String surname) {
        ActorDTO actor = new ActorDTO();
        actor.setId(id);
        actor.setName(name);
        actor.setSurname(surname);
        actor.setMovies(new ArrayList<>());
        return actor;
    }

  
}