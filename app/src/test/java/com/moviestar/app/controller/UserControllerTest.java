package com.moviestar.app.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.moviestar.app.model.UserDTO;
import com.moviestar.app.model.Response.UserResponse;
import com.moviestar.app.model.Requests.ProfilePictureRequest;
import com.moviestar.app.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;
import org.springframework.http.HttpStatus;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.HashMap;
import java.util.Map;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class UserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private UserController userController;

    private MockMvc mockMvc;
    private ObjectMapper objectMapper = new ObjectMapper();

    @ControllerAdvice
    public static class TestExceptionHandler {
        @ExceptionHandler(RuntimeException.class)
        @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
        public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException e) {
            Map<String, String> errorResponse = new HashMap<>();
            errorResponse.put("error", e.getMessage());
            return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

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
            when(jwt.getSubject()).thenReturn(username);
            return jwt;
        }
    }

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
            .setControllerAdvice(new TestExceptionHandler())
            .build();
    }

    @Test
    void getUserProfile() throws Exception {
        String username = "testuser";
        UserDTO user = createUserDTO(1L, username, "test@example.com", UserDTO.UserStatus.ACTIVE);
        UserResponse userResponse = createUserResponse(username, "test@example.com", "ACTIVE");
        
        when(userService.getUserByUsername(username)).thenReturn(Optional.of(user));
        when(userService.convertToResponse(user)).thenReturn(userResponse);

        mockMvc = MockMvcBuilders.standaloneSetup(userController)
            .setControllerAdvice(new TestExceptionHandler())
            .setCustomArgumentResolvers(new TestJwtArgumentResolver(username))
            .build();

        mockMvc.perform(get("/api/users/profile")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(username))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void getUserProfile_NotFound() throws Exception {
        String username = "nonexistent";
        when(userService.getUserByUsername(username)).thenReturn(Optional.empty());

        mockMvc = MockMvcBuilders.standaloneSetup(userController)
            .setControllerAdvice(new TestExceptionHandler())
            .setCustomArgumentResolvers(new TestJwtArgumentResolver(username))
            .build();

        mockMvc.perform(get("/api/users/profile")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("User profile not found"));
    }

    @Test
    void updateProfilePicture() throws Exception {
        String username = "testuser";
        String newPicture = "https://example.com/new.jpg";
        
        ProfilePictureRequest request = new ProfilePictureRequest();
        request.setProfilePictureUrl(newPicture);
        
        UserDTO updatedUser = createUserDTO(1L, username, "test@example.com", UserDTO.UserStatus.ACTIVE);
        updatedUser.setProfilePictureUrl(newPicture);
        
        UserResponse userResponse = createUserResponse(username, "test@example.com", "ACTIVE");
        userResponse.setProfilePictureUrl(newPicture);
        
        when(userService.updateProfilePicture(eq(username), eq(newPicture))).thenReturn(updatedUser);
        when(userService.convertToResponse(updatedUser)).thenReturn(userResponse);
        
        mockMvc = MockMvcBuilders.standaloneSetup(userController)
            .setControllerAdvice(new TestExceptionHandler())
            .setCustomArgumentResolvers(new TestJwtArgumentResolver(username))
            .build();

        mockMvc.perform(put("/api/users/profile/picture")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(username))
                .andExpect(jsonPath("$.profilePictureUrl").value(newPicture));
    }

    @Test
    void getUserByUsername_Found() throws Exception {
        String username = "testuser";
        UserDTO user = createUserDTO(1L, username, "test@example.com", UserDTO.UserStatus.ACTIVE);
        UserResponse userResponse = createUserResponse(username, "test@example.com", "ACTIVE");
        
        when(userService.getUserByUsername(username)).thenReturn(Optional.of(user));
        when(userService.convertToResponse(user)).thenReturn(userResponse);

        mockMvc.perform(get("/api/users/{username}", username)
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(username))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void getUserByUsername_NotFound() throws Exception {
        String username = "nonexistentuser";
        when(userService.getUserByUsername(username)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/users/{username}", username)
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isNotFound());
    }

    @Test
    void getUserByUsername_PublicAccess_Found() throws Exception {
        String username = "testuser";
        UserDTO user = createUserDTO(1L, username, "test@example.com", UserDTO.UserStatus.ACTIVE);
        UserResponse userResponse = createUserResponse(username, "test@example.com", "ACTIVE");
        
        when(userService.getUserByUsername(username)).thenReturn(Optional.of(user));
        when(userService.convertToResponse(user)).thenReturn(userResponse);

        mockMvc.perform(get("/api/users/{username}", username)
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(username))
                .andExpect(jsonPath("$.email").value("test@example.com"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void getUserByUsername_PublicAccess_NotFound() throws Exception {
        String username = "nonexistentuser";
        when(userService.getUserByUsername(username)).thenReturn(Optional.empty());

        mockMvc.perform(get("/api/users/{username}", username)
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isNotFound());
    }

    @Test
    void getUserByUsername_WithErrorHandling() throws Exception {
        String username = "problematicuser";
        when(userService.getUserByUsername(username)).thenThrow(new RuntimeException("Database connection error"));

        mockMvc.perform(get("/api/users/{username}", username)
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isInternalServerError());
    }

    @Test
    void getUserByUsernameEndpoint_ShouldBeAccessibleWithoutAuth() throws Exception {
        
        String username = "publicuser";
        UserDTO user = createUserDTO(1L, username, "public@example.com", UserDTO.UserStatus.ACTIVE);
        UserResponse userResponse = createUserResponse(username, "public@example.com", "ACTIVE");
        
        when(userService.getUserByUsername(username)).thenReturn(Optional.of(user));
        when(userService.convertToResponse(user)).thenReturn(userResponse);

        mockMvc.perform(get("/api/users/{username}", username)
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(username))
                .andExpect(jsonPath("$.email").value("public@example.com"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    private UserDTO createUserDTO(Long id, String username, String email, UserDTO.UserStatus status) {
        UserDTO user = new UserDTO();
        user.setId(id);
        user.setUsername(username);
        user.setEmail(email);
        user.setProfilePictureUrl("https://example.com/default.jpg");
        user.setStatus(status);
        user.setCreatedAt(LocalDateTime.now());
        user.setLastLogin(LocalDateTime.now());
        return user;
    }
    
    private UserResponse createUserResponse(String username, String email, String status) {
        return UserResponse.builder()
            .username(username)
            .email(email)
            .profilePictureUrl("https://example.com/default.jpg")
            .status(status)
            .build();
    }
}
