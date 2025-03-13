package com.moviestar.app.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.moviestar.app.model.UserDTO;
import com.moviestar.app.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Component
@RequiredArgsConstructor
public class BannedUserFilter extends OncePerRequestFilter {

    private final UserService userService;
    private final ObjectMapper objectMapper;
    
    private boolean isPublicEndpoint(String path) {
        return path.startsWith("/api/movies") && !path.contains("/comments") && !path.contains("/ratings");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) 
            throws ServletException, IOException {

        if (isPublicEndpoint(request.getRequestURI())) {
            filterChain.doFilter(request, response);
            return;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication instanceof JwtAuthenticationToken) {
            JwtAuthenticationToken jwtToken = (JwtAuthenticationToken) authentication;
            
            String username = jwtToken.getToken().getClaimAsString("preferred_username");
            if (username == null) {
                username = jwtToken.getName();
            }
            
            String email = jwtToken.getToken().getClaimAsString("email");
            String picture = jwtToken.getToken().hasClaim("picture") ?
                jwtToken.getToken().getClaimAsString("picture") : null;
                
            userService.createOrUpdateUser(username, email, picture);
            
            Optional<UserDTO> userOpt = userService.getUserByUsername(username);
            if (userOpt.isPresent() && userOpt.get().getStatus() == UserDTO.UserStatus.BANNED) {
                Map<String, Object> errorDetails = new HashMap<>();
                errorDetails.put("message", "Your account has been banned");
                errorDetails.put("status", HttpStatus.FORBIDDEN.value());
                
                response.setStatus(HttpStatus.FORBIDDEN.value());
                response.setContentType("application/json");
                objectMapper.writeValue(response.getWriter(), errorDetails);
                return;
            }
        }
        
        filterChain.doFilter(request, response);
    }
}
