package com.moviestar.app.model.Response;


import lombok.*;

@Getter
@Setter
@AllArgsConstructor
@Builder
public class RatingResponse {
    private Long id;
    private Long movieId;
    private int rating;
    private String username;
}