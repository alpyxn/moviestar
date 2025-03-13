package com.moviestar.app.model.Requests;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ProfilePictureRequest {
    @NotBlank(message = "Profile picture URL cannot be empty")
    private String profilePictureUrl;
}
