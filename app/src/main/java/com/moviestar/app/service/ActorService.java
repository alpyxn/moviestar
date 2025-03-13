package com.moviestar.app.service;

import com.moviestar.app.model.ActorDTO;
import com.moviestar.app.model.MovieDTO;
import com.moviestar.app.model.Requests.ActorRequest;
import com.moviestar.app.model.Response.ActorResponse;
import com.moviestar.app.repository.ActorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActorService {
    private final ActorRepository actorRepository;

    /**
     * Get all movies for a specific actor
     */
    public List<MovieDTO> getActorMovies(Long actorId) {
        ActorDTO actor = actorRepository.findById(actorId)
                .orElseThrow(() -> new RuntimeException("Actor not found"));
        
        // Return the list of movies associated with this actor
        return actor.getMovies();
    }

    public List<ActorResponse> getAllActors() {
        return actorRepository.findAll().stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    public ActorResponse getActorById(Long id) {
        ActorDTO actor = actorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Actor not found"));
        return convertToResponse(actor);
    }

    @Transactional
    public ActorResponse createActor(ActorRequest request) {
        ActorDTO actor = new ActorDTO();
        actor.setName(request.getName());
        actor.setSurname(request.getSurname());
        actor.setBirthDay(request.getBirthDay());
        actor.setAbout(request.getAbout());
        actor.setPictureUrl(request.getPictureUrl());
        return convertToResponse(actorRepository.save(actor));
    }

    @Transactional
    public void deleteActor(Long id) {
        ActorDTO actor = actorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Actor not found"));
        actor.getMovies().forEach(movie -> movie.getActors().remove(actor));
        actorRepository.deleteById(id);
    }

    @Transactional
    public ActorResponse updateActor(Long id, ActorRequest request) {
        ActorDTO actor = actorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Actor not found"));

        actor.setName(request.getName());
        actor.setSurname(request.getSurname());
        actor.setBirthDay(request.getBirthDay());
        actor.setAbout(request.getAbout());
        actor.setPictureUrl(request.getPictureUrl());

        return convertToResponse(actorRepository.save(actor));
    }

    @Transactional
    public ActorResponse updateActorAbout(Long id, String about) {
        ActorDTO actor = actorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Actor not found"));
        actor.setAbout(about);
        return convertToResponse(actorRepository.save(actor));
    }

    @Transactional
    public ActorResponse updateActorPicture(Long id, String pictureUrl) {
        ActorDTO actor = actorRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Actor not found"));
        actor.setPictureUrl(pictureUrl);
        return convertToResponse(actorRepository.save(actor));
    }

    public List<ActorResponse> searchActors(String query) {
        return actorRepository.findByNameContainingOrSurnameContaining(query, query)
                .stream()
                .map(this::convertToResponse)
                .collect(Collectors.toList());
    }

    private ActorResponse convertToResponse(ActorDTO actor) {
        List<Long> movieIds = actor.getMovies().stream()
                .map(MovieDTO::getId)
                .collect(Collectors.toList());

        return ActorResponse.builder()
                .id(actor.getId())
                .name(actor.getName())
                .surname(actor.getSurname())
                .birthDay(actor.getBirthDay())
                .about(actor.getAbout())
                .pictureUrl(actor.getPictureUrl())
                .movieIds(movieIds)
                .build();
    }
}