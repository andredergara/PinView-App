import { Router, type IRouter } from "express";
import { db, usersTable, postsTable, followsTable, likesTable } from "@workspace/db";
import { eq, count, sql, and } from "drizzle-orm";
import { UpdateUserBody } from "@workspace/api-zod";

const router: IRouter = Router();

async function buildUserProfile(userId: string, currentUserId?: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return null;

  const [{ followersCount }] = await db
    .select({ followersCount: count() })
    .from(followsTable)
    .where(eq(followsTable.followingId, userId));

  const [{ followingCount }] = await db
    .select({ followingCount: count() })
    .from(followsTable)
    .where(eq(followsTable.followerId, userId));

  const [{ postsCount }] = await db
    .select({ postsCount: count() })
    .from(postsTable)
    .where(eq(postsTable.authorId, userId));

  let isFollowing = false;
  if (currentUserId && currentUserId !== userId) {
    const [follow] = await db
      .select()
      .from(followsTable)
      .where(and(eq(followsTable.followerId, currentUserId), eq(followsTable.followingId, userId)));
    isFollowing = !!follow;
  }

  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio ?? undefined,
    avatarUrl: user.avatarUrl ?? undefined,
    handicap: user.handicap ?? null,
    homeCourse: user.homeCourse ?? null,
    followersCount: followersCount ?? 0,
    followingCount: followingCount ?? 0,
    postsCount: postsCount ?? 0,
    isFollowing,
    createdAt: user.createdAt.toISOString(),
  };
}

async function buildUserCard(userId: string, currentUserId?: string) {
  const profile = await buildUserProfile(userId, currentUserId);
  if (!profile) return null;
  return {
    id: profile.id,
    username: profile.username,
    displayName: profile.displayName,
    avatarUrl: profile.avatarUrl,
    handicap: profile.handicap,
    homeCourse: profile.homeCourse,
    followersCount: profile.followersCount,
    isFollowing: profile.isFollowing,
  };
}

router.get("/users/:userId", async (req, res): Promise<void> => {
  const { userId } = req.params as { userId: string };
  const currentUserId = req.session?.userId;
  const profile = await buildUserProfile(userId, currentUserId);
  if (!profile) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json(profile);
});

