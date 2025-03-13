CREATE TABLE IF NOT EXISTS genre (
    id SERIAL PRIMARY KEY,
    genre VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS actor (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    surname VARCHAR(50) NOT NULL,
    birth_day DATE
);

CREATE TABLE IF NOT EXISTS director (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    surname VARCHAR(50) NOT NULL,
    birth_day DATE
);

CREATE TABLE IF NOT EXISTS movie (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    year INTEGER CHECK (year >= 1888 AND year <= 2200),
    poster_url VARCHAR(255),
    backdrop_url VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS movie_genre (
    movie_id INTEGER REFERENCES movie(id) ON DELETE CASCADE,
    genre_id INTEGER REFERENCES genre(id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, genre_id)
);

CREATE TABLE IF NOT EXISTS movie_actor (
    movie_id INTEGER REFERENCES movie(id) ON DELETE CASCADE,
    actor_id INTEGER REFERENCES actor(id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, actor_id)
);

CREATE TABLE IF NOT EXISTS movie_director (
    movie_id INTEGER REFERENCES movie(id) ON DELETE CASCADE,
    director_id INTEGER REFERENCES director(id) ON DELETE CASCADE,
    PRIMARY KEY (movie_id, director_id)
);

CREATE TABLE IF NOT EXISTS comment (
    id SERIAL PRIMARY KEY,
    comment VARCHAR(1200) NOT NULL,
    username VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP,
    movie_id INTEGER NOT NULL REFERENCES movie(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS rating (
    id SERIAL PRIMARY KEY,
    movie_id INTEGER NOT NULL REFERENCES movie(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
    username VARCHAR(50) NOT NULL,
    UNIQUE (movie_id, username)
);