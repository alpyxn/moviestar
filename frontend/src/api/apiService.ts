export interface Genre {
    id: number;
    genre: string;
  }
  
  export interface Actor {
    id: number;
    name: string;
    surname: string;
    birthDay: string;
    about?: string;  // Added from README
    pictureUrl?: string;  // Added from README
    movieIds: number[];
    movies?: Movie[]; // Add optional movies array for populated data
  }
  
  export interface Director {
    id: number;
    name: string;
    surname: string;
    birthDay: string;
    deathDay?: string;
    about?: string;  // Changed from biography
    pictureUrl?: string;  // Changed from profilePictureURL to match API
    movieIds: number[];
    movies?: Movie[]; // Add optional movies array for populated data
  }
  
  export interface Movie {
    id: number;
    title: string;
    description: string;
    year: number;
    genres: Genre[]; // Changed from single genre to array of genres
    actors: Actor[];
    directors: Director[];
    posterURL: string;
    backdropURL: string;
    averageRating: number;
    totalRatings: number;
  }
  
  export interface Comment {
    id: number;
    comment: string;
    username: string;
    createdAt: string;
    updatedAt: string | null;
    movieId: number;
    likesCount: number; // Added for like functionality
    dislikesCount: number; // Added for dislike functionality
  }
  
  export interface Rating {
    id: number;
    rating: number;
    username: string;
    movieId: number;
  }

  export interface User {
    id: number;
    username: string;
    email?: string;
    createdAt: string;
    updatedAt: string;
    preferences?: Record<string, any>;
    roles?: string[];
    accountNonLocked?: boolean;
    profilePictureUrl?: string;  // Add missing field from backend
    lastLogin?: string;         // Add missing field from backend
    status?: string;            // Add missing field from backend
  }

  export interface WatchlistItem {
    id: number;
    userId: number;
    movie: Movie;
    addedAt: string;
  }

  export interface WatchlistStatus {
    inWatchlist: boolean;
  }

  export interface UserRating {
    id: number;
    movieId: number;
    rating: number;
    movie?: Movie;
    error?: string;
  }
  
  // Request payload interfaces
  export interface CreateMoviePayload {
    title: string;
    description: string;
    year: number;
    genreIds: number[]; // Changed from genreId to genreIds
    actorIds: number[];
    directorIds: number[];
    posterURL: string;
    backdropURL: string;
  }
  
  export interface CreateActorDirectorPayload {
    name: string;
    surname: string;
    birthDay: string;
    about?: string;
    pictureUrl?: string;
    movieIds?: number[];
  }
  
  export interface CreateCommentPayload {
    comment: string;
  }
  
  export interface CreateRatingPayload {
    rating: number;
  }

  export interface UpdateProfilePicturePayload {
    profilePictureUrl: string;
  }

  export interface LikePayload {
    isLike: boolean;
  }

  export interface LikeStatus {
    liked: boolean;
    disliked: boolean;
  }
  
  // API Error response type
  export interface ApiError {
    message?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any; 
  }
