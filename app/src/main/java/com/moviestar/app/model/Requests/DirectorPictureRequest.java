package com.moviestar.app.model.Requests;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DirectorPictureRequest {
    @NotBlank(message = "Picture URL cannot be empty")
    private String pictureUrl;
}