router.patch("/users/:userId", async (req, res): Promise<void> => {
  const { userId } = req.params as { userId: string };
  const currentUserId = req.session?.userId;
  if (!currentUserId || currentUserId !== userId) {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const updates: Record<string, unknown> = {};
  if (parsed.data.displayName !== undefined) updates.displayName = parsed.data.displayName;
  if (parsed.data.bio !== undefined) updates.bio = parsed.data.bio;
  if (parsed.data.avatarUrl !== undefined) updates.avatarUrl = parsed.data.avatarUrl;
  if (parsed.data.handicap !== undefined) updates.handicap = parsed.data.handicap;
  if (parsed.data.homeCourse !== undefined) updates.homeCourse = parsed.data.homeCourse;

  const [user] = await db.update(usersTable).set(updates).where(eq(usersTable.id, userId)).returning();
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const profile = await buildUserProfile(userId, currentUserId);
  res.json(profile);
});

router.get("/users/:userId/stats", async (req, res): Promise<void> => {
  const { userId } = req.params as { userId: string };
  const [{ totalShots }] = await db
    .select({ totalShots: count() })
    .from(postsTable)
    .where(eq(postsTable.authorId, userId));

  const [{ totalLikes }] = await db
    .select({ totalLikes: count() })
    .from(likesTable)
    .where(
      sql`${likesTable.postId} IN (SELECT id FROM posts WHERE author_id = ${userId})`
    );

  const distResult = await db
    .select({ avgDistance: sql<number>`AVG(distance)`, maxDistance: sql<number>`MAX(distance)` })
    .from(postsTable)
    .where(and(eq(postsTable.authorId, userId), sql`distance IS NOT NULL`));

  const avgDistance = distResult[0]?.avgDistance ?? null;
  const longestShot = distResult[0]?.maxDistance ?? null;

  const topShotResult = await db
    .select({ shotType: postsTable.shotType, cnt: count() })
    .from(postsTable)
    .where(and(eq(postsTable.authorId, userId), sql`shot_type IS NOT NULL`))
    .groupBy(postsTable.shotType)
    .orderBy(sql`count(*) DESC`)
    .limit(1);

  const topClubResult = await db
    .select({ club: postsTable.club, cnt: count() })
    .from(postsTable)
    .where(and(eq(postsTable.authorId, userId), sql`club IS NOT NULL`))
    .groupBy(postsTable.club)
    .orderBy(sql`count(*) DESC`)
    .limit(1);

  res.json({
    totalShots: totalShots ?? 0,
    totalLikes: totalLikes ?? 0,
    avgDistance: avgDistance ? Math.round(avgDistance) : null,
    longestShot: longestShot ?? null,
    topShotType: topShotResult[0]?.shotType ?? null,
    topClub: topClubResult[0]?.club ?? null,
  });
});

router.post("/users/:userId/follow", async (req, res): Promise<void> => {
  const { userId } = req.params as { userId: string };
  const currentUserId = req.session?.userId;
  if (!currentUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  if (currentUserId === userId) {
    res.status(400).json({ error: "Cannot follow yourself" });
    return;
  }
  try {
    await db.insert(followsTable).values({ followerId: currentUserId, followingId: userId }).onConflictDoNothing();
  } catch {}
  res.json({ ok: true });
});

router.delete("/users/:userId/follow", async (req, res): Promise<void> => {
  const { userId } = req.params as { userId: string };
  const currentUserId = req.session?.userId;
  if (!currentUserId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  await db.delete(followsTable).where(
    and(eq(followsTable.followerId, currentUserId), eq(followsTable.followingId, userId))
  );
  res.json({ ok: true });
});

router.get("/users/:userId/followers", async (req, res): Promise<void> => {
  const { userId } = req.params as { userId: string };
  const currentUserId = req.session?.userId;
  const followers = await db.select().from(followsTable).where(eq(followsTable.followingId, userId));
  const cards = await Promise.all(followers.map(f => buildUserCard(f.followerId, currentUserId)));
  res.json(cards.filter(Boolean));
});

router.get("/users/:userId/following", async (req, res): Promise<void> => {
  const { userId } = req.params as { userId: string };
  const currentUserId = req.session?.userId;
  const following = await db.select().from(followsTable).where(eq(followsTable.followerId, userId));
  const cards = await Promise.all(following.map(f => buildUserCard(f.followingId, currentUserId)));
  res.json(cards.filter(Boolean));
});

router.get("/users/:userId/posts", async (req, res): Promise<void> => {
  const { userId } = req.params as { userId: string };
  const currentUserId = req.session?.userId;
  const limit = parseInt(String(req.query.limit ?? "12"), 10);

  const posts = await db
    .select()
    .from(postsTable)
    .where(eq(postsTable.authorId, userId))
    .orderBy(sql`created_at DESC`)
    .limit(limit + 1);

  const hasMore = posts.length > limit;
  const items = posts.slice(0, limit);

  const enriched = await Promise.all(items.map(p => enrichPost(p, currentUserId)));
  res.json({ posts: enriched, nextCursor: hasMore ? items[items.length - 1]?.id : null, hasMore });
});

async function enrichPost(post: { id: string; authorId: string; caption: string | null; videoUrl: string | null; thumbnailUrl: string | null; course: string | null; holeNumber: number | null; club: string | null; distance: number | null; shotShape: string | null; shotType: string | null; tags: string[]; createdAt: Date }, currentUserId?: string) {
  const [{ likesCount }] = await db.select({ likesCount: count() }).from(sql`likes`).where(sql`post_id = ${post.id}`);
  const [{ commentsCount }] = await db.select({ commentsCount: count() }).from(sql`comments`).where(sql`post_id = ${post.id}`);
  const [{ savesCount }] = await db.select({ savesCount: count() }).from(sql`saves`).where(sql`post_id = ${post.id}`);

  let isLiked = false;
  let isSaved = false;
  if (currentUserId) {
    const [like] = await db.select().from(sql`likes`).where(sql`user_id = ${currentUserId} AND post_id = ${post.id}`);
    isLiked = !!like;
    const [save] = await db.select().from(sql`saves`).where(sql`user_id = ${currentUserId} AND post_id = ${post.id}`);
    isSaved = !!save;
  }

  const author = await buildUserCard(post.authorId, currentUserId);

  return {
    id: post.id,
    author,
    caption: post.caption ?? null,
    videoUrl: post.videoUrl ?? null,
    thumbnailUrl: post.thumbnailUrl ?? null,
    course: post.course ?? null,
    holeNumber: post.holeNumber ?? null,
    club: post.club ?? null,
    distance: post.distance ?? null,
    shotShape: post.shotShape ?? null,
    shotType: post.shotType ?? null,
    tags: post.tags ?? [],
    likesCount: likesCount ?? 0,
    commentsCount: commentsCount ?? 0,
    savesCount: savesCount ?? 0,
    isLiked,
    isSaved,
    createdAt: post.createdAt.toISOString(),
  };
}

export { enrichPost, buildUserCard };
export default router;
