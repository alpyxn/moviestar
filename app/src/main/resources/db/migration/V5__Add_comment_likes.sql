
ALTER TABLE comment ADD COLUMN likes_count INT NOT NULL DEFAULT 0;
ALTER TABLE comment ADD COLUMN dislikes_count INT NOT NULL DEFAULT 0;

CREATE TABLE comment_like (
    id BIGSERIAL PRIMARY KEY,
    comment_id BIGINT NOT NULL,
    username VARCHAR(50) NOT NULL,
    is_like BOOLEAN NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
    CONSTRAINT uk_comment_like_user_comment UNIQUE (comment_id, username),
    CONSTRAINT fk_comment_like_comment FOREIGN KEY (comment_id) REFERENCES comment(id) ON DELETE CASCADE
);

CREATE INDEX idx_comment_like_comment_id ON comment_like(comment_id);
CREATE INDEX idx_comment_like_username ON comment_like(username);
