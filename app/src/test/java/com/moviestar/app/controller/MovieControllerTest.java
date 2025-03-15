package com.moviestar.app.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.moviestar.app.model.GenreDTO;
import com.moviestar.app.model.MovieDTO;
import com.moviestar.app.model.Requests.CommentLikeRequest;
import com.moviestar.app.model.Response.CommentResponse;
import com.moviestar.app.model.Response.GenreResponse;
import com.moviestar.app.model.Response.MovieResponse;
import com.moviestar.app.service.CommentService;
import com.moviestar.app.service.MovieService;
import com.moviestar.app.service.RatingService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class MovieControllerTest {

    @Mock
    private MovieService movieService;

    @Mock
    private CommentService commentService;

    @Mock
    private RatingService ratingService;

    @InjectMocks
    private MovieController movieController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();
    
    private static class TestJwtArgumentResolver implements HandlerMethodArgumentResolver {
        private final String username;

        public TestJwtArgumentResolver(String username) {
            this.username = username;
        }

        @Override
        public boolean supportsParameter(MethodParameter parameter) {
            return parameter.hasParameterAnnotation(AuthenticationPrincipal.class) &&
                   parameter.getParameterType().equals(Jwt.class);
        }

        @Override
        public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                                     NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
            Jwt jwt = mock(Jwt.class);
            lenient().when(jwt.getSubject()).thenReturn(username);
            lenient().when(jwt.getClaimAsString("preferred_username")).thenReturn(username);
            return jwt;
        }
    }

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(movieController)
            .setCustomArgumentResolvers(new TestJwtArgumentResolver("testuser"))
            .build();
    }

    @Test
    void getMovies() throws Exception {
        List<GenreDTO> genreDTOs = Arrays.asList(
                new GenreDTO(1L, "Action"),
                new GenreDTO(2L, "Sci-Fi"));

        MovieDTO movieDTO = new MovieDTO();
        movieDTO.setId(1L);
        movieDTO.setTitle("The Matrix");
        movieDTO.setDescription("A sci-fi classic");
        movieDTO.setYear(1999);
        movieDTO.setGenres(genreDTOs);
        movieDTO.setActors(new ArrayList<>());
        movieDTO.setDirectors(new ArrayList<>());
        movieDTO.setPosterURL("poster.jpg");
        movieDTO.setBackdropURL("backdrop.jpg");

        List<GenreResponse> genreResponses = Arrays.asList(
                new GenreResponse(1L, "Action"),
                new GenreResponse(2L, "Sci-Fi"));

        MovieResponse response = MovieResponse.builder()
                .id(1L)
                .title("The Matrix")
                .description("A sci-fi classic")
                .year(1999)
                .genres(genreResponses)
                .actors(Collections.emptyList())
                .posterURL("poster.jpg")
                .backdropURL("backdrop.jpg")
                .averageRating(8.5)
                .totalRatings(42)
                .build();

        when(movieService.getAllMovies()).thenReturn(Collections.singletonList(movieDTO));
        when(movieService.convertToResponse(any(MovieDTO.class))).thenReturn(response);

        mockMvc.perform(get("/api/movies")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].title").value("The Matrix"))
                .andExpect(jsonPath("$[0].year").value(1999))
                .andExpect(jsonPath("$[0].genres[0].genre").value("Action"))
                .andExpect(jsonPath("$[0].genres[1].genre").value("Sci-Fi"));
    }

    @Test
    void getMovieById() throws Exception {
        List<GenreDTO> genreDTOs = Arrays.asList(
                new GenreDTO(1L, "Action"),
                new GenreDTO(2L, "Sci-Fi"));

        MovieDTO movieDTO = new MovieDTO();
        movieDTO.setId(1L);
        movieDTO.setTitle("The Matrix");
        movieDTO.setDescription("A sci-fi classic");
        movieDTO.setYear(1999);
        movieDTO.setGenres(genreDTOs);
        movieDTO.setActors(new ArrayList<>());
        movieDTO.setDirectors(new ArrayList<>());
        movieDTO.setPosterURL("poster.jpg");
        movieDTO.setBackdropURL("backdrop.jpg");

        List<GenreResponse> genreResponses = Arrays.asList(
                new GenreResponse(1L, "Action"),
                new GenreResponse(2L, "Sci-Fi"));

        MovieResponse response = MovieResponse.builder()
                .id(1L)
                .title("The Matrix")
                .description("A sci-fi classic")
                .year(1999)
                .genres(genreResponses)
                .actors(Collections.emptyList())
                .posterURL("poster.jpg")
                .backdropURL("backdrop.jpg")
                .averageRating(8.5)
                .totalRatings(42)
                .build();

        when(movieService.getMovieById(anyLong())).thenReturn(movieDTO);
        when(movieService.convertToResponse(any(MovieDTO.class))).thenReturn(response);

        mockMvc.perform(get("/api/movies/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.title").value("The Matrix"))
                .andExpect(jsonPath("$.genres[0].genre").value("Action"))
                .andExpect(jsonPath("$.genres[1].genre").value("Sci-Fi"));
    }

    @Test
    void searchMoviesByTitle() throws Exception {
        List<GenreDTO> genreDTOs = Arrays.asList(
                new GenreDTO(1L, "Action"),
                new GenreDTO(2L, "Sci-Fi"));

        MovieDTO movieDTO = new MovieDTO();
        movieDTO.setId(1L);
        movieDTO.setTitle("The Matrix");
        movieDTO.setDescription("A sci-fi classic");
        movieDTO.setYear(1999);
        movieDTO.setGenres(genreDTOs);
        movieDTO.setActors(new ArrayList<>());
        movieDTO.setDirectors(new ArrayList<>());
        movieDTO.setPosterURL("poster.jpg");
        movieDTO.setBackdropURL("backdrop.jpg");

        List<GenreResponse> genreResponses = Arrays.asList(
                new GenreResponse(1L, "Action"),
                new GenreResponse(2L, "Sci-Fi"));

        MovieResponse response = MovieResponse.builder()
                .id(1L)
                .title("The Matrix")
                .description("A sci-fi classic")
                .year(1999)
                .genres(genreResponses)
                .actors(Collections.emptyList())
                .posterURL("poster.jpg")
                .backdropURL("backdrop.jpg")
                .averageRating(8.5)
                .totalRatings(42)
                .build();

        when(movieService.getMoviesByTitle(anyString())).thenReturn(Collections.singletonList(movieDTO));
        when(movieService.convertToResponse(any(MovieDTO.class))).thenReturn(response);

        mockMvc.perform(get("/api/movies/search?title=Matrix")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].title").value("The Matrix"))
                .andExpect(jsonPath("$[0].genres[0].genre").value("Action"))
                .andExpect(jsonPath("$[0].genres[1].genre").value("Sci-Fi"));
    }

    @Test
    void getMovieComments() throws Exception {
        CommentResponse commentResponse = CommentResponse.builder()
                .id(1L)
                .comment("Great movie!")
                .username("user1")
                .createdAt(LocalDateTime.now())
                .updatedAt(null)
                .movieId(1L)
                .likesCount(0)
                .dislikesCount(0)
                .build();

        when(commentService.getCommentsByMovieIdSorted(anyLong(), eq("newest")))
                .thenReturn(Collections.singletonList(commentResponse));

        mockMvc.perform(get("/api/movies/1/comments")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].comment").value("Great movie!"));
                
        verify(commentService).getCommentsByMovieIdSorted(1L, "newest");
    }

    @Test
    void getMovieRating() throws Exception {
        when(ratingService.getAverageRatingForMovie(anyLong())).thenReturn(8.5);

        mockMvc.perform(get("/api/movies/1/ratings")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").value(8.5));
    }

    @Test
    void dislikeComment() throws Exception {
        CommentLikeRequest request = new CommentLikeRequest(false);
        
        CommentResponse response = CommentResponse.builder()
                .id(1L)
                .comment("Great movie!")
                .username("user1")
                .createdAt(LocalDateTime.now())
                .updatedAt(null)
                .movieId(1L)
                .likesCount(0)
                .dislikesCount(1)
                .build();
        
        when(commentService.likeComment(eq(1L), eq("testuser"), eq(false)))
                .thenReturn(response);
        
        mockMvc.perform(post("/api/movies/comments/1/like")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likesCount").value(0))
                .andExpect(jsonPath("$.dislikesCount").value(1));
    }
    
    @Test
    void removeCommentLike() throws Exception {
        CommentResponse response = CommentResponse.builder()
                .id(1L)
                .comment("Great movie!")
                .username("user1")
                .createdAt(LocalDateTime.now())
                .updatedAt(null)
                .movieId(1L)
                .likesCount(0)
                .dislikesCount(0)
                .build();
        
        when(commentService.removeLike(eq(1L), eq("testuser")))
                .thenReturn(response);
        
        mockMvc.perform(delete("/api/movies/comments/1/like"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likesCount").value(0))
                .andExpect(jsonPath("$.dislikesCount").value(0));
    }
    
    @Test
    void getLikeStatus() throws Exception {
        when(commentService.hasUserLiked(eq(1L), eq("testuser")))
                .thenReturn(true);
        when(commentService.hasUserDisliked(eq(1L), eq("testuser")))
                .thenReturn(false);
        
        mockMvc.perform(get("/api/movies/comments/1/like/status"))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liked").value(true))
                .andExpect(jsonPath("$.disliked").value(false));
    }

    @Test
    void likeComment() throws Exception {
        CommentLikeRequest request = new CommentLikeRequest(true);
        
        CommentResponse response = CommentResponse.builder()
                .id(1L)
                .comment("Great movie!")
                .username("user1")
                .createdAt(LocalDateTime.now())
                .updatedAt(null)
                .movieId(1L)
                .likesCount(1)
                .dislikesCount(0)
                .build();
        
        when(commentService.likeComment(eq(1L), eq("testuser"), eq(true)))
                .thenReturn(response);
        
        mockMvc.perform(post("/api/movies/comments/1/like")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likesCount").value(1))
                .andExpect(jsonPath("$.dislikesCount").value(0));
    }

    @Test
    void getMovieCommentsSorted() throws Exception {
        CommentResponse comment1 = CommentResponse.builder()
                .id(1L)
                .comment("Most liked comment")
                .username("user1")
                .createdAt(LocalDateTime.now())
                .updatedAt(null)
                .movieId(1L)
                .likesCount(10)
                .dislikesCount(1)
                .build();
        
        CommentResponse comment2 = CommentResponse.builder()
                .id(2L)
                .comment("Less liked comment")
                .username("user2")
                .createdAt(LocalDateTime.now())
                .updatedAt(null)
                .movieId(1L)
                .likesCount(5)
                .dislikesCount(2)
                .build();

        when(commentService.getCommentsByMovieIdSorted(anyLong(), eq("likes")))
                .thenReturn(Arrays.asList(comment1, comment2));

        mockMvc.perform(get("/api/movies/1/comments?sortBy=likes")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].comment").value("Most liked comment"))
                .andExpect(jsonPath("$[1].comment").value("Less liked comment"));
                
        verify(commentService).getCommentsByMovieIdSorted(1L, "likes");
    }

    @Test
    void getRandomizedMovies() throws Exception {
        List<GenreDTO> genreDTOs = Arrays.asList(
                new GenreDTO(1L, "Action"),
                new GenreDTO(2L, "Sci-Fi"));

        MovieDTO movieDTO = new MovieDTO();
        movieDTO.setId(1L);
        movieDTO.setTitle("The Matrix");
        movieDTO.setDescription("A sci-fi classic");
        movieDTO.setYear(1999);
        movieDTO.setGenres(genreDTOs);
        movieDTO.setActors(new ArrayList<>());
        movieDTO.setDirectors(new ArrayList<>());
        movieDTO.setPosterURL("poster.jpg");
        movieDTO.setBackdropURL("backdrop.jpg");

        MovieResponse response = MovieResponse.builder()
                .id(1L)
                .title("The Matrix")
                .description("A sci-fi classic")
                .year(1999)
                .genres(Collections.emptyList())
                .actors(Collections.emptyList())
                .posterURL("poster.jpg")
                .backdropURL("backdrop.jpg")
                .averageRating(8.5)
                .totalRatings(42)
                .build();

        when(movieService.getRandomizedMovies()).thenReturn(Collections.singletonList(movieDTO));
        when(movieService.convertToResponse(any(MovieDTO.class))).thenReturn(response);

        mockMvc.perform(get("/api/movies/random")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].title").value("The Matrix"));
    }
}