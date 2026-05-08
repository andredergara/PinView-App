import { Router, type IRouter } from "express";
import { db, notificationsTable, postsTable } from "@workspace/db";
import { eq, sql, count } from "drizzle-orm";
import { buildUserCard, enrichPost } from "./users";

const router: IRouter = Router();

router.get("/notifications", async (req, res): Promise<void> => {
  const currentUserId = req.session?.userId;
  if (!currentUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const limit = parseInt(String(req.query.limit ?? "20"), 10);

  const notifications = await db
    .select()
    .from(notificationsTable)
    .where(eq(notificationsTable.userId, currentUserId))
    .orderBy(sql`created_at DESC`)
    .limit(limit + 1);

  const hasMore = notifications.length > limit;
  const items = notifications.slice(0, limit);

  const enriched = await Promise.all(items.map(async (n) => {
    const actor = await buildUserCard(n.actorId, currentUserId);
    let post = null;
    if (n.postId) {
      const [p] = await db.select().from(postsTable).where(eq(postsTable.id, n.postId));
      if (p) post = await enrichPost(p, currentUserId);
    }
    return {
      id: n.id,
      type: n.type,
      actor,
      post,
      message: n.message,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
    };
  }));

  res.json({
    notifications: enriched,
    nextCursor: hasMore ? items[items.length - 1]?.id : null,
    hasMore,
  });
});

router.get("/notifications/unread-count", async (req, res): Promise<void> => {
  const currentUserId = req.session?.userId;
  if (!currentUserId) {
    res.json({ count: 0 });
    return;
  }
  const [{ cnt }] = await db
    .select({ cnt: count() })
    .from(notificationsTable)
    .where(sql`user_id = ${currentUserId} AND is_read = false`);
  res.json({ count: cnt ?? 0 });
});

router.post("/notifications/mark-read", async (req, res): Promise<void> => {
  const currentUserId = req.session?.userId;
  if (!currentUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  await db
    .update(notificationsTable)
    .set({ isRead: true })
    .where(eq(notificationsTable.userId, currentUserId));
  res.json({ ok: true });
});

export default router;
