package com.moviestar.app.controller;

import com.moviestar.app.model.Response.UserResponse;
import com.moviestar.app.model.UserDTO;
import com.moviestar.app.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/users")
@PreAuthorize("hasAuthority('ROLE_ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserService userService;

    @GetMapping
    public ResponseEntity<List<UserResponse>> getAllUsers() {
        return ResponseEntity.ok(
            userService.getAllUsers().stream()
                .map(userService::convertToResponse)
                .collect(Collectors.toList())
        );
    }

    @PostMapping("/{username}/ban")
    public ResponseEntity<UserResponse> banUser(@PathVariable String username) {
        UserDTO user = userService.updateUserStatus(username, UserDTO.UserStatus.BANNED);
        return ResponseEntity.ok(userService.convertToResponse(user));
    }

    @PostMapping("/{username}/unban")
    public ResponseEntity<UserResponse> unbanUser(@PathVariable String username) {
        UserDTO user = userService.updateUserStatus(username, UserDTO.UserStatus.ACTIVE);
        return ResponseEntity.ok(userService.convertToResponse(user));
    }

    @GetMapping("/banned")
    public ResponseEntity<List<UserResponse>> getBannedUsers() {
        return ResponseEntity.ok(
            userService.getUsersByStatus(UserDTO.UserStatus.BANNED).stream()
                .map(userService::convertToResponse)
                .collect(Collectors.toList())
        );
    }

    @GetMapping("/active")
    public ResponseEntity<List<UserResponse>> getActiveUsers() {
        return ResponseEntity.ok(
            userService.getUsersByStatus(UserDTO.UserStatus.ACTIVE).stream()
                .map(userService::convertToResponse)
                .collect(Collectors.toList())
        );
    }
}
