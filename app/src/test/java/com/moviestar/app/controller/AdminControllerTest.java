package com.moviestar.app.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.moviestar.app.model.GenreDTO;
import com.moviestar.app.model.MovieDTO;
import com.moviestar.app.model.Requests.MovieRequest;
import com.moviestar.app.model.Response.GenreResponse;
import com.moviestar.app.model.Response.MovieResponse;
import com.moviestar.app.service.ActorService;
import com.moviestar.app.service.DirectorService;
import com.moviestar.app.service.MovieService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class AdminControllerTest {

    @Mock
    private MovieService movieService;

    @Mock
    private ActorService actorService;

    @Mock
    private DirectorService directorService;

    @InjectMocks
    private AdminController adminController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminController).build();
        objectMapper = new ObjectMapper();
        objectMapper.setDateFormat(new SimpleDateFormat("yyyy-MM-dd"));
    }

    @Test
    void createMovie() throws Exception {
        MovieRequest movieRequest = new MovieRequest();
        movieRequest.setTitle("Inception");
        movieRequest.setDescription("A thief who steals corporate secrets");
        movieRequest.setYear(2010);
        movieRequest.setGenreIds(Arrays.asList(1L, 2L));
        movieRequest.setActorIds(Collections.singletonList(1L));
        movieRequest.setPosterURL("poster.jpg");
        movieRequest.setBackdropURL("backdrop.jpg");

        List<GenreDTO> genreDTOs = Arrays.asList(
                new GenreDTO(1L, "Sci-Fi"),
                new GenreDTO(2L, "Thriller")
        );
        
        MovieDTO movieDTO = new MovieDTO();
        movieDTO.setId(1L);
        movieDTO.setTitle("Inception");
        movieDTO.setDescription("A thief who steals corporate secrets");
        movieDTO.setYear(2010);
        movieDTO.setGenres(genreDTOs);
        movieDTO.setActors(new ArrayList<>());
        movieDTO.setDirectors(new ArrayList<>());
        movieDTO.setPosterURL("poster.jpg");
        movieDTO.setBackdropURL("backdrop.jpg");

        List<GenreResponse> genreResponses = Arrays.asList(
                new GenreResponse(1L, "Sci-Fi"),
                new GenreResponse(2L, "Thriller")
        );
        
        MovieResponse movieResponse = MovieResponse.builder()
                .id(1L)
                .title("Inception")
                .description("A thief who steals corporate secrets")
                .year(2010)
                .genres(genreResponses)
                .actors(Collections.emptyList())
                .posterURL("poster.jpg")
                .backdropURL("backdrop.jpg")
                .averageRating(8.0)
                .totalRatings(100)
                .build();

        when(movieService.createMovie(any(MovieRequest.class))).thenReturn(movieDTO);
        when(movieService.convertToResponse(any(MovieDTO.class))).thenReturn(movieResponse);

        mockMvc.perform(post("/api/admin/movies")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(movieRequest)))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Inception"))
                .andExpect(jsonPath("$.genres[0].genre").value("Sci-Fi"))
                .andExpect(jsonPath("$.genres[1].genre").value("Thriller"));
    }

    @Test
    void updateMovie() throws Exception {
        MovieRequest movieRequest = new MovieRequest();
        movieRequest.setTitle("Inception Updated");
        movieRequest.setDescription("Updated description");
        movieRequest.setYear(2010);
        movieRequest.setGenreIds(Arrays.asList(1L, 3L));
        movieRequest.setActorIds(Collections.singletonList(1L));
        movieRequest.setPosterURL("poster.jpg");
        movieRequest.setBackdropURL("backdrop.jpg");

        List<GenreDTO> genreDTOs = Arrays.asList(
                new GenreDTO(1L, "Sci-Fi"),
                new GenreDTO(3L, "Drama")
        );
        
        MovieDTO movieDTO = new MovieDTO();
        movieDTO.setId(1L);
        movieDTO.setTitle("Inception Updated");
        movieDTO.setDescription("Updated description");
        movieDTO.setYear(2010);
        movieDTO.setGenres(genreDTOs);
        movieDTO.setActors(new ArrayList<>());
        movieDTO.setDirectors(new ArrayList<>());
        movieDTO.setPosterURL("poster.jpg");
        movieDTO.setBackdropURL("backdrop.jpg");

        List<GenreResponse> genreResponses = Arrays.asList(
                new GenreResponse(1L, "Sci-Fi"),
                new GenreResponse(3L, "Drama")
        );
        
        MovieResponse movieResponse = MovieResponse.builder()
                .id(1L)
                .title("Inception Updated")
                .description("Updated description")
                .year(2010)
                .genres(genreResponses)
                .actors(Collections.emptyList())
                .posterURL("poster.jpg")
                .backdropURL("backdrop.jpg")
                .averageRating(8.0)
                .totalRatings((int) 100)
                .build();

        when(movieService.updateMovie(anyLong(), any(MovieRequest.class))).thenReturn(movieDTO);
        when(movieService.convertToResponse(any(MovieDTO.class))).thenReturn(movieResponse);

        mockMvc.perform(put("/api/admin/movies/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(movieRequest)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("Inception Updated"))
                .andExpect(jsonPath("$.genres[0].genre").value("Sci-Fi"))
                .andExpect(jsonPath("$.genres[1].genre").value("Drama"));
    }

    @Test
    void deleteMovie() throws Exception {
        doNothing().when(movieService).deleteMovie(anyLong());

        mockMvc.perform(delete("/api/admin/movies/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isNoContent());
    }

}