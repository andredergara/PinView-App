import { db, usersTable, postsTable, followsTable, likesTable, savesTable, blocksTable } from "@workspace/db";
import { eq, count, and, sql } from "drizzle-orm";

export async function buildUserCard(userId: string, currentUserId?: string) {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) return null;

  const [{ followersCount }] = await db
    .select({ followersCount: count() })
    .from(followsTable)
    .where(eq(followsTable.followingId, userId));

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
    avatarUrl: user.avatarUrl ?? undefined,
    handicap: user.handicap ?? null,
    homeCourse: user.homeCourse ?? null,
    followersCount: followersCount ?? 0,
    isFollowing,
  };
}

type RawPost = typeof postsTable.$inferSelect;

export async function enrichPost(post: RawPost, currentUserId?: string) {
  const [{ likesCount }] = await db.select({ likesCount: count() }).from(likesTable).where(eq(likesTable.postId, post.id));
  const [{ commentsCount }] = await db.select({ commentsCount: count() }).from(sql`comments`).where(sql`post_id = ${post.id}`);
  const [{ savesCount }] = await db.select({ savesCount: count() }).from(savesTable).where(eq(savesTable.postId, post.id));

  let isLiked = false;
  let isSaved = false;
  if (currentUserId) {
    const [like] = await db.select().from(likesTable).where(and(eq(likesTable.userId, currentUserId), eq(likesTable.postId, post.id)));
    isLiked = !!like;
    const [save] = await db.select().from(savesTable).where(and(eq(savesTable.userId, currentUserId), eq(savesTable.postId, post.id)));
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
