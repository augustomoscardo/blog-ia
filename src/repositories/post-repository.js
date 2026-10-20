import { pool } from "../database/pool.js";

export async function findAllPosts({ includeAll = false } = {}) {
  const { rows } = await pool.query(`
		SELECT id, title, content, published_at, created_at, approved_at, rejected_at
		FROM posts
		${includeAll ? "" : "WHERE published_at IS NOT NULL AND rejected_at IS NULL"}
		ORDER BY created_at DESC
	`);

  return rows;
}

export async function findPostById(id) {
  const { rows } = await pool.query(
    `SELECT id, title, content, published_at, created_at, approved_at, rejected_at
		 FROM posts
		 WHERE id = $1`,
    [id],
  );

  return rows[0];
}

export async function approvePost(id) {
  const { rows } = await pool.query(
    `UPDATE posts
		 SET approved_at = NOW(), published_at = NOW(), rejected_at = NULL
		 WHERE id = $1
		 RETURNING id, title, content, published_at, created_at, approved_at, rejected_at`,
    [id],
  );

  return rows[0];
}

export async function rejectPost(id) {
  const { rows } = await pool.query(
    `UPDATE posts
		 SET rejected_at = NOW(), published_at = NULL, approved_at = NULL
		 WHERE id = $1
		 RETURNING id, title, content, published_at, created_at, approved_at, rejected_at`,
    [id],
  );

  return rows[0];
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
