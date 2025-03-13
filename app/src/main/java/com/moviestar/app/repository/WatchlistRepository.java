package com.moviestar.app.repository;

import com.moviestar.app.model.WatchlistItemDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WatchlistRepository extends JpaRepository<WatchlistItemDTO, Long> {
    List<WatchlistItemDTO> findByUsername(String username);
    Optional<WatchlistItemDTO> findByUsernameAndMovieId(String username, Long movieId);
    boolean existsByUsernameAndMovieId(String username, Long movieId);
    void deleteByUsernameAndMovieId(String username, Long movieId);
}
