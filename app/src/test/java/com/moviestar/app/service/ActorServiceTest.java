package com.moviestar.app.service;

import com.moviestar.app.model.ActorDTO;
import com.moviestar.app.model.Requests.ActorRequest;
import com.moviestar.app.model.Response.ActorResponse;
import com.moviestar.app.repository.ActorRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ActorServiceTest {

    @Mock
    private ActorRepository actorRepository;

    @InjectMocks
    private ActorService actorService;

    @Test
    void getAllActors() {
        List<ActorDTO> actors = Arrays.asList(
            createActorDTO(1L, "John", "Doe", "About John", "http://example.com/john.jpg"),
            createActorDTO(2L, "Jane", "Smith", "About Jane", "http://example.com/jane.jpg")
        );
        when(actorRepository.findAll()).thenReturn(actors);

        List<ActorResponse> result = actorService.getAllActors();

        assertEquals(2, result.size());
        assertEquals("John", result.get(0).getName());
        assertEquals("Jane", result.get(1).getName());
        assertEquals("About John", result.get(0).getAbout());
        assertEquals("http://example.com/john.jpg", result.get(0).getPictureUrl());
    }

    @Test
    void getActorById_Success() {
        ActorDTO actor = createActorDTO(1L, "John", "Doe", "About John", "http://example.com/john.jpg");
        when(actorRepository.findById(1L)).thenReturn(Optional.of(actor));

        ActorResponse result = actorService.getActorById(1L);

        assertEquals("John", result.getName());
        assertEquals("Doe", result.getSurname());
        assertEquals("About John", result.getAbout());
        assertEquals("http://example.com/john.jpg", result.getPictureUrl());
    }

    @Test
    void getActorById_NotFound() {
        when(actorRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(RuntimeException.class, () -> actorService.getActorById(1L));
    }

    @Test
    void createActor() {
        Date birthDay = new Date();
        ActorRequest request = new ActorRequest("John", "Doe", birthDay, "About John", "http://example.com/john.jpg", new ArrayList<>());

        when(actorRepository.save(any(ActorDTO.class))).thenAnswer(invocation -> {
            ActorDTO savedActor = invocation.getArgument(0);
            savedActor.setId(1L);
            return savedActor;
        });

        ActorResponse result = actorService.createActor(request);

        assertEquals("John", result.getName());
        assertEquals("Doe", result.getSurname());
        assertEquals(birthDay, result.getBirthDay());
        assertEquals("About John", result.getAbout());
        assertEquals("http://example.com/john.jpg", result.getPictureUrl());
    }

    @Test
    void updateActorAbout() {
        ActorDTO actor = createActorDTO(1L, "John", "Doe", "Old about", "http://example.com/john.jpg");
        when(actorRepository.findById(1L)).thenReturn(Optional.of(actor));
        when(actorRepository.save(any(ActorDTO.class))).thenReturn(actor);

        ActorResponse result = actorService.updateActorAbout(1L, "New about");

        assertEquals("New about", result.getAbout());
        assertEquals("John", result.getName());
    }

    @Test
    void updateActorPicture() {
        ActorDTO actor = createActorDTO(1L, "John", "Doe", "About John", "http://example.com/old.jpg");
        when(actorRepository.findById(1L)).thenReturn(Optional.of(actor));
        when(actorRepository.save(any(ActorDTO.class))).thenReturn(actor);

        ActorResponse result = actorService.updateActorPicture(1L, "http://example.com/new.jpg");

        assertEquals("http://example.com/new.jpg", result.getPictureUrl());
        assertEquals("John", result.getName());
    }

    @Test
    void searchActors() {
        List<ActorDTO> actors = Collections.singletonList(
            createActorDTO(1L, "John", "Doe", "About John", "http://example.com/john.jpg")
        );
        when(actorRepository.findByNameContainingOrSurnameContaining("John", "John"))
                .thenReturn(actors);

        List<ActorResponse> result = actorService.searchActors("John");

        assertEquals(1, result.size());
        assertEquals("John", result.get(0).getName());
        assertEquals("About John", result.get(0).getAbout());
    }

    private ActorDTO createActorDTO(Long id, String name, String surname, String about, String pictureUrl) {
        ActorDTO actor = new ActorDTO();
        actor.setId(id);
        actor.setName(name);
        actor.setSurname(surname);
        actor.setBirthDay(new Date());
        actor.setAbout(about);
        actor.setPictureUrl(pictureUrl);
        actor.setMovies(new ArrayList<>());
        return actor;
    }
}