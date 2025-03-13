package com.moviestar.app.repository;

import com.moviestar.app.model.ActorDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ActorRepository extends JpaRepository<ActorDTO, Long> {
    List<ActorDTO> findByNameContainingOrSurnameContaining(String name, String surname);
}