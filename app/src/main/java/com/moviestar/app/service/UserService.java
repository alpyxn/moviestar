package com.moviestar.app.service;

import com.moviestar.app.model.UserDTO;
import com.moviestar.app.model.Response.UserResponse;
import com.moviestar.app.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public Optional<UserDTO> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Transactional
    public UserDTO createOrUpdateUser(String username, String email, String profilePictureUrl) {
        Optional<UserDTO> existingUser = userRepository.findByUsername(username);
        
        if (existingUser.isPresent()) {
            UserDTO user = existingUser.get();
            user.setLastLogin(LocalDateTime.now());
            if (email != null) {
                user.setEmail(email);
            }
            if (profilePictureUrl != null) {
                user.setProfilePictureUrl(profilePictureUrl);
            }
            return userRepository.save(user);
        } else {
            UserDTO newUser = new UserDTO();
            newUser.setUsername(username);
            newUser.setEmail(email);
            newUser.setProfilePictureUrl(profilePictureUrl);
            newUser.setStatus(UserDTO.UserStatus.ACTIVE);
            newUser.setCreatedAt(LocalDateTime.now());
            newUser.setLastLogin(LocalDateTime.now());
            return userRepository.save(newUser);
        }
    }

    @Transactional
    public UserDTO updateUserStatus(String username, UserDTO.UserStatus status) {
        UserDTO user = userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setStatus(status);
        return userRepository.save(user);
    }

    @Transactional
    public UserDTO updateProfilePicture(String username, String profilePictureUrl) {
        UserDTO user = getUserByUsername(username)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setProfilePictureUrl(profilePictureUrl == null || profilePictureUrl.isEmpty() ? null : profilePictureUrl);
        return userRepository.save(user);
    }

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll();
    }

    public List<UserDTO> getUsersByStatus(UserDTO.UserStatus status) {
        return userRepository.findByStatus(status);
    }

    public UserResponse convertToResponse(UserDTO userDTO) {
        return UserResponse.builder()
                .username(userDTO.getUsername())
                .email(userDTO.getEmail())
                .profilePictureUrl(userDTO.getProfilePictureUrl())
                .status(userDTO.getStatus().name())
                .createdAt(userDTO.getCreatedAt())
                .build();
    }
}
