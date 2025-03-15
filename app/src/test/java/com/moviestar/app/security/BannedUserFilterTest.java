package com.moviestar.app.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.moviestar.app.model.UserDTO;
import com.moviestar.app.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.io.IOException;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BannedUserFilterTest {

    @Mock
    private UserService userService;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private JwtAuthenticationToken jwtAuthenticationToken;

    @Mock
    private Jwt jwt;

    @InjectMocks
    private BannedUserFilter bannedUserFilter;

    private StringWriter stringWriter;
    private PrintWriter printWriter;

    @BeforeEach
    void setUp() throws IOException {
        SecurityContextHolder.setContext(securityContext);
    }

    @Test
    void doFilterInternal_PublicEndpoint() throws ServletException, IOException {
        when(securityContext.getAuthentication()).thenReturn(null);

        bannedUserFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_NotPublicEndpoint_NotAuthenticated() throws ServletException, IOException {
        when(securityContext.getAuthentication()).thenReturn(null);

        bannedUserFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_NotPublicEndpoint_Authenticated_NotBanned() throws ServletException, IOException {
        when(securityContext.getAuthentication()).thenReturn(jwtAuthenticationToken);
        when(jwtAuthenticationToken.getToken()).thenReturn(jwt);
        
        when(jwt.getClaimAsString("preferred_username")).thenReturn("testuser");
        when(jwt.getClaimAsString("email")).thenReturn("test@example.com");
        when(jwt.hasClaim("picture")).thenReturn(true);
        when(jwt.getClaimAsString("picture")).thenReturn("https://example.com/pic.jpg");
        
        UserDTO activeUser = createUserDTO(1L, "testuser", "test@example.com", UserDTO.UserStatus.ACTIVE);
        when(userService.getUserByUsername("testuser")).thenReturn(Optional.of(activeUser));
        
        bannedUserFilter.doFilterInternal(request, response, filterChain);

        verify(userService).createOrUpdateUser("testuser", "test@example.com", "https://example.com/pic.jpg");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void doFilterInternal_NotPublicEndpoint_Authenticated_Banned() throws ServletException, IOException {
        stringWriter = new StringWriter();
        printWriter = new PrintWriter(stringWriter);
        when(response.getWriter()).thenReturn(printWriter);
        
        when(securityContext.getAuthentication()).thenReturn(jwtAuthenticationToken);
        when(jwtAuthenticationToken.getToken()).thenReturn(jwt);
        
        when(jwt.getClaimAsString("preferred_username")).thenReturn("banneduser");
        when(jwt.getClaimAsString("email")).thenReturn("banned@example.com");
        when(jwt.hasClaim("picture")).thenReturn(true);
        when(jwt.getClaimAsString("picture")).thenReturn("https://example.com/pic.jpg");
        
        UserDTO bannedUser = createUserDTO(1L, "banneduser", "banned@example.com", UserDTO.UserStatus.BANNED);
        when(userService.getUserByUsername("banneduser")).thenReturn(Optional.of(bannedUser));
        
        bannedUserFilter.doFilterInternal(request, response, filterChain);

        verify(userService).createOrUpdateUser("banneduser", "banned@example.com", "https://example.com/pic.jpg");
        verify(response).setStatus(HttpStatus.FORBIDDEN.value());
        verify(response).setContentType("application/json");
        verify(objectMapper).writeValue(any(PrintWriter.class), any());
        verify(filterChain, never()).doFilter(request, response);
    }

    @Test
    void isUserProfileEndpoint_ShouldIdentifyUserProfilePaths() {
        assertTrue(BannedUserFilter.isUserProfileEndpoint("/api/users/username"));
        assertTrue(BannedUserFilter.isUserProfileEndpoint("/api/users/john.doe"));
        assertTrue(BannedUserFilter.isUserProfileEndpoint("/api/users/user-with-dashes"));
        assertTrue(BannedUserFilter.isUserProfileEndpoint("/api/users/123"));
        
        assertTrue(BannedUserFilter.isUserProfileEndpoint("/api/users/profile"));
        
        assertFalse(BannedUserFilter.isUserProfileEndpoint("/api/users/username/comments"));
        assertFalse(BannedUserFilter.isUserProfileEndpoint("/api/users"));
        assertFalse(BannedUserFilter.isUserProfileEndpoint("/api/users/"));
        assertFalse(BannedUserFilter.isUserProfileEndpoint(null));
    }
    
    @Test
    void doFilterInternal_UserProfileEndpoint_NotAuthenticated() throws ServletException, IOException {
        when(securityContext.getAuthentication()).thenReturn(null);

        bannedUserFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }
    
    @Test
    void doFilterInternal_UserProfileEndpoint_WithAuthentication() throws ServletException, IOException {
        when(securityContext.getAuthentication()).thenReturn(jwtAuthenticationToken);
        when(jwtAuthenticationToken.getToken()).thenReturn(jwt);
        
        when(jwt.getClaimAsString("preferred_username")).thenReturn("loggedinuser");
        when(jwt.getClaimAsString("email")).thenReturn("loggedin@example.com");
        when(jwt.hasClaim("picture")).thenReturn(true);
        when(jwt.getClaimAsString("picture")).thenReturn("https://example.com/pic.jpg");
        
        UserDTO activeUser = createUserDTO(1L, "loggedinuser", "loggedin@example.com", UserDTO.UserStatus.ACTIVE);
        when(userService.getUserByUsername("loggedinuser")).thenReturn(Optional.of(activeUser));
        
        bannedUserFilter.doFilterInternal(request, response, filterChain);
        
        verify(userService).createOrUpdateUser("loggedinuser", "loggedin@example.com", "https://example.com/pic.jpg");
        verify(filterChain).doFilter(request, response);
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
}
