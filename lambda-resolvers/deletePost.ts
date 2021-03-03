import db from "./db";

const deletePost = async (postId: string) => {
	try {
		const result = await db.query(`DELETE FROM posts WHERE id = :postId`, {
			postId,
		});
		if (result.numberOfRecordsUpdated === 1) return postId;
		return null;
	} catch (err) {
		console.log("DB error", err);
		return null;
	}
};

export default deletePost;
