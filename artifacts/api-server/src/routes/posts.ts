import { Router, type IRouter } from "express";
import { db, postsTable, likesTable, savesTable, commentsTable, notificationsTable, usersTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";
import { CreatePostBody, CreateCommentBody, UpdatePostBody } from "@workspace/api-zod";
import { enrichPost } from "./postHelpers";
import { buildUserCard } from "./users";

const router: IRouter = Router();

router.post("/posts", async (req, res): Promise<void> => {
  const currentUserId = req.session?.userId;
  if (!currentUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = CreatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [post] = await db
    .insert(postsTable)
    .values({ ...parsed.data, authorId: currentUserId, tags: parsed.data.tags ?? [] })
    .returning();
  const enriched = await enrichPost(post, currentUserId);
  res.status(201).json(enriched);
});

router.get("/posts/:postId", async (req, res): Promise<void> => {
  const { postId } = req.params as { postId: string };
  const currentUserId = req.session?.userId;
  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, postId));
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  const enriched = await enrichPost(post, currentUserId);
  res.json(enriched);
});

router.patch("/posts/:postId", async (req, res): Promise<void> => {
  const { postId } = req.params as { postId: string };
  const currentUserId = req.session?.userId;
  if (!currentUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, postId));
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  if (post.authorId !== currentUserId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const parsed = UpdatePostBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updates: Record<string, unknown> = {};
  const d = parsed.data;
  if ("caption" in d) updates.caption = d.caption;
  if ("course" in d) updates.course = d.course;
  if ("holeNumber" in d) updates.holeNumber = d.holeNumber;
  if ("club" in d) updates.club = d.club;
  if ("distance" in d) updates.distance = d.distance;
  if ("shotShape" in d) updates.shotShape = d.shotShape;
  if ("shotType" in d) updates.shotType = d.shotType;
  if ("tags" in d) updates.tags = d.tags;
  await db.update(postsTable).set(updates).where(eq(postsTable.id, postId));
  const [updated] = await db.select().from(postsTable).where(eq(postsTable.id, postId));
  const enriched = await enrichPost(updated, currentUserId);
  res.json(enriched);
});

router.delete("/posts/:postId", async (req, res): Promise<void> => {
  const { postId } = req.params as { postId: string };
  const currentUserId = req.session?.userId;
  if (!currentUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, postId));
  if (!post) {
    res.status(404).json({ error: "Post not found" });
    return;
  }
  if (post.authorId !== currentUserId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  await db.delete(postsTable).where(eq(postsTable.id, postId));
  res.json({ ok: true });
});

router.post("/posts/:postId/like", async (req, res): Promise<void> => {
  const { postId } = req.params as { postId: string };
  const currentUserId = req.session?.userId;
  if (!currentUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  await db.insert(likesTable).values({ userId: currentUserId, postId }).onConflictDoNothing();

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, postId));
  if (post && post.authorId !== currentUserId) {
    const [actor] = await db.select().from(usersTable).where(eq(usersTable.id, currentUserId));
    await db.insert(notificationsTable).values({
      userId: post.authorId,
      actorId: currentUserId,
      type: "like",
      postId,
      message: `${actor?.displayName ?? "Someone"} liked your shot`,
    }).onConflictDoNothing();
  }
  res.json({ ok: true });
});

router.delete("/posts/:postId/like", async (req, res): Promise<void> => {
  const { postId } = req.params as { postId: string };
  const currentUserId = req.session?.userId;
  if (!currentUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  await db.delete(likesTable).where(and(eq(likesTable.userId, currentUserId), eq(likesTable.postId, postId)));
  res.json({ ok: true });
});

router.post("/posts/:postId/save", async (req, res): Promise<void> => {
  const { postId } = req.params as { postId: string };
  const currentUserId = req.session?.userId;
  if (!currentUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  await db.insert(savesTable).values({ userId: currentUserId, postId }).onConflictDoNothing();
  res.json({ ok: true });
});

router.delete("/posts/:postId/save", async (req, res): Promise<void> => {
  const { postId } = req.params as { postId: string };
  const currentUserId = req.session?.userId;
  if (!currentUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  await db.delete(savesTable).where(and(eq(savesTable.userId, currentUserId), eq(savesTable.postId, postId)));
  res.json({ ok: true });
});

router.get("/posts/:postId/comments", async (req, res): Promise<void> => {
  const { postId } = req.params as { postId: string };
  const currentUserId = req.session?.userId;
  const comments = await db
    .select()
    .from(commentsTable)
    .where(eq(commentsTable.postId, postId))
    .orderBy(sql`created_at ASC`);

  const enriched = await Promise.all(comments.map(async (c) => {
    const author = await buildUserCard(c.authorId, currentUserId);
    return {
      id: c.id,
      author,
      text: c.text,
      createdAt: c.createdAt.toISOString(),
    };
  }));
  res.json(enriched);
});

router.post("/posts/:postId/comments", async (req, res): Promise<void> => {
  const { postId } = req.params as { postId: string };
  const currentUserId = req.session?.userId;
  if (!currentUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const parsed = CreateCommentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [comment] = await db
    .insert(commentsTable)
    .values({ postId, authorId: currentUserId, text: parsed.data.text })
    .returning();

  const [post] = await db.select().from(postsTable).where(eq(postsTable.id, postId));
  if (post && post.authorId !== currentUserId) {
    const [actor] = await db.select().from(usersTable).where(eq(usersTable.id, currentUserId));
    await db.insert(notificationsTable).values({
      userId: post.authorId,
      actorId: currentUserId,
      type: "comment",
      postId,
      message: `${actor?.displayName ?? "Someone"} commented on your shot`,
    }).onConflictDoNothing();
  }

  const author = await buildUserCard(currentUserId, currentUserId);
  res.status(201).json({
    id: comment.id,
    author,
    text: comment.text,
    createdAt: comment.createdAt.toISOString(),
  });
});

router.delete("/posts/:postId/comments/:commentId", async (req, res): Promise<void> => {
  const { postId, commentId } = req.params as { postId: string; commentId: string };
  const currentUserId = req.session?.userId;
  if (!currentUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [comment] = await db
    .select()
    .from(commentsTable)
    .where(and(eq(commentsTable.id, commentId), eq(commentsTable.postId, postId)));
  if (!comment) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }
  if (comment.authorId !== currentUserId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  await db.delete(commentsTable).where(eq(commentsTable.id, commentId));
  res.json({ ok: true });
});

export default router;
