CREATE INDEX idx_movie_title ON movie(title);
CREATE INDEX idx_movie_year ON movie(year);
CREATE INDEX idx_actor_name ON actor(name, surname);
CREATE INDEX idx_director_name ON director(name, surname);
CREATE INDEX idx_comment_movie_id ON comment(movie_id);
CREATE INDEX idx_rating_movie_id ON rating(movie_id);
CREATE INDEX idx_rating_username ON rating(username);