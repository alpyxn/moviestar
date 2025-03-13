// MovieDTO.java
package com.moviestar.app.model;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotEmpty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "Movie")
public class MovieDTO {

        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        @Column(name = "id")
        private Long id;

        @NotEmpty(message = "Title cannot be empty")
        @Column(name = "title", nullable = false)
        private String title;

        @Column(name = "description")
        private String description;

        @Min(value = 1888, message = "Year must be at least 1888")
        @Max(value = 2200, message = "Year must be at most 2200")
        private Integer year;

        @ManyToMany(fetch = FetchType.LAZY)
        @JoinTable(name = "movie_genre", joinColumns = @JoinColumn(name = "movie_id"), inverseJoinColumns = @JoinColumn(name = "genre_id"))
        private List<GenreDTO> genres = new ArrayList<>();

        @ManyToMany
        @JoinTable(name = "Movie_Actor", joinColumns = @JoinColumn(name = "movie_id"), inverseJoinColumns = @JoinColumn(name = "actor_id"))
        private List<ActorDTO> actors = new ArrayList<>();

        @ManyToMany
        @JoinTable(name = "Movie_Director", joinColumns = @JoinColumn(name = "movie_id"), inverseJoinColumns = @JoinColumn(name = "director_id"))
        private List<DirectorDTO> directors = new ArrayList<>();

        @Column(name = "poster_url")
        private String posterURL;

        @Column(name = "backdrop_url")
        private String backdropURL;

        public List<GenreDTO> getGenres() {
            return genres;
        }

        public void setGenres(List<GenreDTO> genres) {
            this.genres = genres;
        }

}