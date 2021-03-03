import db from "./db";

const getPostById = async (postId: string) => {
	try {
		const results = await db.query(
			`SELECT * FROM posts WHERE id = :postId`,
			{ postId }
		);
		return results.records[0];
	} catch (err) {
		console.log("DB error", err);
		return null;
	}
};

export default getPostById;
