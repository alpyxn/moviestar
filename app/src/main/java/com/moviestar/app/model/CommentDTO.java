package com.moviestar.app.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@EntityListeners(AuditingEntityListener.class)
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor
@Table(name="Comment")
public class CommentDTO {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="id")
    private Long id;

    @Column(name="comment", nullable = false)
    @Size(min = 1, max = 1200, message = "Comment must be between 1 and 1200")
    private String comment;

    @Column(name="username", nullable = false)
    @Size(min=3,max=50, message="Username must be between 3 and 50")
    private String username;

    @Column(name = "created_at", nullable = false, updatable = false)
    @CreatedDate
    private LocalDateTime createdAt;

    @Column(name="updated_at")
    @LastModifiedDate
    private LocalDateTime updatedAt;

    @Column(name="movie_id", nullable = false)
    private Long movieId;

    // New fields for likes tracking
    @Column(name="likes_count", nullable = false)
    private Integer likesCount = 0;

    @Column(name="dislikes_count", nullable = false)
    private Integer dislikesCount = 0;
}
