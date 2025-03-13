package com.moviestar.app.validation;

import com.moviestar.app.model.Requests.MovieRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.Collections;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class MovieRequestValidationTest {
    
    private Validator validator;
    
    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }
    
    @Test
    void validMovieRequest_NoViolations() {
        MovieRequest request = new MovieRequest();
        request.setTitle("Inception");
        request.setDescription("A thief who steals corporate secrets through dream-sharing technology");
        request.setYear(2010);
        request.setGenreIds(Arrays.asList(1L, 2L));
        request.setActorIds(Arrays.asList(1L, 2L, 3L));
        request.setDirectorIds(Collections.singletonList(1L));
        request.setPosterURL("poster.jpg");
        request.setBackdropURL("backdrop.jpg");
        
        Set<ConstraintViolation<MovieRequest>> violations = validator.validate(request);
        
        assertTrue(violations.isEmpty());
    }
    
    @Test
    void emptyTitle_ViolatesConstraint() {
        MovieRequest request = new MovieRequest();
        request.setTitle("");  // Empty title
        request.setDescription("A thief who steals corporate secrets through dream-sharing technology");
        request.setYear(2010);
        request.setGenreIds(Arrays.asList(1L, 2L));
        
        Set<ConstraintViolation<MovieRequest>> violations = validator.validate(request);
        
        assertFalse(violations.isEmpty());
        assertEquals(1, violations.size());
        assertEquals("title", violations.iterator().next().getPropertyPath().toString());
    }
    
    @Test
    void nullTitle_ViolatesConstraint() {
        MovieRequest request = new MovieRequest();
        request.setTitle(null);  // Null title
        request.setDescription("A thief who steals corporate secrets through dream-sharing technology");
        request.setYear(2010);
        request.setGenreIds(Arrays.asList(1L, 2L));
        
        Set<ConstraintViolation<MovieRequest>> violations = validator.validate(request);
        
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
            .anyMatch(v -> v.getPropertyPath().toString().equals("title")));
    }
    
    @Test
    void tooLongTitle_ViolatesConstraint() {
        MovieRequest request = new MovieRequest();
        // Create a title with 256 characters (exceeding 255 max)
        StringBuilder longTitle = new StringBuilder();
        for (int i = 0; i < 256; i++) {
            longTitle.append("a");
        }
        
        request.setTitle(longTitle.toString());
        request.setDescription("A thief who steals corporate secrets through dream-sharing technology");
        request.setYear(2010);
        request.setGenreIds(Arrays.asList(1L, 2L));
        
        Set<ConstraintViolation<MovieRequest>> violations = validator.validate(request);
        
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
            .anyMatch(v -> v.getPropertyPath().toString().equals("title")));
    }
    
    @Test
    void emptyDescription_ViolatesConstraint() {
        MovieRequest request = new MovieRequest();
        request.setTitle("Inception");
        request.setDescription("");  // Empty description
        request.setYear(2010);
        request.setGenreIds(Arrays.asList(1L, 2L));
        
        Set<ConstraintViolation<MovieRequest>> violations = validator.validate(request);
        
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
            .anyMatch(v -> v.getPropertyPath().toString().equals("description")));
    }
    
    @Test
    void nullYear_ViolatesConstraint() {
        MovieRequest request = new MovieRequest();
        request.setTitle("Inception");
        request.setDescription("A thief who steals corporate secrets");
        request.setYear(null);  // Null year
        request.setGenreIds(Arrays.asList(1L, 2L));
        
        Set<ConstraintViolation<MovieRequest>> violations = validator.validate(request);
        
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
            .anyMatch(v -> v.getPropertyPath().toString().equals("year")));
    }
    
    @Test
    void emptyGenreIds_ViolatesConstraint() {
        MovieRequest request = new MovieRequest();
        request.setTitle("Inception");
        request.setDescription("A thief who steals corporate secrets");
        request.setYear(2010);
        request.setGenreIds(Collections.emptyList());  // Empty genre IDs
        
        Set<ConstraintViolation<MovieRequest>> violations = validator.validate(request);
        
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
            .anyMatch(v -> v.getPropertyPath().toString().equals("genreIds")));
    }
    
    @Test
    void nullGenreIds_ViolatesConstraint() {
        MovieRequest request = new MovieRequest();
        request.setTitle("Inception");
        request.setDescription("A thief who steals corporate secrets");
        request.setYear(2010);
        request.setGenreIds(null);  // Null genre IDs
        
        Set<ConstraintViolation<MovieRequest>> violations = validator.validate(request);
        
        assertFalse(violations.isEmpty());
        assertTrue(violations.stream()
            .anyMatch(v -> v.getPropertyPath().toString().equals("genreIds")));
    }
    
    @Test
    void optionalFields_NoViolations() {
        MovieRequest request = new MovieRequest();
        request.setTitle("Inception");
        request.setDescription("A thief who steals corporate secrets");
        request.setYear(2010);
        request.setGenreIds(Arrays.asList(1L, 2L));
        // Actor IDs and Director IDs are optional
        request.setActorIds(null);
        request.setDirectorIds(null);
        
        Set<ConstraintViolation<MovieRequest>> violations = validator.validate(request);
        
        assertTrue(violations.isEmpty());
    }
    
    @Test
    void multipleViolations() {
        MovieRequest request = new MovieRequest();
        request.setTitle("");  // Empty title
        request.setDescription("");  // Empty description
        request.setYear(null);  // Null year
        request.setGenreIds(Collections.emptyList());  // Empty genre IDs
        
        Set<ConstraintViolation<MovieRequest>> violations = validator.validate(request);
        
        assertEquals(4, violations.size());
    }
}
