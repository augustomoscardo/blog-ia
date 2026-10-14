import { pool } from "../database/pool.js";

export async function findAllPosts() {
  const { rows } = await pool.query(`
		SELECT id, title, content, published_at, created_at, approved_at, rejected_at
		FROM posts
		ORDER BY created_at DESC
	`);

  return rows;
}

export async function createPost(post) {
  const { rows } = await pool.query(
    `INSERT INTO posts (
			id, title, content, published_at, created_at, approved_at, rejected_at
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, title, content, published_at, created_at, approved_at, rejected_at`,
    [
      post.id,
      post.title,
      post.content,
      post.published_at,
      post.created_at,
      post.approved_at,
      post.rejected_at,
    ],
  );

  return rows[0];
}
