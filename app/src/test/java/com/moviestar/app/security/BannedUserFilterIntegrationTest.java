package com.moviestar.app.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.moviestar.app.model.UserDTO;
import com.moviestar.app.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BannedUserFilterIntegrationTest {

    @Mock
    private UserService userService;

    @Mock
    private ObjectMapper objectMapper;

    @Mock
    private SecurityContext securityContext;

    @Mock
    private Authentication authentication;

    @Mock
    private JwtAuthenticationToken jwtAuthenticationToken;

    @Mock
    private Jwt jwt;

    @Mock
    private FilterChain filterChain;

    @Captor
    private ArgumentCaptor<Object> responseCaptor;

    @InjectMocks
    private BannedUserFilter bannedUserFilter;

    @Test
    void publicEndpoint_ShouldPassFilter() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/movies/1");
        MockHttpServletResponse response = new MockHttpServletResponse();

        bannedUserFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }

    @Test
    void checkAdminEndpoint_WithoutAuthentication_ShouldPassToFilterChain() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/admin/users");
        MockHttpServletResponse response = new MockHttpServletResponse();

        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(null);

        bannedUserFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verifyNoInteractions(userService);
    }

    @Test
    void checkProtectedEndpoint_WithAuthenticatedActivedUser_ShouldPassToFilterChain() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/users/profile");
        MockHttpServletResponse response = new MockHttpServletResponse();

        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(jwtAuthenticationToken);
        when(jwtAuthenticationToken.getToken()).thenReturn(jwt);

        when(jwt.getClaimAsString("preferred_username")).thenReturn("testuser");
        when(jwt.getClaimAsString("email")).thenReturn("test@example.com");
        when(jwt.hasClaim("picture")).thenReturn(true);
        when(jwt.getClaimAsString("picture")).thenReturn("https://example.com/pic.jpg");

        UserDTO activeUser = new UserDTO();
        activeUser.setUsername("testuser");
        activeUser.setEmail("test@example.com");
        activeUser.setStatus(UserDTO.UserStatus.ACTIVE);

        when(userService.getUserByUsername("testuser")).thenReturn(Optional.of(activeUser));
        when(userService.createOrUpdateUser(anyString(), anyString(), anyString())).thenReturn(activeUser);

        bannedUserFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        verify(userService).createOrUpdateUser("testuser", "test@example.com", "https://example.com/pic.jpg");
        assertEquals(200, response.getStatus()); // Should pass through without setting error status
    }

    @Test
    void checkProtectedEndpoint_WithAuthenticatedBannedUser_ShouldReturnForbidden() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/users/profile");
        MockHttpServletResponse response = new MockHttpServletResponse();

        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(jwtAuthenticationToken);
        when(jwtAuthenticationToken.getToken()).thenReturn(jwt);

        when(jwt.getClaimAsString("preferred_username")).thenReturn("banneduser");
        when(jwt.getClaimAsString("email")).thenReturn("banned@example.com");
        when(jwt.hasClaim("picture")).thenReturn(true);
        when(jwt.getClaimAsString("picture")).thenReturn("https://example.com/pic.jpg");

        UserDTO bannedUser = new UserDTO();
        bannedUser.setUsername("banneduser");
        bannedUser.setEmail("banned@example.com");
        bannedUser.setStatus(UserDTO.UserStatus.BANNED);

        when(userService.getUserByUsername("banneduser")).thenReturn(Optional.of(bannedUser));
        when(userService.createOrUpdateUser(anyString(), anyString(), anyString())).thenReturn(bannedUser);

        bannedUserFilter.doFilterInternal(request, response, filterChain);

        verify(userService).createOrUpdateUser("banneduser", "banned@example.com", "https://example.com/pic.jpg");
        assertEquals(HttpServletResponse.SC_FORBIDDEN, response.getStatus());
        assertEquals("application/json", response.getContentType());
        verify(filterChain, never()).doFilter(any(HttpServletRequest.class), any(HttpServletResponse.class));
    }

    @Test
    void newUser_ShouldCreateUserAccount() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/users/profile");
        MockHttpServletResponse response = new MockHttpServletResponse();

        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(jwtAuthenticationToken);
        when(jwtAuthenticationToken.getToken()).thenReturn(jwt);

        when(jwt.getClaimAsString("preferred_username")).thenReturn("newuser");
        when(jwt.getClaimAsString("email")).thenReturn("new@example.com");
        when(jwt.hasClaim("picture")).thenReturn(true);
        when(jwt.getClaimAsString("picture")).thenReturn("https://example.com/pic.jpg");

        UserDTO newUser = new UserDTO();
        newUser.setUsername("newuser");
        newUser.setEmail("new@example.com");
        newUser.setStatus(UserDTO.UserStatus.ACTIVE);
        newUser.setCreatedAt(LocalDateTime.now());
        newUser.setLastLogin(LocalDateTime.now());

        when(userService.getUserByUsername("newuser")).thenReturn(Optional.empty());
        when(userService.createOrUpdateUser(anyString(), anyString(), anyString())).thenReturn(newUser);

        bannedUserFilter.doFilterInternal(request, response, filterChain);

        verify(userService).createOrUpdateUser("newuser", "new@example.com", "https://example.com/pic.jpg");
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void missingPictureClaim_ShouldHandleNull() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/users/profile");
        MockHttpServletResponse response = new MockHttpServletResponse();

        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(jwtAuthenticationToken);
        when(jwtAuthenticationToken.getToken()).thenReturn(jwt);

        when(jwt.getClaimAsString("preferred_username")).thenReturn("testuser");
        when(jwt.getClaimAsString("email")).thenReturn("test@example.com");
        when(jwt.hasClaim("picture")).thenReturn(false);

        UserDTO activeUser = new UserDTO();
        activeUser.setUsername("testuser");
        activeUser.setEmail("test@example.com");
        activeUser.setStatus(UserDTO.UserStatus.ACTIVE);

        when(userService.getUserByUsername("testuser")).thenReturn(Optional.of(activeUser));
        when(userService.createOrUpdateUser(anyString(), anyString(), isNull())).thenReturn(activeUser);

        bannedUserFilter.doFilterInternal(request, response, filterChain);

        verify(userService).createOrUpdateUser("testuser", "test@example.com", null);
        verify(filterChain).doFilter(request, response);
    }

    @Test
    void checkUserProfileEndpoint_WithoutAuthentication_ShouldPass() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/users/testuser"); // User profile endpoint
        MockHttpServletResponse response = new MockHttpServletResponse();

        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(null); // No authentication

        bannedUserFilter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
    }
    
    @Test
    void checkUserProfileEndpoint_WithAuthentication_ShouldUpdateUser() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRequestURI("/api/users/someotheruser"); // User profile endpoint
        MockHttpServletResponse response = new MockHttpServletResponse();

        SecurityContextHolder.setContext(securityContext);
        when(securityContext.getAuthentication()).thenReturn(jwtAuthenticationToken);
        when(jwtAuthenticationToken.getToken()).thenReturn(jwt);

        when(jwt.getClaimAsString("preferred_username")).thenReturn("testuser");
        when(jwt.getClaimAsString("email")).thenReturn("test@example.com");
        when(jwt.hasClaim("picture")).thenReturn(true);
        when(jwt.getClaimAsString("picture")).thenReturn("https://example.com/pic.jpg");

        UserDTO activeUser = new UserDTO();
        activeUser.setUsername("testuser");
        activeUser.setEmail("test@example.com");
        activeUser.setStatus(UserDTO.UserStatus.ACTIVE);

        when(userService.getUserByUsername("testuser")).thenReturn(Optional.of(activeUser));
        when(userService.createOrUpdateUser("testuser", "test@example.com", "https://example.com/pic.jpg")).thenReturn(activeUser);

        bannedUserFilter.doFilterInternal(request, response, filterChain);

        verify(userService).createOrUpdateUser("testuser", "test@example.com", "https://example.com/pic.jpg");
        verify(filterChain).doFilter(request, response);
    }
}
