package com.moviestar.app.model.Requests;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Date;
import java.util.List;

import jakarta.validation.constraints.*;


@Data
@NoArgsConstructor
@AllArgsConstructor
public class ActorRequest {
    @NotEmpty(message = "Name cannot be empty")
    @Size(min = 1, max = 50, message = "Name must be between 1 and 50 characters")
    private String name;

    @NotEmpty(message = "Surname cannot be empty")
    @Size(min = 1, max = 50, message = "Surname must be between 1 and 50 characters")
    private String surname;

    @Past(message = "Birth date must be in the past")
    @NotNull(message = "Birth date cannot be null")
    private Date birthDay;

    private String about;
    private String pictureUrl;
    private List<Long> movieIds;
}