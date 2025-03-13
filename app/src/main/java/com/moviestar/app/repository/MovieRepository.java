package com.moviestar.app.repository;

import com.moviestar.app.model.MovieDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovieRepository extends JpaRepository<MovieDTO, Long> {
    List<MovieDTO> findByTitle(String title);

    @Query("SELECT m FROM MovieDTO m JOIN m.actors a WHERE a.name LIKE %:actor% OR a.surname LIKE %:actor%")
    List<MovieDTO> findByActor(String actor);

    @Query("SELECT m FROM MovieDTO m JOIN m.genres g WHERE g.genre = :genre")
    List<MovieDTO> findByGenresGenre(String genre);
}
