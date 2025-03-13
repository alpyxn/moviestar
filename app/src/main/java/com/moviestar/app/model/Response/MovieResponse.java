package com.moviestar.app.model.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
public class MovieResponse {
    private Long id;
    private String title;
    private String description;
    private Integer year;
    private List<GenreResponse> genres;
    private List<ActorResponse> actors;
    private List<DirectorResponse> directors; // Added directors field
    private String posterURL;
    private String backdropURL;
    private double averageRating;
    private int totalRatings;
}