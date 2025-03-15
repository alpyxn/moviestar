package com.moviestar.app.repository;

import com.moviestar.app.model.UserDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<UserDTO, Long> {
    Optional<UserDTO> findByUsername(String username);
    Optional<UserDTO> findByUsernameIgnoreCase(String username);
    boolean existsByUsername(String username);
    List<UserDTO> findByStatus(UserDTO.UserStatus status);
}
