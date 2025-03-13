package com.moviestar.app.repository;

import com.moviestar.app.model.DirectorDTO;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DirectorRepository extends JpaRepository<DirectorDTO, Long> {
    List<DirectorDTO> findByNameContainingOrSurnameContaining(String name, String surname);
}