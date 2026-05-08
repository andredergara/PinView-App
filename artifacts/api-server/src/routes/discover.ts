import { Router, type IRouter } from "express";
import { db, usersTable, postsTable } from "@workspace/db";
import { ilike, sql } from "drizzle-orm";
import { enrichPost, buildUserCard } from "./postHelpers";

const router: IRouter = Router();

router.get("/discover/search", async (req, res): Promise<void> => {
  const currentUserId = req.session?.userId;
  const q = String(req.query.q ?? "");
  const type = String(req.query.type ?? "all");

  if (!q.trim()) {
    res.json({ users: [], posts: [], courses: [] });
    return;
  }

  const pattern = `%${q}%`;

  let users: typeof usersTable.$inferSelect[] = [];
  let postList: typeof postsTable.$inferSelect[] = [];

  if (type === "all" || type === "users") {
    users = await db
      .select()
      .from(usersTable)
      .where(sql`${usersTable.username} ILIKE ${pattern} OR ${usersTable.displayName} ILIKE ${pattern}`)
      .limit(10);
  }

  if (type === "all" || type === "posts") {
    postList = await db
      .select()
      .from(postsTable)
      .where(ilike(postsTable.caption, pattern))
      .orderBy(sql`created_at DESC`)
      .limit(10);
  }

  let courses: { name: string; location: string | null; postsCount: number; thumbnailUrl: string | null }[] = [];
  if (type === "all" || type === "courses") {
    const courseRows = await db
      .select({ course: postsTable.course, count: sql<number>`count(*)` })
      .from(postsTable)
      .where(ilike(postsTable.course, pattern))
      .groupBy(postsTable.course)
      .limit(10);
    courses = courseRows
      .filter(c => c.course)
      .map(c => ({ name: c.course!, location: null, postsCount: c.count, thumbnailUrl: null }));
  }

  const userCards = await Promise.all(users.map(u => buildUserCard(u.id, currentUserId)));
  const enrichedPosts = await Promise.all(postList.map(p => enrichPost(p, currentUserId)));

  res.json({
    users: userCards.filter(Boolean),
    posts: enrichedPosts,
    courses,
  });
});

router.get("/discover/trending-creators", async (req, res): Promise<void> => {
  const currentUserId = req.session?.userId;
  const users = await db
    .select()
    .from(usersTable)
    .orderBy(sql`created_at DESC`)
    .limit(20);
  const cards = await Promise.all(users.map(u => buildUserCard(u.id, currentUserId)));
  res.json(cards.filter(Boolean));
});

router.get("/discover/trending-courses", async (req, res): Promise<void> => {
  const courses = await db
    .select({ course: postsTable.course, count: sql<number>`count(*)` })
    .from(postsTable)
    .where(sql`course IS NOT NULL`)
    .groupBy(postsTable.course)
    .orderBy(sql`count(*) DESC`)
    .limit(20);

  const result = courses.map(c => ({
    name: c.course!,
    location: null,
    postsCount: c.count,
    thumbnailUrl: null,
  }));
  res.json(result);
});

export default router;
