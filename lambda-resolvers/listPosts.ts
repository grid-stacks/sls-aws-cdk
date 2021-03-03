import db from "./db";

const listPosts = async () => {
	try {
		const result = await db.query("SELECT * FROM posts");
		return result;
	} catch (err) {
		console.log("DB error", err);
		return null;
	}
};

export default listPosts;
