# MovieStar Backend API Documentation

This document provides comprehensive information about the MovieStar API for frontend developers. The API allows you to interact with movies, actors, directors, comments, and ratings.

## Base URL

All API endpoints are prefixed with `/api`.

## Authentication

This API uses OAuth2/JWT for authentication provided by Keycloak. 
- Public endpoints can be accessed without authentication
- User endpoints require a valid JWT token
- Admin endpoints require a valid JWT token with the ADMIN role

Include the JWT token in the Authorization header:
```http
Authorization: Bearer <your-jwt-token>
```

### User Identity

The system identifies users by the `preferred_username` claim from the Keycloak JWT token, not by the token's subject (`sub`) claim which is typically a UUID. This means:

- User profiles in the database are associated with the username value from Keycloak
- All user-specific actions (comments, ratings, etc.) are linked to this username
- If changing a username in Keycloak, the user will be treated as a new user in the system

## Data Models

### Movie
```json
{
  "id": 1,
  "title": "Inception",
  "description": "A thief who steals corporate secrets...", 
  "year": 2010,
  "genres": [
    { "id": 1, "genre": "Action" },
    { "id": 2, "genre": "Sci-Fi" }
  ],
  "actors": [
    {
      "id": 1,
      "name": "Leonardo",
      "surname": "DiCaprio", 
      "birthDay": "1974-11-11",
      "about": "American actor...",
      "pictureUrl": "https://example.com/leo.jpg",
      "movieIds": [1, 2, 3]
    }
  ],
  "directors": [
    {
      "id": 1,
      "name": "Christopher",
      "surname": "Nolan",
      "birthDay": "1970-07-30",
      "about": "British-American film director...",
      "pictureUrl": "https://example.com/nolan.jpg",
      "movieIds": [1, 2]
    }
  ],
  "posterURL": "https://example.com/poster.jpg",
  "backdropURL": "https://example.com/backdrop.jpg",
  "averageRating": 8.5,
  "totalRatings": 42
}
```

### Actor
```json
{
  "id": 1,
  "name": "Leonardo",
  "surname": "DiCaprio", 
  "birthDay": "1974-11-11",
  "about": "American actor...",
  "pictureUrl": "https://example.com/leo.jpg",
  "movieIds": [1, 2, 3]
}
```

### Director
```json
{
  "id": 1,
  "name": "Christopher",
  "surname": "Nolan",
  "birthDay": "1970-07-30",
  "about": "British-American film director...",
  "pictureUrl": "https://example.com/nolan.jpg",
  "movieIds": [1, 2]
}
```

### Comment
```json
{
  "id": 1,
  "comment": "This movie was amazing!",
  "username": "john.doe",
  "createdAt": "2023-04-01T12:00:00Z",
  "updatedAt": null,
  "movieId": 1,
  "likesCount": 5,
  "dislikesCount": 2
}
```

### Rating
```json
{
  "id": 1,
  "movieId": 1,
  "rating": 9,
  "username": "john.doe"
}
```

### Genre
```json
{
  "id": 1,
  "genre": "Action"
}
```

### User
```json
{
  "username": "john.doe",
  "email": "john.doe@example.com",
  "profilePictureUrl": "https://example.com/johndoe.jpg",
  "createdAt": "2023-03-15T10:30:00Z",
  "lastLogin": "2023-04-01T14:25:00Z",
  "status": "ACTIVE"
}
```

## Endpoints

### Movies

#### Get All Movies
- **URL**: `/api/movies`
- **Method**: `GET`
- **Authentication**: Public
- **Description**: Retrieves a list of all movies
- **Response**: 200 OK
```json
[
  {
    "id": 1,
    "title": "Inception",
    "description": "A thief who steals corporate secrets...",
    "year": 2010,
    "genres": [
      { "id": 1, "genre": "Action" },
      { "id": 2, "genre": "Sci-Fi" }
    ],
    "actors": [
      {
        "id": 1,
        "name": "Leonardo",
        "surname": "DiCaprio", 
        "birthDay": "1974-11-11",
        "about": "American actor...",
        "pictureUrl": "https://example.com/leo.jpg",
        "movieIds": [1, 2, 3]
      }
    ],
    "directors": [
      {
        "id": 1,
        "name": "Christopher",
        "surname": "Nolan",
        "birthDay": "1970-07-30",
        "about": "British-American film director...",
        "pictureUrl": "https://example.com/nolan.jpg",
        "movieIds": [1, 2]
      }
    ],
    "posterURL": "https://example.com/poster.jpg",
    "backdropURL": "https://example.com/backdrop.jpg",
    "averageRating": 8.5,
    "totalRatings": 42
  }
]
```

