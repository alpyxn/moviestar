package com.moviestar.app.controller;

import com.moviestar.app.model.Response.CommentResponse;
import com.moviestar.app.service.CommentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserCommentsController {

    private final CommentService commentService;

    @GetMapping("/{username}/comments")
    public ResponseEntity<List<CommentResponse>> getUserComments(@PathVariable String username) {
        List<CommentResponse> comments = commentService.getCommentsByUsername(username);
        return ResponseEntity.ok(comments);
    }
}
