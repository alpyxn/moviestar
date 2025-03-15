package com.moviestar.app.controller;

import com.moviestar.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
@Profile({"dev", "test"})
public class DebugController {

    private final UserRepository userRepository;

    @GetMapping("/users/search")
    public ResponseEntity<Map<String, Object>> searchUsers(@RequestParam("username") String username) {
        // First look up with exact match
        var exactMatch = userRepository.findByUsername(username);
        
        // Then with case-insensitive match
        var caseInsensitiveMatch = userRepository.findByUsernameIgnoreCase(username);
        
        // Find users containing this substring
        var allUsers = userRepository.findAll();
        List<String> allUsernames = allUsers.stream()
            .map(u -> u.getUsername())
            .collect(Collectors.toList());
        
        List<String> similarUsers = allUsernames.stream()
            .filter(u -> u.toLowerCase().contains(username.toLowerCase()))
            .collect(Collectors.toList());
            
        Map<String, Object> response = Map.of(
            "exactMatch", exactMatch.isPresent() ? exactMatch.get().getUsername() : null,
            "caseInsensitiveMatch", caseInsensitiveMatch.isPresent() ? 
                caseInsensitiveMatch.get().getUsername() : null,
            "similarUsernames", similarUsers,
            "allUsernames", allUsernames,
            "searchTerm", username
        );
        
        return ResponseEntity.ok(response);
    }
}
