package com.moviestar.app.validation;

import com.moviestar.app.model.Requests.RatingRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class RatingRequestValidationTest {
    
    private Validator validator;
    
    @BeforeEach
    void setUp() {
        ValidatorFactory factory = Validation.buildDefaultValidatorFactory();
        validator = factory.getValidator();
    }
    
    @Test
    void validRatingRequest_NoViolations() {
        RatingRequest request = new RatingRequest();
        request.setRating(8);
        
        Set<ConstraintViolation<RatingRequest>> violations = validator.validate(request);
        
        assertTrue(violations.isEmpty());
    }
    
    @Test
    void nullRating_ViolatesConstraint() {
        RatingRequest request = new RatingRequest();
        // Can't set primitive int to null, so use reflection or test differently
        // For testing purposes, we'll use the no-arg constructor and not set rating at all
        
        Set<ConstraintViolation<RatingRequest>> violations = validator.validate(request);
        
        assertFalse(violations.isEmpty());
        assertEquals("rating", violations.iterator().next().getPropertyPath().toString());
    }
    
    @ParameterizedTest
    @ValueSource(ints = {1, 2, 3, 4, 5, 6, 7, 8, 9, 10})
    void validRatingValues_NoViolations(int rating) {
        RatingRequest request = new RatingRequest();
        request.setRating(rating);
        
        Set<ConstraintViolation<RatingRequest>> violations = validator.validate(request);
        
        assertTrue(violations.isEmpty());
    }
    
    @ParameterizedTest
    @ValueSource(ints = {0, -1, -5, 11, 15, 100})
    void invalidRatingValues_ViolatesConstraint(int rating) {
        RatingRequest request = new RatingRequest();
        request.setRating(rating);
        
        Set<ConstraintViolation<RatingRequest>> violations = validator.validate(request);
        
        assertFalse(violations.isEmpty());
        assertEquals(1, violations.size());
        assertEquals("rating", violations.iterator().next().getPropertyPath().toString());
    }
}
