ALTER TABLE actor ADD COLUMN about TEXT;
ALTER TABLE actor ADD COLUMN picture_url VARCHAR(2000);

ALTER TABLE director ADD COLUMN about TEXT;
ALTER TABLE director ADD COLUMN picture_url VARCHAR(2000);

CREATE INDEX idx_actor_picture_url ON actor(picture_url);
CREATE INDEX idx_director_picture_url ON director(picture_url);
