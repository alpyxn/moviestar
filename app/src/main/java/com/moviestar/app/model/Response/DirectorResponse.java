package com.moviestar.app.model.Response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.Date;
import java.util.List;

@Data
@AllArgsConstructor
@Builder
public class DirectorResponse {
    private Long id;
    private String name;
    private String surname;
    private Date birthDay;
    private String about;
    private String pictureUrl;
    private List<Long> movieIds;
}