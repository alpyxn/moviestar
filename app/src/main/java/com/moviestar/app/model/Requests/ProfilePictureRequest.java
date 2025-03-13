package com.moviestar.app.model.Requests;

import lombok.Data;

@Data
public class ProfilePictureRequest {
    // Remove @NotBlank to allow null or empty values for removing the profile picture
    private String profilePictureUrl;
}
