CREATE TABLE IF NOT EXISTS watchlist (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    movie_id BIGINT NOT NULL,
    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_watchlist_user_movie UNIQUE (username, movie_id),
    CONSTRAINT fk_watchlist_movie FOREIGN KEY (movie_id) REFERENCES movie(id) ON DELETE CASCADE
);

-- Create an index for faster lookups by username
CREATE INDEX idx_watchlist_username ON watchlist(username);
