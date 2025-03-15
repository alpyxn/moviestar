package com.moviestar.app.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.moviestar.app.model.DirectorDTO;
import com.moviestar.app.model.MovieDTO;
import com.moviestar.app.model.Requests.DirectorRequest;
import com.moviestar.app.model.Response.DirectorResponse;
import com.moviestar.app.model.Response.MovieResponse; // Add this import
import com.moviestar.app.repository.DirectorRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class DirectorService {
    private final DirectorRepository directorRepository;
    private final MovieService movieService; 

    public List<DirectorResponse> getAllDirectors() {
        return directorRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public DirectorResponse getDirectorById(Long id) {
        DirectorDTO director = directorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Director not found"));
        return convertToResponse(director);
    }

    @Transactional
    public DirectorResponse createDirector(DirectorRequest request) {
        DirectorDTO director = new DirectorDTO();
        director.setName(request.getName());
        director.setSurname(request.getSurname());
        director.setBirthDay(request.getBirthDay());
        director.setAbout(request.getAbout());
        director.setPictureUrl(request.getPictureUrl());
        return convertToResponse(directorRepository.save(director));
    }


    @Transactional
    public void deleteDirector(Long id) {
        DirectorDTO director = directorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Director not found"));
        director.getMovies().forEach(movie -> movie.getDirectors().remove(director));
        directorRepository.deleteById(id);
    }

    @Transactional
    public DirectorResponse updateDirector(Long id, DirectorRequest request) {
        DirectorDTO director = directorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Director not found"));

        director.setName(request.getName());
        director.setSurname(request.getSurname());
        director.setBirthDay(request.getBirthDay());
        director.setAbout(request.getAbout());
        director.setPictureUrl(request.getPictureUrl());

        return convertToResponse(directorRepository.save(director));
    }

    @Transactional
    public DirectorResponse updateDirectorAbout(Long id, String about) {
        DirectorDTO director = directorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Director not found"));
        director.setAbout(about);
        return convertToResponse(directorRepository.save(director));
    }

    @Transactional
    public DirectorResponse updateDirectorPicture(Long id, String pictureUrl) {
        DirectorDTO director = directorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Director not found"));
        director.setPictureUrl(pictureUrl);
        return convertToResponse(directorRepository.save(director));
    }

    public List<DirectorResponse> searchDirectors(String query) {
        return directorRepository.findByNameContainingOrSurnameContaining(query, query)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public List<MovieResponse> getDirectorMovies(Long directorId) {
        DirectorDTO director = directorRepository.findById(directorId)
                .orElseThrow(() -> new RuntimeException("Director not found"));
        
        return director.getMovies().stream()
                .map(movieService::convertToResponse)
                .collect(Collectors.toList());
    }

    private DirectorResponse convertToResponse(DirectorDTO director) {
        List<Long> movieIds = director.getMovies().stream()
                .map(MovieDTO::getId)
                .collect(Collectors.toList());

        return DirectorResponse.builder()
                .id(director.getId())
                .name(director.getName())
                .surname(director.getSurname())
                .birthDay(director.getBirthDay())
                .about(director.getAbout())
                .pictureUrl(director.getPictureUrl())
                .movieIds(movieIds)
                .build();
    }
}