import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { pgTable, text, uuid, numeric, timestamp, integer } from "drizzle-orm/pg-core";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  handicap: numeric("handicap"),
  homeCourse: text("home_course"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const postsTable = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  authorId: uuid("author_id").notNull(),
  caption: text("caption"),
  videoUrl: text("video_url"),
  thumbnailUrl: text("thumbnail_url"),
  course: text("course"),
  holeNumber: integer("hole_number"),
  club: text("club"),
  distance: integer("distance"),
  shotShape: text("shot_shape"),
  shotType: text("shot_type"),
  tags: text("tags").array().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const followsTable = pgTable("follows", {
  followerId: uuid("follower_id").notNull(),
  followingId: uuid("following_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

const likesTable = pgTable("likes", {
  userId: uuid("user_id").notNull(),
  postId: uuid("post_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Pre-hashed "password123" with bcrypt rounds=12
const PASSWORD_HASH = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6oK7.L/i5G";

const GOLF_IMAGES = [
  "https://images.unsplash.com/photo-1535139262971-c51845709a48?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1614272537612-7c2c9fc91e0c?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?q=80&w=1200&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1627728085739-0d0e65d55c5b?q=80&w=1200&auto=format&fit=crop",
];

async function seed() {
  console.log("Seeding database...");

  const users = await db.insert(usersTable).values([
    {
      username: "alicegolf",
      displayName: "Alice Chen",
      email: "alice@pinview.com",
      passwordHash: PASSWORD_HASH,
      handicap: "6.2",
      homeCourse: "Augusta National",
      bio: "Weekend warrior. Chasing pars since 2015.",
      avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=alice",
    },
    {
      username: "boblinks",
      displayName: "Bob Williams",
      email: "bob@pinview.com",
      passwordHash: PASSWORD_HASH,
      handicap: "14.8",
      homeCourse: "Pebble Beach",
      bio: "Big hitter. Bigger dreamer. Scratch goal by 40.",
      avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=bob",
    },
    {
      username: "sarapar",
      displayName: "Sara Johnson",
      email: "sara@pinview.com",
      passwordHash: PASSWORD_HASH,
      handicap: "2.1",
      homeCourse: "Pinehurst No. 2",
      bio: "LPGA hopeful. Every shot tells a story.",
      avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=sara",
    },
    {
      username: "tigerpro",
      displayName: "Tiger Nguyen",
      email: "tiger@pinview.com",
      passwordHash: PASSWORD_HASH,
      handicap: "0.4",
      homeCourse: "TPC Sawgrass",
      bio: "Course management is everything. Bogey-free or bust.",
      avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=tiger",
    },
  ]).onConflictDoNothing().returning();

  if (users.length === 0) {
    console.log("Already seeded. Done.");
    await pool.end();
    return;
  }

  const [alice, bob, sara, tiger] = users;

  const posts = await db.insert(postsTable).values([
    {
      authorId: alice.id,
      caption: "Pure stinger off the 7th tee. The tracer doesn't lie!",
      thumbnailUrl: GOLF_IMAGES[0],
      course: "Augusta National",
      holeNumber: 7,
      club: "3-Iron",
      distance: 215,
      shotShape: "Draw",
      shotType: "Tee Shot",
      tags: ["stinger", "ironplay", "augusta"],
    },
    {
      authorId: bob.id,
      caption: "Finally hit that 300yd drive I've been working toward. New PB!",
      thumbnailUrl: GOLF_IMAGES[1],
      course: "Pebble Beach",
      holeNumber: 18,
      club: "Driver",
      distance: 302,
      shotShape: "Straight",
      shotType: "Tee Shot",
      tags: ["longdrive", "pebblebeach", "milestone"],
    },
    {
      authorId: sara.id,
      caption: "Flop shot over the bunker, tucked pin. This one was for the books.",
      thumbnailUrl: GOLF_IMAGES[2],
      course: "Pinehurst No. 2",
      holeNumber: 9,
      club: "LW",
      distance: 38,
      shotShape: "Straight",
      shotType: "Flop",
      tags: ["flopshot", "pinehurst", "shortgame"],
    },
    {
      authorId: tiger.id,
      caption: "180 yards, tight lie, crosswind. 6-iron to 4 feet. Birdie.",
      thumbnailUrl: GOLF_IMAGES[3],
      course: "TPC Sawgrass",
      holeNumber: 17,
      club: "6-Iron",
      distance: 180,
      shotShape: "Fade",
      shotType: "Approach",
      tags: ["approach", "tpcsawgrass", "birdie", "ironplay"],
    },
    {
      authorId: alice.id,
      caption: "Par 5 eagle attempt. Came up 10 feet short but the swing felt incredible.",
      thumbnailUrl: GOLF_IMAGES[4],
      course: "Augusta National",
      holeNumber: 13,
      club: "5-Wood",
      distance: 240,
      shotShape: "Draw",
      shotType: "Approach",
      tags: ["eagle", "augusta", "par5"],
    },
    {
      authorId: bob.id,
      caption: "Bunker save of the year. Opened the face and splashed it stone dead.",
      thumbnailUrl: GOLF_IMAGES[5],
      course: "Pebble Beach",
      holeNumber: 4,
      club: "SW",
      distance: 15,
      shotShape: "Straight",
      shotType: "Bunker",
      tags: ["bunker", "shortgame", "save"],
    },
  ]).returning();

  await db.insert(followsTable).values([
    { followerId: alice.id, followingId: bob.id },
    { followerId: alice.id, followingId: sara.id },
    { followerId: bob.id, followingId: alice.id },
    { followerId: bob.id, followingId: tiger.id },
    { followerId: sara.id, followingId: alice.id },
    { followerId: sara.id, followingId: tiger.id },
    { followerId: tiger.id, followingId: sara.id },
    { followerId: tiger.id, followingId: alice.id },
  ]).onConflictDoNothing();

  const likeRows = [];
  for (const post of posts) {
    for (const u of [alice, bob, sara, tiger]) {
      if (u.id !== post.authorId) {
        likeRows.push({ userId: u.id, postId: post.id });
      }
    }
  }
  await db.insert(likesTable).values(likeRows).onConflictDoNothing();

  console.log(`Seeded ${users.length} users, ${posts.length} posts.`);
  console.log("Logins: alice@pinview.com / bob@pinview.com / sara@pinview.com / tiger@pinview.com");
  console.log("Password: password123");
  await pool.end();
}

seed().catch(async e => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
