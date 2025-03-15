package com.moviestar.app.service;

import com.moviestar.app.model.DirectorDTO;
import com.moviestar.app.model.MovieDTO;
import com.moviestar.app.model.Requests.DirectorRequest;
import com.moviestar.app.model.Response.DirectorResponse;
import com.moviestar.app.model.Response.MovieResponse;
import com.moviestar.app.repository.DirectorRepository;
import com.moviestar.app.repository.MovieRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DirectorServiceTest {

    @Mock
    private DirectorRepository directorRepository;

    @Mock
    private MovieRepository movieRepository;

    @Mock
    private MovieService movieService;

    @InjectMocks
    private DirectorService directorService;

    @Test
    void getAllDirectors() {
        List<DirectorDTO> directors = Arrays.asList(
            createDirectorDTO(1L, "Christopher", "Nolan", "About Christopher", "http://example.com/nolan.jpg"),
            createDirectorDTO(2L, "Quentin", "Tarantino", "About Quentin", "http://example.com/tarantino.jpg")
        );
        when(directorRepository.findAll()).thenReturn(directors);

        List<DirectorResponse> result = directorService.getAllDirectors();

        assertEquals(2, result.size());
        assertEquals("Christopher", result.get(0).getName());
        assertEquals("Quentin", result.get(1).getName());
        assertEquals("About Christopher", result.get(0).getAbout());
        assertEquals("http://example.com/nolan.jpg", result.get(0).getPictureUrl());
    }

    @Test
    void getDirectorById_Success() {
        DirectorDTO director = createDirectorDTO(1L, "Christopher", "Nolan", "About Christopher", "http://example.com/nolan.jpg");
        when(directorRepository.findById(1L)).thenReturn(Optional.of(director));

        DirectorResponse result = directorService.getDirectorById(1L);

        assertEquals("Christopher", result.getName());
        assertEquals("Nolan", result.getSurname());
        assertEquals("About Christopher", result.getAbout());
        assertEquals("http://example.com/nolan.jpg", result.getPictureUrl());
    }

    @Test
    void getDirectorById_NotFound() {
        when(directorRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> directorService.getDirectorById(1L));
    }

    @Test
    void createDirector() {
        Date birthDay = new Date();
        DirectorRequest request = new DirectorRequest("Christopher", "Nolan", birthDay, "About Christopher", "http://example.com/nolan.jpg", new ArrayList<>());

        when(directorRepository.save(any(DirectorDTO.class))).thenAnswer(invocation -> {
            DirectorDTO savedDirector = invocation.getArgument(0);
            savedDirector.setId(1L);
            return savedDirector;
        });

        DirectorResponse result = directorService.createDirector(request);

        assertEquals("Christopher", result.getName());
        assertEquals("Nolan", result.getSurname());
        assertEquals(birthDay, result.getBirthDay());
        assertEquals("About Christopher", result.getAbout());
        assertEquals("http://example.com/nolan.jpg", result.getPictureUrl());
    }

    @Test
    void updateDirector() {
        Date birthDay = new Date();
        Long directorId = 1L;
        DirectorDTO existingDirector = createDirectorDTO(directorId, "Christopher", "Nolan", "Old About", "http://example.com/old.jpg");
        DirectorRequest updateRequest = new DirectorRequest(
            "Chris", "Nolan", birthDay, "Updated About", "http://example.com/new.jpg", Collections.singletonList(1L)
        );
        
        when(directorRepository.findById(directorId)).thenReturn(Optional.of(existingDirector));
        when(directorRepository.save(any(DirectorDTO.class))).thenAnswer(i -> i.getArgument(0));
        
        DirectorResponse result = directorService.updateDirector(directorId, updateRequest);
        
        assertEquals("Chris", result.getName());
        assertEquals("Nolan", result.getSurname());
        assertEquals("Updated About", result.getAbout());
        assertEquals("http://example.com/new.jpg", result.getPictureUrl());
        assertEquals(birthDay, result.getBirthDay());
    }

    @Test
    void updateDirector_NotFound() {
        Long directorId = 999L;
        DirectorRequest updateRequest = new DirectorRequest(
            "Chris", "Nolan", new Date(), "Updated About", "http://example.com/new.jpg", Collections.singletonList(1L)
        );
        
        when(directorRepository.findById(directorId)).thenReturn(Optional.empty());
        
        assertThrows(RuntimeException.class, () -> directorService.updateDirector(directorId, updateRequest));
    }

    @Test
    void updateDirectorAbout() {
        DirectorDTO director = createDirectorDTO(1L, "Christopher", "Nolan", "Old about", "http://example.com/nolan.jpg");
        when(directorRepository.findById(1L)).thenReturn(Optional.of(director));
        when(directorRepository.save(any(DirectorDTO.class))).thenReturn(director);

        DirectorResponse result = directorService.updateDirectorAbout(1L, "New about");

        assertEquals("New about", result.getAbout());
        assertEquals("Christopher", result.getName());
    }

    @Test
    void updateDirectorPicture() {
        DirectorDTO director = createDirectorDTO(1L, "Christopher", "Nolan", "About Christopher", "http://example.com/old.jpg");
        when(directorRepository.findById(1L)).thenReturn(Optional.of(director));
        when(directorRepository.save(any(DirectorDTO.class))).thenReturn(director);

        DirectorResponse result = directorService.updateDirectorPicture(1L, "http://example.com/new.jpg");

        assertEquals("http://example.com/new.jpg", result.getPictureUrl());
        assertEquals("Christopher", result.getName());
    }

    @Test
    void deleteDirector() {
        Long directorId = 1L;
        DirectorDTO director = createDirectorDTO(directorId, "Christopher", "Nolan", "About", "http://example.com/nolan.jpg");
        
        when(directorRepository.findById(directorId)).thenReturn(Optional.of(director));
        doNothing().when(directorRepository).deleteById(directorId);
        
        assertDoesNotThrow(() -> directorService.deleteDirector(directorId));
        
        // Update to verify deleteById instead of delete
        verify(directorRepository).deleteById(directorId);
    }

    @Test
    void deleteDirector_NotFound() {
        Long directorId = 999L;
        when(directorRepository.findById(directorId)).thenReturn(Optional.empty());
        
        assertThrows(RuntimeException.class, () -> directorService.deleteDirector(directorId));
        
        verify(directorRepository, never()).delete(any());
    }

    @Test
    void searchDirectors() {
        List<DirectorDTO> directors = Collections.singletonList(
            createDirectorDTO(1L, "Christopher", "Nolan", "About Christopher", "http://example.com/nolan.jpg")
        );
        when(directorRepository.findByNameContainingOrSurnameContaining("Nolan", "Nolan"))
                .thenReturn(directors);

        List<DirectorResponse> result = directorService.searchDirectors("Nolan");

        assertEquals(1, result.size());
        assertEquals("Christopher", result.get(0).getName());
        assertEquals("About Christopher", result.get(0).getAbout());
    }

    @Test
    void getDirectorMovies() {
        Long directorId = 1L;
        DirectorDTO director = createDirectorDTO(directorId, "Christopher", "Nolan", "About", "http://example.com/nolan.jpg");
        
        List<MovieDTO> movies = Arrays.asList(
            createMovieDTO(1L, "Inception"),
            createMovieDTO(2L, "The Dark Knight")
        );
        
        List<MovieResponse> movieResponses = Arrays.asList(
            createMovieResponse(1L, "Inception"),
            createMovieResponse(2L, "The Dark Knight")
        );
        
        when(directorRepository.findById(directorId)).thenReturn(Optional.of(director));
        
        director.setMovies(movies);
        
        when(movieService.convertToResponse(movies.get(0))).thenReturn(movieResponses.get(0));
        when(movieService.convertToResponse(movies.get(1))).thenReturn(movieResponses.get(1));
        
        List<MovieResponse> result = directorService.getDirectorMovies(directorId);
        
        assertEquals(2, result.size());
        assertEquals("Inception", result.get(0).getTitle());
        assertEquals("The Dark Knight", result.get(1).getTitle());
    }

    @Test
    void getDirectorMovies_DirectorNotFound() {
        Long directorId = 999L;
        when(directorRepository.findById(directorId)).thenReturn(Optional.empty());
        
        assertThrows(RuntimeException.class, () -> directorService.getDirectorMovies(directorId));
    }

    @Test
    void getDirectorMovies_NoMovies() {
        Long directorId = 1L;
        DirectorDTO director = createDirectorDTO(directorId, "Christopher", "Nolan", "About", "http://example.com/nolan.jpg");
        
        when(directorRepository.findById(directorId)).thenReturn(Optional.of(director));
        
        director.setMovies(Collections.emptyList());
        
        List<MovieResponse> result = directorService.getDirectorMovies(directorId);
        
        assertTrue(result.isEmpty());
    }

    private DirectorDTO createDirectorDTO(Long id, String name, String surname, String about, String pictureUrl) {
        DirectorDTO director = new DirectorDTO();
        director.setId(id);
        director.setName(name);
        director.setSurname(surname);
        director.setBirthDay(new Date());
        director.setAbout(about);
        director.setPictureUrl(pictureUrl);
        director.setMovies(new ArrayList<>());
        return director;
    }

    private MovieDTO createMovieDTO(Long id, String title) {
        MovieDTO movie = new MovieDTO();
        movie.setId(id);
        movie.setTitle(title);
        movie.setDescription("Description");
        movie.setYear(2020);
        movie.setGenres(new ArrayList<>());
        movie.setActors(new ArrayList<>());
        movie.setDirectors(new ArrayList<>());
        movie.setPosterURL("poster.jpg");
        movie.setBackdropURL("backdrop.jpg");
        return movie;
    }

    private MovieResponse createMovieResponse(Long id, String title) {
        return MovieResponse.builder()
            .id(id)
            .title(title)
            .description("Description")
            .year(2020)
            .genres(Collections.emptyList())
            .actors(Collections.emptyList())
            .directors(Collections.emptyList())
            .posterURL("poster.jpg")
            .backdropURL("backdrop.jpg")
            .averageRating(8.0)
            .totalRatings((int) 10)
            .build();
    }
}
