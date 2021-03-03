const { v4: uuid } = require("uuid");
import db from "./db";
import Post from "./Post";

const createPost = async (post: Post) => {
	if (!post.id) post.id = uuid();
	const { id, title, content } = post;

	try {
		await db.query(
			`INSERT INTO posts (id, title, content) VALUES (:id, :title, :content)`,
			{ id, title, content }
		);
		return post;
	} catch (err) {
		console.log("DB error", err);
		return null;
	}
};

export default createPost;
