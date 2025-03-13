package com.moviestar.app.service;

import com.moviestar.app.model.Response.UserResponse;
import com.moviestar.app.model.UserDTO;
import com.moviestar.app.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    void getUserByUsername_Exists() {
        String username = "testuser";
        UserDTO user = createUserDTO(1L, username, "test@example.com", UserDTO.UserStatus.ACTIVE);
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));

        Optional<UserDTO> result = userService.getUserByUsername(username);

        assertTrue(result.isPresent());
        assertEquals(username, result.get().getUsername());
    }

    @Test
    void getUserByUsername_NotFound() {
        String username = "nonexistentuser";
        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        Optional<UserDTO> result = userService.getUserByUsername(username);

        assertFalse(result.isPresent());
    }

    @Test
    void createOrUpdateUser_CreateNew() {
        String username = "newuser";
        String email = "new@example.com";
        String profilePicture = "https://example.com/pic.jpg";
        
        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());
        when(userRepository.save(any(UserDTO.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserDTO result = userService.createOrUpdateUser(username, email, profilePicture);

        assertEquals(username, result.getUsername());
        assertEquals(email, result.getEmail());
        assertEquals(profilePicture, result.getProfilePictureUrl());
        assertEquals(UserDTO.UserStatus.ACTIVE, result.getStatus());
        assertNotNull(result.getCreatedAt());
        assertNotNull(result.getLastLogin());
        
        verify(userRepository).save(any(UserDTO.class));
    }

    @Test
    void createOrUpdateUser_UpdateExisting() {
        String username = "existinguser";
        String oldEmail = "old@example.com";
        String newEmail = "new@example.com";
        String newProfilePicture = "https://example.com/new.jpg";
        
        UserDTO existingUser = createUserDTO(1L, username, oldEmail, UserDTO.UserStatus.ACTIVE);
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any(UserDTO.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserDTO result = userService.createOrUpdateUser(username, newEmail, newProfilePicture);

        assertEquals(username, result.getUsername());
        assertEquals(newEmail, result.getEmail());
        assertEquals(newProfilePicture, result.getProfilePictureUrl());
        verify(userRepository).save(existingUser);
    }

    @Test
    void updateUserStatus() {
        String username = "testuser";
        UserDTO user = createUserDTO(1L, username, "test@example.com", UserDTO.UserStatus.ACTIVE);
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(userRepository.save(any(UserDTO.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UserDTO result = userService.updateUserStatus(username, UserDTO.UserStatus.BANNED);

        assertEquals(UserDTO.UserStatus.BANNED, result.getStatus());
        verify(userRepository).save(user);
    }

    @Test
    void updateUserStatus_UserNotFound() {
        String username = "nonexistent";
        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () ->
            userService.updateUserStatus(username, UserDTO.UserStatus.BANNED));
        
        verify(userRepository, never()).save(any());
    }

    @Test
    void getAllUsers() {
        List<UserDTO> users = Arrays.asList(
            createUserDTO(1L, "user1", "user1@example.com", UserDTO.UserStatus.ACTIVE),
            createUserDTO(2L, "user2", "user2@example.com", UserDTO.UserStatus.BANNED)
        );
        when(userRepository.findAll()).thenReturn(users);

        List<UserDTO> result = userService.getAllUsers();

        assertEquals(2, result.size());
        assertEquals("user1", result.get(0).getUsername());
        assertEquals("user2", result.get(1).getUsername());
    }

    @Test
    void getUsersByStatus() {
        List<UserDTO> activeUsers = Arrays.asList(
            createUserDTO(1L, "activeUser1", "active1@example.com", UserDTO.UserStatus.ACTIVE),
            createUserDTO(2L, "activeUser2", "active2@example.com", UserDTO.UserStatus.ACTIVE)
        );
        when(userRepository.findByStatus(UserDTO.UserStatus.ACTIVE)).thenReturn(activeUsers);

        List<UserDTO> result = userService.getUsersByStatus(UserDTO.UserStatus.ACTIVE);

        assertEquals(2, result.size());
        assertEquals(UserDTO.UserStatus.ACTIVE, result.get(0).getStatus());
        assertEquals(UserDTO.UserStatus.ACTIVE, result.get(1).getStatus());
    }

    @Test
    void convertToResponse() {
        UserDTO user = createUserDTO(1L, "testuser", "test@example.com", UserDTO.UserStatus.ACTIVE);
        
        UserResponse response = userService.convertToResponse(user);
        
        assertEquals("testuser", response.getUsername());
        assertEquals("test@example.com", response.getEmail());
        assertEquals("ACTIVE", response.getStatus());
    }

    @Test
    void updateProfilePicture() {
        String username = "testuser";
        String newPicture = "https://example.com/new.jpg";
        
        UserDTO user = createUserDTO(1L, username, "test@example.com", UserDTO.UserStatus.ACTIVE);
        when(userRepository.findByUsername(username)).thenReturn(Optional.of(user));
        when(userRepository.save(any(UserDTO.class))).thenAnswer(invocation -> invocation.getArgument(0));
        
        UserDTO result = userService.updateProfilePicture(username, newPicture);
        
        assertEquals(newPicture, result.getProfilePictureUrl());
        verify(userRepository).save(user);
    }

    @Test
    void updateProfilePicture_UserNotFound() {
        String username = "nonexistent";
        String newPicture = "https://example.com/new.jpg";
        when(userRepository.findByUsername(username)).thenReturn(Optional.empty());
        
        assertThrows(RuntimeException.class, () ->
            userService.updateProfilePicture(username, newPicture));
        
        verify(userRepository, never()).save(any());
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
