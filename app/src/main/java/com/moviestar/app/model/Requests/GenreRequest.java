package com.moviestar.app.model.Requests;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class GenreRequest {

    @NotEmpty(message = "Genre cannot be empty")
    @Size(min = 1, max = 50, message = "Genre must be between 1 and 50 characters")
    private String genre;
}