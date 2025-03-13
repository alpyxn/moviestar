package com.moviestar.app.controller;

import com.moviestar.app.model.Requests.ProfilePictureRequest;
import com.moviestar.app.model.Response.UserResponse;
import com.moviestar.app.model.UserDTO;
import com.moviestar.app.service.UserService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/profile")
    public ResponseEntity<UserResponse> getUserProfile(@AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        if (username == null) {
            username = jwt.getSubject();
        }
        
        UserDTO user = userService.getUserByUsername(username)
            .orElseThrow(() -> new RuntimeException("User profile not found"));
        
        return ResponseEntity.ok(userService.convertToResponse(user));
    }

    @PutMapping("/profile/picture")
    public ResponseEntity<UserResponse> updateProfilePicture(
            @Valid @RequestBody ProfilePictureRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        String username = jwt.getClaimAsString("preferred_username");
        if (username == null) {
            username = jwt.getSubject();
        }
        
        // Pass the profilePictureUrl directly to the service
        // The service will handle empty strings or nulls
        UserDTO user = userService.updateProfilePicture(username, request.getProfilePictureUrl());
        return ResponseEntity.ok(userService.convertToResponse(user));
    }
    
    // New endpoint to get user information by username
    @GetMapping("/{username}")
    public ResponseEntity<UserResponse> getUserByUsername(@PathVariable String username) {
        return userService.getUserByUsername(username)
            .map(user -> ResponseEntity.ok(userService.convertToResponse(user)))
            .orElse(ResponseEntity.notFound().build());
    }
}