#### Get Movie by ID
- **URL**: `/api/movies/{id}`
- **Method**: `GET`
- **Authentication**: Public
- **Description**: Retrieves a specific movie by ID
- **Parameters**: 
  - `id` (path parameter): The ID of the movie
- **Response**: 200 OK
```json
{
  "id": 1,
  "title": "Inception",
  "description": "A thief who steals corporate secrets...",
  "year": 2010,
  "genres": [
    { "id": 1, "genre": "Action" },
    { "id": 2, "genre": "Sci-Fi" }
  ],
  "actors": [
    {
      "id": 1,
      "name": "Leonardo",
      "surname": "DiCaprio", 
      "birthDay": "1974-11-11",
      "about": "American actor...",
      "pictureUrl": "https://example.com/leo.jpg",
      "movieIds": [1, 2, 3]
    }
  ],
  "directors": [
    {
      "id": 1,
      "name": "Christopher",
      "surname": "Nolan",
      "birthDay": "1970-07-30",
      "about": "British-American film director...",
      "pictureUrl": "https://example.com/nolan.jpg",
      "movieIds": [1, 2]
    }
  ],
  "posterURL": "https://example.com/poster.jpg",
  "backdropURL": "https://example.com/backdrop.jpg",
  "averageRating": 8.5,
  "totalRatings": 42
}
```

#### Search Movies
- **URL**: `/api/movies/search`
- **Method**: `GET`
- **Authentication**: Public
- **Description**: Search for movies by title, actor, or genre
- **Parameters**: 
  - `title` (query parameter): Search by movie title
  - `actor` (query parameter): Search by actor name
  - `genre` (query parameter): Search by genre name
- **Note**: Only one parameter should be provided at a time
- **Response**: 200 OK (Array of movies)

#### Get Movie Comments
- **URL**: `/api/movies/{movieId}/comments`
- **Method**: `GET`
- **Authentication**: Public
- **Description**: Get all comments for a specific movie
- **Parameters**:
  - `movieId` (path parameter): The ID of the movie
  - `sortBy` (query parameter, optional): Sort comments by "newest" (default), "oldest", "likes", "dislikes", or "rating"
- **Response**: 200 OK
```json
[
  {
    "id": 1,
    "comment": "This movie was amazing!",
    "username": "john.doe",
    "createdAt": "2023-04-01T12:00:00Z",
    "updatedAt": null,
    "movieId": 1,
    "likesCount": 5,
    "dislikesCount": 2
  }
]
```

#### Add Comment to Movie
- **URL**: `/api/movies/{movieId}/comments`
- **Method**: `POST`
- **Authentication**: Authenticated user
- **Description**: Add a new comment to a movie
- **Parameters**:
  - `movieId` (path parameter): The ID of the movie
- **Request Body**:
```json
{
  "comment": "This is an amazing movie!"
}
```
- **Response**: 201 Created

#### Like or Dislike a Comment
- **URL**: `/api/movies/comments/{commentId}/like`
- **Method**: `POST`
- **Authentication**: Authenticated user
- **Description**: Like or dislike a comment
- **Parameters**:
  - `commentId` (path parameter): The ID of the comment
- **Request Body**:
```json
{
  "isLike": true
}
```
- **Note**: Set `isLike` to true for a like, false for a dislike
- **Response**: 200 OK
```json
{
  "id": 1,
  "comment": "This movie was amazing!",
  "username": "john.doe",
  "createdAt": "2023-04-01T12:00:00Z",
  "updatedAt": null,
  "movieId": 1,
  "likesCount": 6,
  "dislikesCount": 2
}
```

#### Remove Like or Dislike from Comment
- **URL**: `/api/movies/comments/{commentId}/like`
- **Method**: `DELETE`
- **Authentication**: Authenticated user
- **Description**: Remove your like or dislike from a comment
- **Parameters**:
  - `commentId` (path parameter): The ID of the comment
- **Response**: 200 OK
```json
{
  "id": 1,
  "comment": "This movie was amazing!",
  "username": "john.doe",
  "createdAt": "2023-04-01T12:00:00Z",
  "updatedAt": null,
  "movieId": 1,
  "likesCount": 5,
  "dislikesCount": 2
}
```

#### Get Like Status for a Comment
- **URL**: `/api/movies/comments/{commentId}/like/status`
- **Method**: `GET`
- **Authentication**: Authenticated user
- **Description**: Check if the current user has liked or disliked a comment
- **Parameters**:
  - `commentId` (path parameter): The ID of the comment
- **Response**: 200 OK
```json
{
  "liked": true,
  "disliked": false
}
```

