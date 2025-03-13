package com.moviestar.app.model.Requests;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CommentLikeRequest {
    @NotNull(message = "like status cannot be null")
    private Boolean isLike;
}
