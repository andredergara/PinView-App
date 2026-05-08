import { Router, type IRouter } from "express";
import { db, postsTable, followsTable } from "@workspace/db";
import { eq, sql, inArray } from "drizzle-orm";
import { enrichPost } from "./users";

const router: IRouter = Router();

router.get("/feed", async (req, res): Promise<void> => {
  const currentUserId = req.session?.userId;
  const limit = parseInt(String(req.query.limit ?? "10"), 10);

  let posts;
  if (currentUserId) {
    const following = await db
      .select({ followingId: followsTable.followingId })
      .from(followsTable)
      .where(eq(followsTable.followerId, currentUserId));
    const ids = following.map(f => f.followingId);
    ids.push(currentUserId);

    posts = await db
      .select()
      .from(postsTable)
      .where(ids.length > 0 ? inArray(postsTable.authorId, ids) : sql`1=1`)
      .orderBy(sql`created_at DESC`)
      .limit(limit + 1);

    if (posts.length === 0) {
      posts = await db
        .select()
        .from(postsTable)
        .orderBy(sql`created_at DESC`)
        .limit(limit + 1);
    }
  } else {
    posts = await db
      .select()
      .from(postsTable)
      .orderBy(sql`created_at DESC`)
      .limit(limit + 1);
  }

  const hasMore = posts.length > limit;
  const items = posts.slice(0, limit);
  const enriched = await Promise.all(items.map(p => enrichPost(p, currentUserId)));
  res.json({ posts: enriched, nextCursor: hasMore ? items[items.length - 1]?.id : null, hasMore });
});

router.get("/feed/trending", async (req, res): Promise<void> => {
  const currentUserId = req.session?.userId;
  const limit = parseInt(String(req.query.limit ?? "20"), 10);
  const posts = await db
    .select()
    .from(postsTable)
    .orderBy(sql`created_at DESC`)
    .limit(limit);
  const enriched = await Promise.all(posts.map(p => enrichPost(p, currentUserId)));
  res.json(enriched);
});

export default router;