#### Update Own Comment
- **URL**: `/api/movies/comments/{commentId}`
- **Method**: `PUT`
- **Authentication**: Authenticated user
- **Description**: Update your own comment (you cannot update other users' comments)
- **Parameters**:
  - `commentId` (path parameter): The ID of the comment to update
- **Request Body**:
```json
{
  "comment": "This is my updated comment!"
}
```
- **Response**: 200 OK
```json
{
  "id": 1,
  "comment": "This is my updated comment!",
  "username": "john.doe",
  "createdAt": "2023-04-01T12:00:00Z",
  "updatedAt": "2023-04-02T09:15:00Z",
  "movieId": 1,
  "likesCount": 5,
  "dislikesCount": 2
}
```
- **Error Response**: 403 Forbidden (if trying to update someone else's comment)

#### Delete Own Comment
- **URL**: `/api/movies/comments/{commentId}`
- **Method**: `DELETE`
- **Authentication**: Authenticated user
- **Description**: Delete your own comment (you cannot delete other users' comments)
- **Parameters**:
  - `commentId` (path parameter): The ID of the comment to delete
- **Response**: 204 No Content
- **Error Response**: 403 Forbidden (if trying to delete someone else's comment)

#### Get Movie Rating
- **URL**: `/api/movies/{movieId}/ratings`
- **Method**: `GET`
- **Authentication**: Public
- **Description**: Get the average rating for a movie
- **Parameters**:
  - `movieId` (path parameter): The ID of the movie
- **Response**: 200 OK
```json
{
  "averageRating": 8.5,
  "totalRatings": 42
}
```

#### Rate Movie
- **URL**: `/api/movies/{movieId}/ratings`
- **Method**: `POST`
- **Authentication**: Authenticated user
- **Description**: Rate a movie (1-10)
- **Parameters**:
  - `movieId` (path parameter): The ID of the movie
- **Request Body**:
```json
{
  "rating": 9
}
```
- **Response**: 201 Created

#### Get User's Rating for a Movie
- **URL**: `/api/movies/{movieId}/ratings/user`
- **Method**: `GET`
- **Authentication**: Authenticated user
- **Description**: Get the current user's rating for a specific movie
- **Parameters**:
  - `movieId` (path parameter): The ID of the movie
- **Response**: 200 OK
```json
{
  "rating": 8
}
```
- **Response**: 404 Not Found (if user hasn't rated the movie)

#### Remove Rating
- **URL**: `/api/movies/{movieId}/ratings`
- **Method**: `DELETE`
- **Authentication**: Authenticated user
- **Description**: Remove the user's rating from a movie
- **Parameters**:
  - `movieId` (path parameter): The ID of the movie
- **Response**: 200 OK

### Get All User Ratings
- **URL**: `/api/movies/users/me/ratings`
- **Method**: `GET`
- **Authentication**: Authenticated user
- **Description**: Get all ratings made by the current user, including movie details
- **Response**: 200 OK
```json
[
  {
    "id": 1,
    "movieId": 1,
    "rating": 8,
    "movie": {
      "id": 1,
      "title": "Inception",
      "description": "A thief who steals corporate secrets...",
      "year": 2010,
      "genres": [
        { "id": 1, "genre": "Action" },
        { "id": 2, "genre": "Sci-Fi" }
      ],
      "posterURL": "https://example.com/poster.jpg",
      "backdropURL": "https://example.com/backdrop.jpg",
      "averageRating": 8.5,
      "totalRatings": 42
    }
  }
]
```
- **Error Response**: In case a movie is not found, that rating will still be included but with limited information:
```json
{
  "id": 1,
  "movieId": 999,
  "rating": 8,
  "error": "Movie not found"
}
```

### Actors

#### Get All Actors
- **URL**: `/api/actors`
- **Method**: `GET`
- **Authentication**: Public
- **Description**: Retrieves a list of all actors
- **Response**: 200 OK
```json
[
  {
    "id": 1,
    "name": "Leonardo",
    "surname": "DiCaprio", 
    "birthDay": "1974-11-11",
    "about": "American actor...",
    "pictureUrl": "https://example.com/leo.jpg",
    "movieIds": [1, 2, 3]
  }
]
```

#### Get Actor by ID
- **URL**: `/api/actors/{id}`
- **Method**: `GET`
- **Authentication**: Public
- **Description**: Retrieves a specific actor by ID
- **Parameters**: 
  - `id` (path parameter): The ID of the actor
- **Response**: 200 OK
```json
{
  "id": 1,
  "name": "Leonardo",
  "surname": "DiCaprio", 
  "birthDay": "1974-11-11",
  "about": "American actor...",
  "pictureUrl": "https://example.com/leo.jpg",
  "movieIds": [1, 2, 3]
}
```

#### Get Actor Biography
- **URL**: `/api/actors/{id}/about`
- **Method**: `GET`
- **Authentication**: Public
- **Description**: Retrieves just the biographical information for an actor
- **Parameters**: 
  - `id` (path parameter): The ID of the actor
- **Response**: 200 OK
```json
{
  "about": "American actor..."
}
```

#### Get Actor Picture
- **URL**: `/api/actors/{id}/picture`
- **Method**: `GET`
- **Authentication**: Public
- **Description**: Retrieves just the profile picture URL for an actor
- **Parameters**: 
  - `id` (path parameter): The ID of the actor
- **Response**: 200 OK
```json
{
  "pictureUrl": "https://example.com/leo.jpg"
}
```

#### Search Actors
- **URL**: `/api/actors/search`
- **Method**: `GET`
- **Authentication**: Public
- **Description**: Search for actors by name or surname
- **Parameters**: 
  - `query` (query parameter): Search query for name or surname
- **Response**: 200 OK (Array of actors)

#### Get Actor's Movies
- **URL**: `/api/actors/{id}/movies`
- **Method**: `GET`
- **Authentication**: Public
- **Description**: Get all movies an actor has appeared in
- **Parameters**: 
  - `id` (path parameter): The ID of the actor
- **Response**: 200 OK
```json
[
  {
    "id": 1,
    "title": "Inception",
    "description": "A thief who steals corporate secrets...",
    "year": 2010,
    "genres": [
      { "id": 1, "genre": "Action" },
      { "id": 2, "genre": "Sci-Fi" }
    ],
    "actors": [
      {
        "id": 1,
        "name": "Leonardo",
        "surname": "DiCaprio", 
        "birthDay": "1974-11-11",
        "about": "American actor...",
        "pictureUrl": "https://example.com/leo.jpg",
        "movieIds": [1, 2, 3]
      }
    ],
    "directors": [
      {
        "id": 1,
        "name": "Christopher",
        "surname": "Nolan",
        "birthDay": "1970-07-30",
        "about": "British-American film director...",
        "pictureUrl": "https://example.com/nolan.jpg",
        "movieIds": [1, 2]
      }
    ],
    "posterURL": "https://example.com/poster.jpg",
    "backdropURL": "https://example.com/backdrop.jpg",
    "averageRating": 8.5,
    "totalRatings": 42
  }
]
```

### Directors

#### Get All Directors
- **URL**: `/api/directors`
- **Method**: `GET`
- **Authentication**: Public
- **Description**: Retrieves a list of all directors
- **Response**: 200 OK
```json
[
  {
    "id": 1,
    "name": "Christopher",
    "surname": "Nolan",
    "birthDay": "1970-07-30",
    "about": "British-American film director...",
    "pictureUrl": "https://example.com/nolan.jpg",
    "movieIds": [1, 2]
  }
]
```

#### Get Director by ID
- **URL**: `/api/directors/{id}`
- **Method**: `GET`
- **Authentication**: Public
- **Description**: Retrieves a specific director by ID
- **Parameters**: 
  - `id` (path parameter): The ID of the director
- **Response**: 200 OK
```json
{
  "id": 1,
  "name": "Christopher",
  "surname": "Nolan",
  "birthDay": "1970-07-30",
  "about": "British-American film director...",
  "pictureUrl": "https://example.com/nolan.jpg",
  "movieIds": [1, 2]
}
```

#### Get Director Biography
- **URL**: `/api/directors/{id}/about`
- **Method**: `GET`
- **Authentication**: Public
- **Description**: Retrieves just the biographical information for a director
- **Parameters**: 
  - `id` (path parameter): The ID of the director
- **Response**: 200 OK
```json
{
  "about": "British-American film director..."
}
```

#### Get Director Picture
- **URL**: `/api/directors/{id}/picture`
- **Method**: `GET`
- **Authentication**: Public
- **Description**: Retrieves just the profile picture URL for a director
- **Parameters**: 
  - `id` (path parameter): The ID of the director
- **Response**: 200 OK
```json
{
  "pictureUrl": "https://example.com/nolan.jpg"
}
```

#### Search Directors
- **URL**: `/api/directors/search`
- **Method**: `GET`
- **Authentication**: Public
- **Description**: Search for directors by name or surname
- **Parameters**: 
  - `query` (query parameter): Search query for name or surname
- **Response**: 200 OK (Array of directors)

#### Get Director's Movies
- **URL**: `/api/directors/{id}/movies`
- **Method**: `GET`
- **Authentication**: Public
- **Description**: Get all movies directed by a specific director
- **Parameters**: 
  - `id` (path parameter): The ID of the director
- **Response**: 200 OK
```json
[
  {
    "id": 1,
    "title": "Inception",
    "description": "A thief who steals corporate secrets...",
    "year": 2010,
    "genres": [
      { "id": 1, "genre": "Action" },
      { "id": 2, "genre": "Sci-Fi" }
    ],
    "actors": [
      {
        "id": 1,
        "name": "Leonardo",
        "surname": "DiCaprio", 
        "birthDay": "1974-11-11",
        "about": "American actor...",
        "pictureUrl": "https://example.com/leo.jpg",
        "movieIds": [1, 2, 3]
      }
    ],
    "directors": [
      {
        "id": 1,
        "name": "Christopher",
        "surname": "Nolan",
        "birthDay": "1970-07-30",
        "about": "British-American film director...",
        "pictureUrl": "https://example.com/nolan.jpg",
        "movieIds": [1, 2]
      }
    ],
    "posterURL": "https://example.com/poster.jpg",
    "backdropURL": "https://example.com/backdrop.jpg",
    "averageRating": 8.5,
    "totalRatings": 42
  }
]
```

### Genres

#### Get All Genres
- **URL**: `/api/genres`
- **Method**: `GET`
- **Authentication**: Public
- **Description**: Retrieves a list of all genres
- **Response**: 200 OK
```json
[
  {
    "id": 1,
    "genre": "Action"
  },
  {
    "id": 2,
    "genre": "Comedy"
  }
]
```

#### Get Genre by ID
- **URL**: `/api/genres/{id}`
- **Method**: `GET`
- **Authentication**: Public
- **Description**: Retrieves a specific genre by ID
- **Parameters**: 
  - `id` (path parameter): The ID of the genre
- **Response**: 200 OK
```json
{
  "id": 1,
  "genre": "Action"
}
```

### Users

#### Get User Profile
- **URL**: `/api/users/profile`
- **Method**: `GET`
- **Authentication**: Authenticated user
- **Description**: Retrieves the profile information of the currently authenticated user
- **Response**: 200 OK
```json
{
  "username": "john.doe",
  "email": "john.doe@example.com",
  "profilePictureUrl": "https://example.com/johndoe.jpg",
  "createdAt": "2023-03-15T10:30:00Z",
  "lastLogin": "2023-04-01T14:25:00Z",
  "status": "ACTIVE"
}
```

#### Get User by Username
- **URL**: `/api/users/{username}`
- **Method**: `GET`
- **Authentication**: Public
- **Description**: Retrieves the profile information of a user by their username
- **Parameters**: 
  - `username` (path parameter): The username of the user to retrieve
- **Response**: 200 OK
```json
{
  "username": "john.doe",
  "email": "john.doe@example.com",
  "profilePictureUrl": "https://example.com/johndoe.jpg",
  "createdAt": "2023-03-15T10:30:00Z",
  "lastLogin": "2023-04-01T14:25:00Z",
  "status": "ACTIVE"
}
```
- **Response**: 404 Not Found (if user doesn't exist)

#### Get User's Comments
- **URL**: `/api/users/{username}/comments`
- **Method**: `GET`
- **Authentication**: Public
- **Description**: Get all comments made by a specific user
- **Parameters**:
  - `username` (path parameter): The username of the user whose comments to retrieve
- **Response**: 200 OK
```json
[
  {
    "id": 1,
    "comment": "This movie was amazing!",
    "username": "john.doe",
    "createdAt": "2023-04-01T12:00:00Z",
    "updatedAt": null,
    "movieId": 1,
    "likesCount": 5,
    "dislikesCount": 2
  }
]
```

#### Get User's Watchlist
- **URL**: `/api/users/{username}/watchlist`
- **Method**: `GET`
- **Authentication**: Public
- **Description**: Get another user's watchlist
- **Parameters**:
  - `username` (path parameter): The username of the user whose watchlist to retrieve
- **Response**: 200 OK (Array of movies)

#### Update User Profile Picture
- **URL**: `/api/users/profile/picture`
- **Method**: `PUT`
- **Authentication**: Authenticated user
- **Description**: Updates the user's profile picture URL
- **Request Body**:
```json
{
  "profilePictureUrl": "https://example.com/new-profile-pic.jpg"
}
```
- **Response**: 200 OK
```json
{
  "username": "john.doe",
  "email": "john.doe@example.com",
  "profilePictureUrl": "https://example.com/new-profile-pic.jpg",
  "createdAt": "2023-03-15T10:30:00Z",
  "lastLogin": "2023-04-01T14:25:00Z",
  "status": "ACTIVE"
}
```

### Watchlist

#### Get User Watchlist
- **URL**: `/api/watchlist`
- **Method**: `GET`
- **Authentication**: Authenticated user
- **Description**: Get the current user's watchlist movies
- **Response**: 200 OK
```json
[
  {
    "id": 1,
    "title": "Inception",
    "description": "A thief who steals corporate secrets...",
    "year": 2010,
    "genres": [
      { "id": 1, "genre": "Action" },
      { "id": 2, "genre": "Sci-Fi" }
    ],
    "actors": [
      {
        "id": 1,
        "name": "Leonardo",
        "surname": "DiCaprio", 
        "birthDay": "1974-11-11",
        "about": "American actor...",
        "pictureUrl": "https://example.com/leo.jpg",
        "movieIds": [1, 2, 3]
      }
    ],
    "directors": [
      {
        "id": 1,
        "name": "Christopher",
        "surname": "Nolan",
        "birthDay": "1970-07-30",
        "about": "British-American film director...",
        "pictureUrl": "https://example.com/nolan.jpg",
        "movieIds": [1, 2]
      }
    ],
    "posterURL": "https://example.com/poster.jpg",
    "backdropURL": "https://example.com/backdrop.jpg",
    "averageRating": 8.5,
    "totalRatings": 42
  }
]
```

#### Add Movie to Watchlist
- **URL**: `/api/watchlist/{movieId}`
- **Method**: `POST`
- **Authentication**: Authenticated user
- **Description**: Add a movie to the user's watchlist
- **Parameters**:
  - `movieId` (path parameter): The ID of the movie to add
- **Response**: 200 OK

#### Remove Movie from Watchlist
- **URL**: `/api/watchlist/{movieId}`
- **Method**: `DELETE`
- **Authentication**: Authenticated user
- **Description**: Remove a movie from the user's watchlist
- **Parameters**:
  - `movieId` (path parameter): The ID of the movie to remove
- **Response**: 200 OK

#### Check if Movie is in Watchlist
- **URL**: `/api/watchlist/{movieId}/status`
- **Method**: `GET`
- **Authentication**: Authenticated user
- **Description**: Check if a movie is in the user's watchlist
- **Parameters**:
  - `movieId` (path parameter): The ID of the movie to check
- **Response**: 200 OK
```json
{
  "inWatchlist": true
}
```

### Admin Endpoints

These endpoints require a user with the ADMIN role.

#### Create Movie
- **URL**: `/api/admin/movies`
- **Method**: `POST`
- **Authentication**: Admin
- **Description**: Creates a new movie
- **Request Body**:
```json
{
  "title": "Inception",
  "description": "A thief who steals corporate secrets",
  "year": 2010,
  "genreIds": [1, 2],
  "actorIds": [1],
  "directorIds": [1],
  "posterURL": "poster.jpg",
  "backdropURL": "backdrop.jpg"
}
```
- **Response**: 201 Created

#### Update Movie
- **URL**: `/api/admin/movies/{id}`
- **Method**: `PUT`
- **Authentication**: Admin
- **Description**: Updates an existing movie
- **Parameters**: 
  - `id` (path parameter): The ID of the movie to update
- **Request Body**: Same as create movie
- **Response**: 200 OK

#### Delete Movie
- **URL**: `/api/admin/movies/{id}`
- **Method**: `DELETE`
- **Authentication**: Admin
- **Description**: Deletes a movie
- **Parameters**: 
  - `id` (path parameter): The ID of the movie to delete
- **Response**: 204 No Content

#### Create Actor
- **URL**: `/api/admin/actors`
- **Method**: `POST`
- **Authentication**: Admin
- **Description**: Creates a new actor
- **Request Body**:
```json
{
  "name": "Leonardo",
  "surname": "DiCaprio",
  "birthDay": "1974-11-11",
  "about": "American actor and film producer known for his work in biopics and period films",
  "pictureUrl": "https://example.com/leonardo.jpg",
  "movieIds": [1]
}
```
- **Response**: 201 Created

#### Update Actor
- **URL**: `/api/admin/actors/{id}`
- **Method**: `PUT`
- **Authentication**: Admin
- **Description**: Updates an existing actor
- **Parameters**: 
  - `id` (path parameter): The ID of the actor to update
- **Request Body**: Same as create actor
- **Response**: 200 OK

#### Update Actor Biography
- **URL**: `/api/admin/actors/{id}/about`
- **Method**: `PUT`
- **Authentication**: Admin
- **Description**: Updates just the biographical information for an actor
- **Parameters**: 
  - `id` (path parameter): The ID of the actor
- **Request Body**:
```json
{
  "about": "Updated biographical information for the actor"
}
```
- **Response**: 200 OK

#### Update Actor Picture
- **URL**: `/api/admin/actors/{id}/picture`
- **Method**: `PUT`
- **Authentication**: Admin
- **Description**: Updates just the profile picture URL for an actor
- **Parameters**: 
  - `id` (path parameter): The ID of the actor
- **Request Body**:
```json
{
  "pictureUrl": "https://example.com/new_actor_image.jpg"
}
```
- **Response**: 200 OK

#### Delete Actor
- **URL**: `/api/admin/actors/{id}`
- **Method**: `DELETE`
- **Authentication**: Admin
- **Description**: Deletes an actor
- **Parameters**: 
  - `id` (path parameter): The ID of the actor to delete
- **Response**: 204 No Content

#### Create Director
- **URL**: `/api/admin/directors`
- **Method**: `POST`
- **Authentication**: Admin
- **Description**: Creates a new director
- **Request Body**:
```json
{
  "name": "Christopher",
  "surname": "Nolan",
  "birthDay": "1965-07-30",
  "about": "British-American film director, producer, and screenwriter known for his Hollywood blockbusters",
  "pictureUrl": "https://example.com/nolan.jpg",
  "movieIds": [1]
}
```
- **Response**: 201 Created

#### Update Director
- **URL**: `/api/admin/directors/{id}`
- **Method**: `PUT`
- **Authentication**: Admin
- **Description**: Updates an existing director
- **Parameters**: 
  - `id` (path parameter): The ID of the director to update
- **Request Body**: Same as create director
- **Response**: 200 OK

#### Update Director Biography
- **URL**: `/api/admin/directors/{id}/about`
- **Method**: `PUT`
- **Authentication**: Admin
- **Description**: Updates just the biographical information for a director
- **Parameters**: 
  - `id` (path parameter): The ID of the director
- **Request Body**:
```json
{
  "about": "Updated biographical information for the director"
}
```
- **Response**: 200 OK

#### Update Director Picture
- **URL**: `/api/admin/directors/{id}/picture`
- **Method**: `PUT`
- **Authentication**: Admin
- **Description**: Updates just the profile picture URL for a director
- **Parameters**: 
  - `id` (path parameter): The ID of the director
- **Request Body**:
```json
{
  "pictureUrl": "https://example.com/new_director_image.jpg"
}
```
- **Response**: 200 OK

#### Delete Director
- **URL**: `/api/admin/directors/{id}`
- **Method**: `DELETE`
- **Authentication**: Admin
- **Description**: Deletes a director
- **Parameters**: 
  - `id` (path parameter): The ID of the director to delete
- **Response**: 204 No Content

#### Add Director to Movie
- **URL**: `/api/admin/movies/{movieId}/directors/{directorId}`
- **Method**: `POST`
- **Authentication**: Admin
- **Description**: Adds a director to a specific movie
- **Parameters**: 
  - `movieId` (path parameter): The ID of the movie
  - `directorId` (path parameter): The ID of the director to add
- **Response**: 200 OK with the updated movie response

#### Remove Director from Movie
- **URL**: `/api/admin/movies/{movieId}/directors/{directorId}`
- **Method**: `DELETE`
- **Authentication**: Admin
- **Description**: Removes a director from a specific movie
- **Parameters**: 
  - `movieId` (path parameter): The ID of the movie
  - `directorId` (path parameter): The ID of the director to remove
- **Response**: 200 OK with the updated movie response

### Admin User Management Endpoints

These endpoints require a user with the ADMIN role.

#### Get All Users
- **URL**: `/api/admin/users`
- **Method**: `GET`
- **Authentication**: Admin
- **Description**: Retrieves a list of all users
- **Response**: 200 OK
```json
[
  {
    "username": "john.doe",
    "email": "john.doe@example.com",
    "profilePictureUrl": "https://example.com/johndoe.jpg",
    "createdAt": "2023-03-15T10:30:00Z",
    "lastLogin": "2023-04-01T14:25:00Z",
    "status": "ACTIVE"
  }
]
```

#### Ban User
- **URL**: `/api/admin/users/{username}/ban`
- **Method**: `POST`
- **Authentication**: Admin
- **Description**: Bans a user by username
- **Parameters**:
  - `username` (path parameter): The username of the user to ban
- **Response**: 200 OK
```json
{
  "username": "john.doe",
  "email": "john.doe@example.com",
  "profilePictureUrl": "https://example.com/johndoe.jpg",
  "createdAt": "2023-03-15T10:30:00Z",
  "lastLogin": "2023-04-01T14:25:00Z",
  "status": "BANNED"
}
```

#### Unban User
- **URL**: `/api/admin/users/{username}/unban`
- **Method**: `POST`
- **Authentication**: Admin
- **Description**: Unbans a user by username
- **Parameters**:
  - `username` (path parameter): The username of the user to unban
- **Response**: 200 OK
```json
{
  "username": "john.doe",
  "email": "john.doe@example.com",
  "profilePictureUrl": "https://example.com/johndoe.jpg",
  "createdAt": "2023-03-15T10:30:00Z",
  "lastLogin": "2023-04-01T14:25:00Z",
  "status": "ACTIVE"
}
```

#### Get Banned Users
- **URL**: `/api/admin/users/banned`
- **Method**: `GET`
- **Authentication**: Admin
- **Description**: Retrieves a list of all banned users
- **Response**: 200 OK (Array of user responses)

#### Get Active Users
- **URL**: `/api/admin/users/active`
- **Method**: `GET`
- **Authentication**: Admin
- **Description**: Retrieves a list of all active users
- **Response**: 200 OK (Array of user responses)

## Validation

The API implements validation for all request bodies:

### Movie Validation
- `title`: Cannot be blank, max 255 characters
- `description`: Cannot be blank
- `year`: Cannot be null
- `genreIds`: Cannot be empty, must contain at least one valid genre ID
- `actorIds`: Optional, but must be valid actor IDs
- `directorIds`: Optional, but must be valid director IDs

### Actor/Director Validation
- `name`: Cannot be empty, length between 1 and 50 characters
- `surname`: Cannot be empty, length between 1 and 50 characters
- `birthDay`: Must be a date in the past, cannot be null

### Rating Validation
- `rating`: Must be between 1 and 10

## Error Handling

The API returns standard HTTP status codes:

- `200 OK`: Request succeeded
- `201 Created`: Resource created successfully
- `204 No Content`: Request succeeded, no content returned
- `400 Bad Request`: Invalid request parameters
- `401 Unauthorized`: Authentication failed
- `403 Forbidden`: Permission denied
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

Error responses include a message:

```json
{
  "message": "Resource not found"
}
```

For validation errors, the response includes field-specific messages:

```json
{
  "title": "Title cannot be empty",
  "year": "Year must be at least 1888"
}
```

## Performance Features

### Caching

The API implements caching for frequently accessed data:

- Movies: Cache for all movies and by ID
- Ratings: Caching average ratings and rating count per movie
- Genres: Cache for all genres and by ID

Cache is automatically invalidated when related entities are modified.

## Setup and Development

### Prerequisites
- Java 17
- PostgreSQL database
- Docker (optional, for using docker-compose)

### Database Schema
The application uses the following main tables:
- `movies`: Stores movie information
- `actors`: Stores actor information
- `directors`: Stores director information
- `genres`: Stores genre information
- `ratings`: Stores user ratings for movies
- `comments`: Stores user comments for movies
- `app_user`: Stores user profiles and ban status
- Junction tables for many-to-many relationships:
  - `movie_actor`: Links movies and actors
  - `movie_director`: Links movies and directors
  - `movie_genre`: Links movies and genres

### Running with Docker
The project includes a docker-compose file that sets up:
- PostgreSQL database
- Keycloak for authentication

Run with:
```
docker-compose up -d
```

### Running the Application
```
./mvnw spring-boot:run
```

### API Testing
You can test the API using tools like:
- Postman
- cURL

## Database Changes

### Multiple Genres Support (v2.0)
Movies now support multiple genres instead of a single genre:
- Changed from `@ManyToOne` to `@ManyToMany` relationship between movies and genres
- Added `movie_genre` junction table for the many-to-many relationship
- Updated DTOs and validation to handle lists of genres

### User Management (v3.0)
- Added user profile persistence to store additional user information from Keycloak
- Implemented user ban functionality for administrators
- User records are created automatically on first login through Keycloak
- User status can be ACTIVE or BANNED

### Watchlist Feature (v4.0)
- Added watchlist functionality for users to save movies to watch later
- Implemented a new `watchlist` table with username-movie relationships
- Added endpoints for managing watchlist items 
- Added constraint to prevent duplicate entries in a user's watchlist

### Actor and Director Biography and Pictures (v5.0)
- Added biographical information ("about" field) for actors and directors
- Added profile picture URL support for actors and directors
- Created dedicated endpoints for accessing and updating these fields
- Added migration script to update the database schema

## API Changes

### Filmography Endpoints (v6.0)
- Added dedicated endpoints for retrieving a director's and actor's filmography
- `/api/directors/{id}/movies` returns all movies directed by a specific director
- `/api/actors/{id}/movies` returns all movies an actor has appeared in
- Both endpoints return full movie details including genres, poster URLs, and ratings
- These endpoints improve frontend performance by providing complete data in a single request