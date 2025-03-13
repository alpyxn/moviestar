package com.moviestar.app.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name="Rating")
public class RatingDTO {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="id")
    private Long id;

    @Column(name="movie_id", nullable = false)
    private Long movieId;

    @Column(name="rating", nullable = false)
    @Min(value=1, message="Rating must be at least 1")
    @Max(value=10, message="Rating must be at most 10")
    private int rating;

    @Column(name="username", nullable = false)
    @Size(min=3,max=50, message="Username must be between 3 and 50")
    private String username;
}
