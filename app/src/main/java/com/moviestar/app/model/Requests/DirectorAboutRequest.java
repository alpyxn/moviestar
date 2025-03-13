package com.moviestar.app.model.Requests;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DirectorAboutRequest {
    @Size(max = 2000, message = "About text must be less than 2000 characters")
    private String about;
}
