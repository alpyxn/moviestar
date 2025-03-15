package com.moviestar.app.controller;

import com.moviestar.app.model.Response.DirectorResponse;
import com.moviestar.app.service.DirectorService;
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
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
public class DirectorControllerTest {

    @Mock
    private DirectorService directorService;

    @InjectMocks
    private DirectorController directorController;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(directorController).build();
    }

    @Test
    void getAllDirectors() throws Exception {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        Date birthDay = dateFormat.parse("1965-05-15");

        DirectorResponse directorResponse = new DirectorResponse(
            1L,
            "Steven",
            "Spielberg",
            birthDay,
            "Famous American film director, producer, and screenwriter",
            "http://example.com/spielberg.jpg",
            Collections.emptyList()
        );

        List<DirectorResponse> directorResponseList = Collections.singletonList(directorResponse);

        when(directorService.getAllDirectors()).thenReturn(directorResponseList);

        mockMvc.perform(get("/api/directors")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Steven"))
                .andExpect(jsonPath("$[0].surname").value("Spielberg"))
                .andExpect(jsonPath("$[0].birthDay").exists())
                .andExpect(jsonPath("$[0].about").value("Famous American film director, producer, and screenwriter"))
                .andExpect(jsonPath("$[0].pictureUrl").value("http://example.com/spielberg.jpg"))
                .andExpect(jsonPath("$[0].movieIds").isArray());
    }

    @Test
    void getDirectorById() throws Exception {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        Date birthDay = dateFormat.parse("1965-05-15");

        DirectorResponse directorResponse = new DirectorResponse(
            1L,
            "Steven",
            "Spielberg",
            birthDay,
            "Famous American film director, producer, and screenwriter",
            "http://example.com/spielberg.jpg",
            Collections.emptyList()
        );

        when(directorService.getDirectorById(anyLong())).thenReturn(directorResponse);

        mockMvc.perform(get("/api/directors/1")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.name").value("Steven"))
                .andExpect(jsonPath("$.surname").value("Spielberg"))
                .andExpect(jsonPath("$.about").value("Famous American film director, producer, and screenwriter"))
                .andExpect(jsonPath("$.pictureUrl").value("http://example.com/spielberg.jpg"));
    }

    @Test
    void searchDirectors() throws Exception {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        Date birthDay = dateFormat.parse("1965-05-15");

        DirectorResponse directorResponse = new DirectorResponse(
            1L,
            "Steven",
            "Spielberg",
            birthDay,
            "Famous American film director, producer, and screenwriter",
            "http://example.com/spielberg.jpg",
            Collections.emptyList()
        );

        List<DirectorResponse> directorResponseList = Collections.singletonList(directorResponse);

        when(directorService.searchDirectors(anyString())).thenReturn(directorResponseList);

        mockMvc.perform(get("/api/directors/search?query=Steven")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Steven"));
    }
    
    @Test
    void getDirectorAbout() throws Exception {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        Date birthDay = dateFormat.parse("1965-05-15");

        DirectorResponse directorResponse = new DirectorResponse(
            1L,
            "Steven",
            "Spielberg",
            birthDay,
            "Famous American film director, producer, and screenwriter",
            "http://example.com/spielberg.jpg",
            Collections.emptyList()
        );

        when(directorService.getDirectorById(anyLong())).thenReturn(directorResponse);

        mockMvc.perform(get("/api/directors/1/about")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.about").value("Famous American film director, producer, and screenwriter"));
    }
    
    @Test
    void getDirectorPicture() throws Exception {
        SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd");
        Date birthDay = dateFormat.parse("1965-05-15");

        DirectorResponse directorResponse = new DirectorResponse(
            1L,
            "Steven",
            "Spielberg",
            birthDay,
            "Famous American film director, producer, and screenwriter",
            "http://example.com/spielberg.jpg",
            Collections.emptyList()
        );

        when(directorService.getDirectorById(anyLong())).thenReturn(directorResponse);

        mockMvc.perform(get("/api/directors/1/picture")
                .contentType(MediaType.APPLICATION_JSON))
                .andDo(print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.pictureUrl").value("http://example.com/spielberg.jpg"));
    }
}
