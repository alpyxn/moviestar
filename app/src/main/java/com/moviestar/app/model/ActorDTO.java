package com.moviestar.app.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name="Actor")
public class ActorDTO {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="id")
    private Long id;

    @Column(name="name", nullable = false)
    private String name;

    @Column(name="surname", nullable = false)
    private String surname;

    @Column(name="birthDay")
    private Date birthDay;
    
    @Column(name="about", length = 2000)
    private String about;
    
    @Column(name="picture_url")
    private String pictureUrl;

    @ManyToMany(mappedBy = "actors")
    private List<MovieDTO> movies = new ArrayList<>();
}