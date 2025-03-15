export interface Genre {
    id: number;
    genre: string;
  }
  
  export interface Actor {
    id: number;
    name: string;
    surname: string;
    birthDay: string;
    about?: string;
    pictureUrl?: string;
    movieIds: number[];
    movies?: Movie[];
  }
  
  export interface Director {
    id: number;
    name: string;
    surname: string;
    birthDay: string;
    deathDay?: string;
    about?: string;
    pictureUrl?: string;
    movieIds: number[];
    movies?: Movie[];
  }
  
  export interface Movie {
    id: number;
    title: string;
    description: string;
    year: number;
    genres: Genre[];
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
    likesCount: number;
    dislikesCount: number;
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
    profilePictureUrl?: string;
    lastLogin?: string;
    status?: string;
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
  
  export interface CreateMoviePayload {
    title: string;
    description: string;
    year: number;
    genreIds: number[];
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
  
  export interface ApiError {
    message?: string;
    [key: string]: any; 
  }
