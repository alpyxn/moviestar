package com.moviestar.app.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.moviestar.app.exception.EntityNotFoundException;
import com.moviestar.app.model.GenreDTO;
import com.moviestar.app.model.Requests.GenreRequest;
import com.moviestar.app.model.Response.GenreResponse;
import com.moviestar.app.repository.GenreRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class GenreService {
    private final GenreRepository genreRepository;

    @Cacheable(value = "genres")
    public List<GenreResponse> getAllGenres() {
        return genreRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    @CacheEvict(value = "genres", allEntries = true)
    public GenreResponse createGenre(GenreRequest request) {
        GenreDTO genre = new GenreDTO();
        genre.setGenre(request.getGenre());
        return convertToResponse(genreRepository.save(genre));
    }

    @Transactional
    @CacheEvict(value = "genres", allEntries = true)
    public GenreResponse updateGenre(Long id, GenreRequest request) {
        GenreDTO genre = genreRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Genre not found with id: " + id));
        genre.setGenre(request.getGenre());
        return convertToResponse(genreRepository.save(genre));
    }

    @Transactional
    @CacheEvict(value = "genres", allEntries = true)
    public void deleteGenre(Long id) {
        genreRepository.deleteById(id);
    }

    private GenreResponse convertToResponse(GenreDTO genre) {
        return GenreResponse.builder()
                .id(genre.getId())
                .genre(genre.getGenre())
                .build();
    }


    public GenreResponse getGenreById(Long id) {
        return genreRepository.findById(id)
                .map(this::convertToResponse)
                .orElseThrow(() -> new EntityNotFoundException("Genre not found with id: " + id));
    }
}