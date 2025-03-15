package com.moviestar.app.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.moviestar.app.controller.MovieController;
import com.moviestar.app.model.Requests.CommentLikeRequest;
import com.moviestar.app.model.Response.CommentResponse;
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

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
class CommentLikeIntegrationTest {

    @Mock
    private CommentService commentService;
    
    @Mock
    private MovieService movieService;
    
    @Mock
    private RatingService ratingService;
    
    @InjectMocks
    private MovieController movieController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();
    private CommentResponse testCommentResponse;

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
        
        testCommentResponse = CommentResponse.builder()
            .id(1L)
            .comment("Test comment for likes")
            .username("testuser")
            .movieId(1L)
            .createdAt(LocalDateTime.now())
            .updatedAt(null)
            .likesCount(0)
            .dislikesCount(0)
            .build();
    }

    @Test
    void likeComment() throws Exception {
        CommentLikeRequest request = new CommentLikeRequest(true);
        
        CommentResponse likedResponse = CommentResponse.builder()
            .id(1L)
            .comment(testCommentResponse.getComment())
            .username(testCommentResponse.getUsername())
            .movieId(testCommentResponse.getMovieId())
            .createdAt(testCommentResponse.getCreatedAt())
            .updatedAt(null)
            .likesCount(1)
            .dislikesCount(0)
            .build();

        when(commentService.likeComment(eq(1L), eq("testuser"), eq(true)))
                .thenReturn(likedResponse);

        mockMvc.perform(post("/api/movies/comments/1/like")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likesCount").value(1))
                .andExpect(jsonPath("$.dislikesCount").value(0));
    }

    @Test
    void dislikeComment() throws Exception {
        CommentLikeRequest request = new CommentLikeRequest(false);
        
        CommentResponse dislikedResponse = CommentResponse.builder()
            .id(1L)
            .comment(testCommentResponse.getComment())
            .username(testCommentResponse.getUsername())
            .movieId(testCommentResponse.getMovieId())
            .createdAt(testCommentResponse.getCreatedAt())
            .updatedAt(null)
            .likesCount(0)
            .dislikesCount(1)
            .build();

        when(commentService.likeComment(eq(1L), eq("testuser"), eq(false)))
                .thenReturn(dislikedResponse);
        
        mockMvc.perform(post("/api/movies/comments/1/like")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likesCount").value(0))
                .andExpect(jsonPath("$.dislikesCount").value(1));
    }

    @Test
    void changeFromLikeToDislike() throws Exception {
        CommentLikeRequest likeRequest = new CommentLikeRequest(true);
        CommentLikeRequest dislikeRequest = new CommentLikeRequest(false);
        
        CommentResponse likedResponse = CommentResponse.builder()
            .id(1L)
            .comment(testCommentResponse.getComment())
            .username(testCommentResponse.getUsername())
            .movieId(testCommentResponse.getMovieId())
            .createdAt(testCommentResponse.getCreatedAt())
            .updatedAt(null)
            .likesCount(1)
            .dislikesCount(0)
            .build();
            
        CommentResponse dislikedResponse = CommentResponse.builder()
            .id(1L)
            .comment(testCommentResponse.getComment())
            .username(testCommentResponse.getUsername())
            .movieId(testCommentResponse.getMovieId())
            .createdAt(testCommentResponse.getCreatedAt())
            .updatedAt(null)
            .likesCount(0)
            .dislikesCount(1)
            .build();

        when(commentService.likeComment(eq(1L), eq("testuser"), eq(true)))
                .thenReturn(likedResponse);
        when(commentService.likeComment(eq(1L), eq("testuser"), eq(false)))
                .thenReturn(dislikedResponse);

        mockMvc.perform(post("/api/movies/comments/1/like")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(likeRequest)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/movies/comments/1/like")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dislikeRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likesCount").value(0))
                .andExpect(jsonPath("$.dislikesCount").value(1));
    }

    @Test
    void removeLike() throws Exception {
        CommentResponse removedLikeResponse = CommentResponse.builder()
            .id(1L)
            .comment(testCommentResponse.getComment())
            .username(testCommentResponse.getUsername())
            .movieId(testCommentResponse.getMovieId())
            .createdAt(testCommentResponse.getCreatedAt())
            .updatedAt(null)
            .likesCount(0)
            .dislikesCount(0)
            .build();

        when(commentService.removeLike(eq(1L), eq("testuser")))
                .thenReturn(removedLikeResponse);

        mockMvc.perform(delete("/api/movies/comments/1/like"))
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
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.liked").value(true))
                .andExpect(jsonPath("$.disliked").value(false));
    }

    @Test
    void multipleUserLikes() throws Exception {
        CommentLikeRequest request = new CommentLikeRequest(false);
        
        CommentResponse finalResponse = CommentResponse.builder()
            .id(1L)
            .comment(testCommentResponse.getComment())
            .username(testCommentResponse.getUsername())
            .movieId(testCommentResponse.getMovieId())
            .createdAt(testCommentResponse.getCreatedAt())
            .updatedAt(null)
            .likesCount(2)
            .dislikesCount(1)
            .build();

        when(commentService.likeComment(eq(1L), eq("testuser"), eq(false)))
                .thenReturn(finalResponse);

        mockMvc.perform(post("/api/movies/comments/1/like")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likesCount").value(2))
                .andExpect(jsonPath("$.dislikesCount").value(1));
    }
}
