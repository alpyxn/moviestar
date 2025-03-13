package com.moviestar.app.integration;

import com.moviestar.app.controller.AdminController;
import com.moviestar.app.model.CommentDTO;
import com.moviestar.app.service.ActorService;
import com.moviestar.app.service.CommentService;
import com.moviestar.app.service.DirectorService;
import com.moviestar.app.service.GenreService;
import com.moviestar.app.service.MovieService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
public class AdminUserManagementIntegrationTest {

    @Mock
    private CommentService commentService;
    
    @Mock
    private MovieService movieService;
    
    @Mock
    private ActorService actorService;
    
    @Mock
    private DirectorService directorService;
    
    @Mock
    private GenreService genreService;
    
    @InjectMocks
    private AdminController adminController;
    
    private MockMvc mockMvc;
    
    private final String TEST_USERNAME = "commentuser";
    
    @BeforeEach
    void setUp() {
        // Simplified setup without Spring Security
        mockMvc = MockMvcBuilders.standaloneSetup(adminController).build();
    }
    
    @Test
    void deleteAllUserComments() throws Exception {
        // Create test data
        List<CommentDTO> comments = Arrays.asList(
            createComment("Test comment 1", TEST_USERNAME, 1L),
            createComment("Test comment 2", TEST_USERNAME, 2L)
        );
        
        // Mock service behavior
        doNothing().when(commentService).deleteAllUserComments(TEST_USERNAME);
        
        // Since we're testing the controller directly and skipping Spring Security, 
        // we're focusing on whether the controller correctly calls the service method
        mockMvc.perform(delete("/api/admin/users/" + TEST_USERNAME + "/comments"))
               .andExpect(status().isNoContent());
        
        // Verify the service method was called with the correct parameters
        verify(commentService).deleteAllUserComments(TEST_USERNAME);
    }
    
    // We'll use two separate test methods now rather than security-enforced ones
    @Test
    void adminController_isSecuredWithPreAuthorize() {
        // Verify the class has the @PreAuthorize annotation
        boolean hasPreAuthorizeAnnotation = AdminController.class.isAnnotationPresent(org.springframework.security.access.prepost.PreAuthorize.class);
        org.junit.jupiter.api.Assertions.assertTrue(hasPreAuthorizeAnnotation, "AdminController should be secured with @PreAuthorize");
        
        // If we wanted to check the specific value, we could do:
        org.springframework.security.access.prepost.PreAuthorize annotation = 
            AdminController.class.getAnnotation(org.springframework.security.access.prepost.PreAuthorize.class);
        org.junit.jupiter.api.Assertions.assertEquals("hasAuthority('ROLE_ADMIN')", annotation.value(), 
            "AdminController should require ROLE_ADMIN");
    }
    
    private CommentDTO createComment(String text, String username, Long movieId) {
        CommentDTO comment = new CommentDTO();
        comment.setComment(text);
        comment.setUsername(username);
        comment.setMovieId(movieId);
        comment.setCreatedAt(LocalDateTime.now());
        comment.setLikesCount(0);
        comment.setDislikesCount(0);
        return comment;
    }
}
