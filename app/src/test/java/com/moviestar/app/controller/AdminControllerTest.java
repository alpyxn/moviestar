package com.moviestar.app.controller;

import com.moviestar.app.service.ActorService;
import com.moviestar.app.service.DirectorService;
import com.moviestar.app.service.MovieService;
import com.moviestar.app.service.GenreService;
import com.moviestar.app.service.CommentService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
public class AdminControllerTest {

    @Mock
    private MovieService movieService;
    
    @Mock
    private ActorService actorService;
    
    @Mock
    private DirectorService directorService;
    
    @Mock
    private GenreService genreService;
    
    @Mock
    private CommentService commentService;
    
    @InjectMocks
    private AdminController adminController;
    
    private MockMvc mockMvc;
    
    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminController).build();
    }
    
    @Test
    void deleteComment() throws Exception {
        doNothing().when(commentService).deleteComment(1L);
        
        mockMvc.perform(delete("/api/admin/comments/1"))
               .andExpect(status().isNoContent());
               
        verify(commentService).deleteComment(1L);
    }
    
    @Test
    void deleteAllUserComments() throws Exception {
        String username = "testuser";
        doNothing().when(commentService).deleteAllUserComments(username);
        
        mockMvc.perform(delete("/api/admin/users/" + username + "/comments"))
               .andExpect(status().isNoContent());
               
        verify(commentService).deleteAllUserComments(username);
    }
}