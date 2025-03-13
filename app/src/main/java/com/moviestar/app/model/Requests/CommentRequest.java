package com.moviestar.app.model.Requests;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentRequest {
    @NotNull(message = "Comment cannot be null")
    @Size(min = 1, max = 1200, message = "Comment must be between 1 and 1200 characters")
    private String comment;
}