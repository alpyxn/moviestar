package com.moviestar.app.controller;

import com.moviestar.app.model.UserDTO;
import com.moviestar.app.model.Response.UserResponse;
import com.moviestar.app.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class AdminUserControllerTest {

    @Mock
    private UserService userService;

    @InjectMocks
    private AdminUserController adminUserController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(adminUserController).build();
    }

    @Test
    void getAllUsers() throws Exception {
        List<UserDTO> users = Arrays.asList(
            createUserDTO(1L, "user1", "user1@example.com", UserDTO.UserStatus.ACTIVE),
            createUserDTO(2L, "user2", "user2@example.com", UserDTO.UserStatus.BANNED)
        );
        
        UserResponse user1Response = createUserResponse("user1", "user1@example.com", "ACTIVE");
        UserResponse user2Response = createUserResponse("user2", "user2@example.com", "BANNED");
        
        when(userService.getAllUsers()).thenReturn(users);
        when(userService.convertToResponse(users.get(0))).thenReturn(user1Response);
        when(userService.convertToResponse(users.get(1))).thenReturn(user2Response);

        mockMvc.perform(get("/api/admin/users")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("user1"))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$[1].username").value("user2"))
                .andExpect(jsonPath("$[1].status").value("BANNED"));
    }

    @Test
    void banUser() throws Exception {
        UserDTO bannedUser = createUserDTO(1L, "testuser", "test@example.com", UserDTO.UserStatus.BANNED);
        UserResponse bannedResponse = createUserResponse("testuser", "test@example.com", "BANNED");
        
        when(userService.updateUserStatus(anyString(), any(UserDTO.UserStatus.class))).thenReturn(bannedUser);
        when(userService.convertToResponse(bannedUser)).thenReturn(bannedResponse);

        mockMvc.perform(post("/api/admin/users/testuser/ban")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.status").value("BANNED"));
    }

    @Test
    void unbanUser() throws Exception {
        UserDTO activeUser = createUserDTO(1L, "testuser", "test@example.com", UserDTO.UserStatus.ACTIVE);
        UserResponse activeResponse = createUserResponse("testuser", "test@example.com", "ACTIVE");
        
        when(userService.updateUserStatus(anyString(), any(UserDTO.UserStatus.class))).thenReturn(activeUser);
        when(userService.convertToResponse(activeUser)).thenReturn(activeResponse);

        mockMvc.perform(post("/api/admin/users/testuser/unban")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testuser"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void getBannedUsers() throws Exception {
        List<UserDTO> bannedUsers = Arrays.asList(
            createUserDTO(1L, "banned1", "banned1@example.com", UserDTO.UserStatus.BANNED),
            createUserDTO(2L, "banned2", "banned2@example.com", UserDTO.UserStatus.BANNED)
        );
        
        UserResponse banned1Response = createUserResponse("banned1", "banned1@example.com", "BANNED");
        UserResponse banned2Response = createUserResponse("banned2", "banned2@example.com", "BANNED");
        
        when(userService.getUsersByStatus(UserDTO.UserStatus.BANNED)).thenReturn(bannedUsers);
        when(userService.convertToResponse(bannedUsers.get(0))).thenReturn(banned1Response);
        when(userService.convertToResponse(bannedUsers.get(1))).thenReturn(banned2Response);

        mockMvc.perform(get("/api/admin/users/banned")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("banned1"))
                .andExpect(jsonPath("$[0].status").value("BANNED"))
                .andExpect(jsonPath("$[1].username").value("banned2"))
                .andExpect(jsonPath("$[1].status").value("BANNED"));
    }

    @Test
    void getActiveUsers() throws Exception {
        List<UserDTO> activeUsers = Arrays.asList(
            createUserDTO(1L, "active1", "active1@example.com", UserDTO.UserStatus.ACTIVE),
            createUserDTO(2L, "active2", "active2@example.com", UserDTO.UserStatus.ACTIVE)
        );
        
        UserResponse active1Response = createUserResponse("active1", "active1@example.com", "ACTIVE");
        UserResponse active2Response = createUserResponse("active2", "active2@example.com", "ACTIVE");
        
        when(userService.getUsersByStatus(UserDTO.UserStatus.ACTIVE)).thenReturn(activeUsers);
        when(userService.convertToResponse(activeUsers.get(0))).thenReturn(active1Response);
        when(userService.convertToResponse(activeUsers.get(1))).thenReturn(active2Response);

        mockMvc.perform(get("/api/admin/users/active")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("active1"))
                .andExpect(jsonPath("$[0].status").value("ACTIVE"))
                .andExpect(jsonPath("$[1].username").value("active2"))
                .andExpect(jsonPath("$[1].status").value("ACTIVE"));
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
