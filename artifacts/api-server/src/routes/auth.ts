import { Router, type IRouter } from "express";
import bcrypt from "bcrypt";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { RegisterBody, LoginBody } from "@workspace/api-zod";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

const router: IRouter = Router();

router.get("/auth/me", async (req, res): Promise<void> => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio ?? undefined,
    avatarUrl: user.avatarUrl ?? undefined,
    handicap: user.handicap ?? null,
    homeCourse: user.homeCourse ?? null,
    followersCount: 0,
    followingCount: 0,
    postsCount: 0,
    isFollowing: false,
    createdAt: user.createdAt.toISOString(),
  });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { username, displayName, email, password, handicap, homeCourse } = parsed.data;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const [existingUsername] = await db.select().from(usersTable).where(eq(usersTable.username, username));
  if (existingUsername) {
    res.status(409).json({ error: "Username already taken" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(usersTable)
    .values({ username, displayName, email, passwordHash, handicap: handicap ?? null, homeCourse: homeCourse ?? null })
    .returning();

  req.session.userId = user.id;
  await new Promise<void>((resolve, reject) =>
    req.session.save((err) => (err ? reject(err) : resolve())),
  );
  res.status(201).json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      handicap: user.handicap ?? null,
      homeCourse: user.homeCourse ?? null,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      isFollowing: false,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  req.session.userId = user.id;
  await new Promise<void>((resolve, reject) =>
    req.session.save((err) => (err ? reject(err) : resolve())),
  );
  res.json({
    user: {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio ?? undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      handicap: user.handicap ?? null,
      homeCourse: user.homeCourse ?? null,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      isFollowing: false,
      createdAt: user.createdAt.toISOString(),
    },
  });
});

router.post("/auth/logout", (req, res): void => {
  req.session.destroy(() => {});
  res.json({ ok: true });
});

export default router;
