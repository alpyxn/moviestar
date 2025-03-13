package com.moviestar.app.repository;

import com.moviestar.app.model.GenreDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GenreRepository extends JpaRepository<GenreDTO, Long> {
    boolean existsByGenre(String genre);
}