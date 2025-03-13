package com.moviestar.app.controller;

import com.moviestar.app.model.Response.ActorResponse;
import com.moviestar.app.service.ActorService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.text.SimpleDateFormat;
import java.util.Collections;
import java.util.Date;
import java.util.List;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class ActorControllerTest {

    @Mock
    private ActorService actorService;

    @InjectMocks
    private ActorController actorController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(actorController).build();
    }

    @Test
    void getAllActors() throws Exception {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        Date birthDay = dateFormat.parse("1990-01-01");

        // Instead of using the builder pattern, create the object directly
        ActorResponse actorResponse = new ActorResponse(
            1L, 
            "John", 
            "Doe", 
            birthDay, 
            "Famous actor from Hollywood", 
            "http://example.com/john_doe.jpg", 
            Collections.emptyList()
        );

        List<ActorResponse> actorResponseList = Collections.singletonList(actorResponse);

        when(actorService.getAllActors()).thenReturn(actorResponseList);

        mockMvc.perform(get("/api/actors")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("John"))
                .andExpect(jsonPath("$[0].surname").value("Doe"))
                .andExpect(jsonPath("$[0].birthDay").exists())
                .andExpect(jsonPath("$[0].about").value("Famous actor from Hollywood"))
                .andExpect(jsonPath("$[0].pictureUrl").value("http://example.com/john_doe.jpg"))
                .andExpect(jsonPath("$[0].movieIds").isArray());
    }

    @Test
    void getActorById() throws Exception {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        Date birthDay = dateFormat.parse("1990-01-01");

        // Instead of using the builder pattern, create the object directly
        ActorResponse actorResponse = new ActorResponse(
            1L, 
            "John", 
            "Doe", 
            birthDay, 
            "Famous actor from Hollywood", 
            "http://example.com/john_doe.jpg", 
            Collections.emptyList()
        );

        when(actorService.getActorById(anyLong())).thenReturn(actorResponse);

        mockMvc.perform(get("/api/actors/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("John"))
                .andExpect(jsonPath("$.surname").value("Doe"))
                .andExpect(jsonPath("$.about").value("Famous actor from Hollywood"))
                .andExpect(jsonPath("$.pictureUrl").value("http://example.com/john_doe.jpg"));
    }
    
    @Test
    void getActorAbout() throws Exception {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        Date birthDay = dateFormat.parse("1990-01-01");

        // Instead of using the builder pattern, create the object directly
        ActorResponse actorResponse = new ActorResponse(
            1L, 
            "John", 
            "Doe", 
            birthDay, 
            "Famous actor from Hollywood", 
            "http://example.com/john_doe.jpg", 
            Collections.emptyList()
        );

        when(actorService.getActorById(anyLong())).thenReturn(actorResponse);

        mockMvc.perform(get("/api/actors/1/about")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.about").value("Famous actor from Hollywood"));
    }
    
    @Test
    void getActorPicture() throws Exception {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        Date birthDay = dateFormat.parse("1990-01-01");

        // Instead of using the builder pattern, create the object directly
        ActorResponse actorResponse = new ActorResponse(
            1L, 
            "John", 
            "Doe", 
            birthDay, 
            "Famous actor from Hollywood", 
            "http://example.com/john_doe.jpg", 
            Collections.emptyList()
        );

        when(actorService.getActorById(anyLong())).thenReturn(actorResponse);

        mockMvc.perform(get("/api/actors/1/picture")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pictureUrl").value("http://example.com/john_doe.jpg"));
    }
}