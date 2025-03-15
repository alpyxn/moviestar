package com.moviestar.app.integration;

import com.moviestar.app.controller.UserController;
import com.moviestar.app.model.Response.UserResponse;
import com.moviestar.app.model.UserDTO;
import com.moviestar.app.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@ExtendWith(MockitoExtension.class)
public class PublicEndpointsIntegrationTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private MockMvc setupMockMvc() {
        return MockMvcBuilders.standaloneSetup(userController).build();
    }

    @Test
    public void userProfile_ShouldBeAccessibleWithoutAuthentication() throws Exception {
        String username = "testuser";
        UserDTO userDTO = new UserDTO();
        userDTO.setId(1L);
        userDTO.setUsername(username);
        userDTO.setEmail("test@example.com");
        userDTO.setProfilePictureUrl("https://example.com/pic.jpg");
        userDTO.setStatus(UserDTO.UserStatus.ACTIVE);
        userDTO.setCreatedAt(LocalDateTime.now());
        
        UserResponse userResponse = UserResponse.builder()
            .username(username)
            .email("test@example.com")
            .profilePictureUrl("https://example.com/pic.jpg")
            .status("ACTIVE")
            .build();

        when(userService.getUserByUsername(username)).thenReturn(Optional.of(userDTO));
        when(userService.convertToResponse(userDTO)).thenReturn(userResponse);

        MockMvc mockMvc = setupMockMvc();
        
        mockMvc.perform(get("/api/users/{username}", username)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(jsonPath("$.username").value(username))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.profilePictureUrl").value("https://example.com/pic.jpg"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }
    
    @Test
    public void nonExistentUser_ShouldReturn404() throws Exception {
        String username = "nonexistentuser";
        when(userService.getUserByUsername(username)).thenReturn(Optional.empty());

        MockMvc mockMvc = setupMockMvc();
        
        mockMvc.perform(get("/api/users/{username}", username)
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }
}
