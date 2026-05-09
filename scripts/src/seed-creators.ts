import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import {
  pgTable, text, uuid, real, integer, timestamp, primaryKey,
} from "drizzle-orm/pg-core";
import { eq, inArray } from "drizzle-orm";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Inline table definitions (mirrors lib/db/src/schema)
const usersTable = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  bio: text("bio"),
  avatarUrl: text("avatar_url"),
  handicap: real("handicap"),
  homeCourse: text("home_course"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
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
  tags: text("tags").array().notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

const followsTable = pgTable("follows", {
  followerId: uuid("follower_id").notNull(),
  followingId: uuid("following_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [primaryKey({ columns: [t.followerId, t.followingId] })]);

const likesTable = pgTable("likes", {
  userId: uuid("user_id").notNull(),
  postId: uuid("post_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [primaryKey({ columns: [t.userId, t.postId] })]);

const savesTable = pgTable("saves", {
  userId: uuid("user_id").notNull(),
  postId: uuid("post_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [primaryKey({ columns: [t.userId, t.postId] })]);

const commentsTable = pgTable("comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull(),
  authorId: uuid("author_id").notNull(),
  text: text("text").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Pre-hashed "password123" bcrypt rounds=12
const PASSWORD_HASH = "$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6oK7.L/i5G";

// Verified golf Unsplash images (vertical crop for mobile)
const IMGS = [
  "https://images.unsplash.com/photo-1535139262971-c51845709a48?q=80&w=600&h=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?q=80&w=600&h=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1544551763-46a013bb70d5?q=80&w=600&h=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1614272537612-7c2c9fc91e0c?q=80&w=600&h=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1593111774240-d529f12cf4bb?q=80&w=600&h=900&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1627728085739-0d0e65d55c5b?q=80&w=600&h=900&auto=format&fit=crop",
];
const img = (n: number) => IMGS[n % IMGS.length];

async function seed() {
  console.log("Seeding creator accounts...");

  // 1. Insert new creator accounts (skip on conflict so reruns are safe)
  const inserted = await db.insert(usersTable).values([
    {
      username: "stingerking",
      displayName: "Jack Stringer",
      email: "jack@pinview.com",
      passwordHash: PASSWORD_HASH,
      handicap: 1.2,
      homeCourse: "Merion Golf Club",
      bio: "Stinger or nothing. Low ball flight, lower scores.",
      avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=stingerking&backgroundColor=b6e3f4",
    },
    {
      username: "drawdoctor",
      displayName: "Marcus Reed",
      email: "marcus@pinview.com",
      passwordHash: PASSWORD_HASH,
      handicap: 3.8,
      homeCourse: "Riviera Country Club",
      bio: "Every shot has a story. Mine start with a draw.",
      avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=drawdoctor&backgroundColor=c0aede",
    },
    {
      username: "scratchlife",
      displayName: "Ryan Callahan",
      email: "ryan@pinview.com",
      passwordHash: PASSWORD_HASH,
      handicap: 0.1,
      homeCourse: "Winged Foot",
      bio: "Scratch. No shortcuts. Just reps.",
      avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=scratchlife&backgroundColor=d1d4f9",
    },
    {
      username: "golfdaily",
      displayName: "Jake Morrison",
      email: "jake@pinview.com",
      passwordHash: PASSWORD_HASH,
      handicap: 8.5,
      homeCourse: "Bethpage Black",
      bio: "18 holes every day. Rain or shine. No excuses.",
      avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=golfdaily&backgroundColor=ffdfbf",
    },
    {
      username: "leftyfade",
      displayName: "Chris Vale",
      email: "chris@pinview.com",
      passwordHash: PASSWORD_HASH,
      handicap: 5.0,
      homeCourse: "Torrey Pines South",
      bio: "Left-handed fade machine. Playing the wrong way since 1998.",
      avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=leftyfade&backgroundColor=ffd5dc",
    },
    {
      username: "weekendstick",
      displayName: "Dan Kowalski",
      email: "dan@pinview.com",
      passwordHash: PASSWORD_HASH,
      handicap: 18.2,
      homeCourse: "Oakmont CC",
      bio: "Beer cart. Friendly wagers. Sunday best.",
      avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=weekendstick&backgroundColor=c3d2e7",
    },
    {
      username: "ironqueen",
      displayName: "Maya Torres",
      email: "maya@pinview.com",
      passwordHash: PASSWORD_HASH,
      handicap: 4.3,
      homeCourse: "Shinnecock Hills",
      bio: "Ball-striker first. Putter second. LPGA Q-school 2025.",
      avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=ironqueen&backgroundColor=f9c6de",
    },
    {
      username: "lowballfrank",
      displayName: "Frank DeLuca",
      email: "frank@pinview.com",
      passwordHash: PASSWORD_HASH,
      handicap: 11.6,
      homeCourse: "Congressional CC",
      bio: "Keeping it under par on a good day. Coffee first, birdies second.",
      avatarUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=lowballfrank&backgroundColor=b9e7d3",
    },
  ]).onConflictDoNothing().returning();

  if (inserted.length === 0) {
    console.log("Creator accounts already seeded. Done.");
    await pool.end();
    return;
  }

  const byUsername = Object.fromEntries(inserted.map(u => [u.username, u]));
  const jack  = byUsername["stingerking"]!;
  const marcus = byUsername["drawdoctor"]!;
  const ryan  = byUsername["scratchlife"]!;
  const jake  = byUsername["golfdaily"]!;
  const chris = byUsername["leftyfade"]!;
  const dan   = byUsername["weekendstick"]!;
  const maya  = byUsername["ironqueen"]!;
  const frank = byUsername["lowballfrank"]!;

  const creators = [jack, marcus, ryan, jake, chris, dan, maya, frank];

  // 2. Look up existing demo accounts for cross-follow/like
  const demos = await db
    .select()
    .from(usersTable)
    .where(inArray(usersTable.username, ["alicegolf", "boblinks", "sarapar", "tigerpro"]));
  const everyone = [...creators, ...demos];

  // 3. Posts
  const posts = await db.insert(postsTable).values([
    // Jack (stingerking)
    {
      authorId: jack.id,
      caption: "Stinger off the 1st. 2-iron, zero spin, pure tracer. This is what it's all about.",
      thumbnailUrl: img(0),
      course: "Merion Golf Club",
      holeNumber: 1,
      club: "2-Iron",
      distance: 228,
      shotShape: "Straight",
      shotType: "Tee Shot",
      tags: ["stinger", "2iron", "merion", "lowball"],
    },
    {
      authorId: jack.id,
      caption: "Wind into you, tight lie — you go stinger every time. 3-iron, 210 out.",
      thumbnailUrl: img(3),
      course: "Merion Golf Club",
      holeNumber: 11,
      club: "3-Iron",
      distance: 210,
      shotShape: "Draw",
      shotType: "Tee Shot",
      tags: ["stinger", "windy", "ironplay"],
    },
    {
      authorId: jack.id,
      caption: "Range session. Working on keeping the flight down under 20 feet. Getting there.",
      thumbnailUrl: img(2),
      course: "Merion Golf Club",
      holeNumber: null,
      club: "5-Iron",
      distance: 185,
      shotShape: "Straight",
      shotType: "Range",
      tags: ["practice", "ironplay", "range"],
    },
    // Marcus (drawdoctor)
    {
      authorId: marcus.id,
      caption: "Turn it over. 7-iron, full draw, knocking on the door. Pin high, 6 feet.",
      thumbnailUrl: img(1),
      course: "Riviera Country Club",
      holeNumber: 4,
      club: "7-Iron",
      distance: 165,
      shotShape: "Draw",
      shotType: "Approach",
      tags: ["draw", "approachshot", "riviera"],
    },
    {
      authorId: marcus.id,
      caption: "Driver draw off the 14th. Caught it perfect. 295 with a slight tailwind.",
      thumbnailUrl: img(4),
      course: "Riviera Country Club",
      holeNumber: 14,
      club: "Driver",
      distance: 295,
      shotShape: "Draw",
      shotType: "Tee Shot",
      tags: ["draw", "driver", "bigshot"],
    },
    {
      authorId: marcus.id,
      caption: "Punch shot under the trees. 6-iron, half swing, landed it on the front edge. Par save.",
      thumbnailUrl: img(5),
      course: "Riviera Country Club",
      holeNumber: 7,
      club: "6-Iron",
      distance: 140,
      shotShape: "Straight",
      shotType: "Recovery",
      tags: ["recovery", "punch", "coursemgmt"],
    },
    // Ryan (scratchlife)
    {
      authorId: ryan.id,
      caption: "Zero handicap isn't a destination. It's a habit. 9-iron approach, pure contact.",
      thumbnailUrl: img(2),
      course: "Winged Foot",
      holeNumber: 10,
      club: "9-Iron",
      distance: 145,
      shotShape: "Fade",
      shotType: "Approach",
      tags: ["scratch", "ironplay", "wingedfoot"],
    },
    {
      authorId: ryan.id,
      caption: "Driver down the 18th. Chasing 300 every round. 298 today — close enough.",
      thumbnailUrl: img(0),
      course: "Winged Foot",
      holeNumber: 18,
      club: "Driver",
      distance: 298,
      shotShape: "Straight",
      shotType: "Tee Shot",
      tags: ["scratch", "driver", "wingedfoot"],
    },
    {
      authorId: ryan.id,
      caption: "Up and down from the bunker. Opened the face, took a shallow cut. Tapped in for par.",
      thumbnailUrl: img(5),
      course: "Winged Foot",
      holeNumber: 3,
      club: "SW",
      distance: 20,
      shotShape: "Straight",
      shotType: "Bunker",
      tags: ["bunker", "shortgame", "parsave"],
    },
    // Jake (golfdaily)
    {
      authorId: jake.id,
      caption: "Day 47 of 365. Bethpage Black in the rain. Still walked off smiling.",
      thumbnailUrl: img(3),
      course: "Bethpage Black",
      holeNumber: 5,
      club: "Driver",
      distance: 268,
      shotShape: "Straight",
      shotType: "Tee Shot",
      tags: ["everydaygolf", "bethpage", "grind"],
    },
    {
      authorId: jake.id,
      caption: "Par 3 over water. 6-iron, slight draw, flushed it. Only the tracer tells the truth.",
      thumbnailUrl: img(1),
      course: "Bethpage Black",
      holeNumber: 8,
      club: "6-Iron",
      distance: 178,
      shotShape: "Draw",
      shotType: "Tee Shot",
      tags: ["par3", "overwater", "bethpage"],
    },
    {
      authorId: jake.id,
      caption: "Finally broke 80 at Bethpage Black. 79. I nearly cried on the 18th green.",
      thumbnailUrl: img(4),
      course: "Bethpage Black",
      holeNumber: 18,
      club: "8-Iron",
      distance: 148,
      shotShape: "Straight",
      shotType: "Approach",
      tags: ["broke80", "milestone", "bethpage"],
    },
    // Chris (leftyfade)
    {
      authorId: chris.id,
      caption: "Lefty fade. Everyone said it can't be done. I do it every day. Driver, 285.",
      thumbnailUrl: img(0),
      course: "Torrey Pines South",
      holeNumber: 1,
      club: "Driver",
      distance: 285,
      shotShape: "Fade",
      shotType: "Tee Shot",
      tags: ["lefty", "fade", "torrey"],
    },
    {
      authorId: chris.id,
      caption: "Pacific Ocean backdrop. 5-iron, left-to-right fade, flag-hunting on the par 3.",
      thumbnailUrl: img(2),
      course: "Torrey Pines South",
      holeNumber: 3,
      club: "5-Iron",
      distance: 192,
      shotShape: "Fade",
      shotType: "Tee Shot",
      tags: ["par3", "lefty", "torrey", "ocean"],
    },
    {
      authorId: chris.id,
      caption: "Hybrid stinger. People sleep on the 3H stinger. This thing is a weapon.",
      thumbnailUrl: img(3),
      course: "Torrey Pines South",
      holeNumber: 12,
      club: "3-Hybrid",
      distance: 215,
      shotShape: "Fade",
      shotType: "Tee Shot",
      tags: ["hybrid", "stinger", "lefty"],
    },
    // Dan (weekendstick)
    {
      authorId: dan.id,
      caption: "Oakmont on a Sunday morning. Worth every dollar. Crushed this drive.",
      thumbnailUrl: img(1),
      course: "Oakmont CC",
      holeNumber: 1,
      club: "Driver",
      distance: 241,
      shotShape: "Slight Draw",
      shotType: "Tee Shot",
      tags: ["weekend", "oakmont", "sundaygolf"],
    },
    {
      authorId: dan.id,
      caption: "Chipping practice. I drop 3 strokes a round from 50 yards in. Working on it.",
      thumbnailUrl: img(5),
      course: "Oakmont CC",
      holeNumber: null,
      club: "SW",
      distance: 40,
      shotShape: "Straight",
      shotType: "Chip",
      tags: ["shortgame", "practice", "improvement"],
    },
    // Maya (ironqueen)
    {
      authorId: maya.id,
      caption: "Clean contact. 6-iron to 8 feet. That's what 10,000 reps sounds like.",
      thumbnailUrl: img(4),
      course: "Shinnecock Hills",
      holeNumber: 6,
      club: "6-Iron",
      distance: 170,
      shotShape: "Fade",
      shotType: "Approach",
      tags: ["ironplay", "ballstriking", "shinnecock"],
    },
    {
      authorId: maya.id,
      caption: "Links golf is different. Wind is the caddie. 7-iron, knockdown, pure.",
      thumbnailUrl: img(2),
      course: "Shinnecock Hills",
      holeNumber: 14,
      club: "7-Iron",
      distance: 155,
      shotShape: "Straight",
      shotType: "Knockdown",
      tags: ["links", "knockdown", "wind", "shinnecock"],
    },
    {
      authorId: maya.id,
      caption: "60-degree wedge, 80 yards, dead flag. Q-school prep starts now.",
      thumbnailUrl: img(0),
      course: "Shinnecock Hills",
      holeNumber: 9,
      club: "LW",
      distance: 80,
      shotShape: "Straight",
      shotType: "Wedge",
      tags: ["wedge", "shortgame", "lpga", "qschool"],
    },
    // Frank (lowballfrank)
    {
      authorId: frank.id,
      caption: "Congressional CC bucket list round. Shot 88. Happiest 88 of my life.",
      thumbnailUrl: img(3),
      course: "Congressional CC",
      holeNumber: 10,
      club: "Driver",
      distance: 234,
      shotShape: "Draw",
      shotType: "Tee Shot",
      tags: ["bucketlist", "congressional", "golf"],
    },
    {
      authorId: frank.id,
      caption: "Par on the last to break 90. That walk up the 18th fairway is something else.",
      thumbnailUrl: img(1),
      course: "Congressional CC",
      holeNumber: 18,
      club: "PW",
      distance: 110,
      shotShape: "Straight",
      shotType: "Approach",
      tags: ["broke90", "milestone", "congressional"],
    },
  ]).returning();

  // 4. Follow graph — creators follow each other + demo accounts
  const followPairs: { followerId: string; followingId: string }[] = [];
  // Every creator follows every other creator
  for (const a of creators) {
    for (const b of creators) {
      if (a.id !== b.id) followPairs.push({ followerId: a.id, followingId: b.id });
    }
  }
  // Every creator follows all demo accounts
  for (const c of creators) {
    for (const d of demos) {
      followPairs.push({ followerId: c.id, followingId: d.id });
    }
  }
  // Demo accounts follow all creators
  for (const d of demos) {
    for (const c of creators) {
      followPairs.push({ followerId: d.id, followingId: c.id });
    }
  }
  if (followPairs.length) {
    await db.insert(followsTable).values(followPairs).onConflictDoNothing();
  }

  // 5. Likes — each user likes posts from others (not their own)
  const likeRows: { userId: string; postId: string }[] = [];
  for (const post of posts) {
    const likers = everyone.filter(u => u.id !== post.authorId);
    // Give every post a realistic like count — all non-authors like it
    for (const liker of likers) {
      likeRows.push({ userId: liker.id, postId: post.id });
    }
  }
  if (likeRows.length) {
    await db.insert(likesTable).values(likeRows).onConflictDoNothing();
  }

  // 6. Saves — realistic subset of posts saved by various users
  const saveRows: { userId: string; postId: string }[] = [];
  const saveTargets = posts.filter((_, i) => i % 3 === 0); // every 3rd post
  for (const post of saveTargets) {
    for (const u of everyone) {
      if (u.id !== post.authorId) {
        saveRows.push({ userId: u.id, postId: post.id });
      }
    }
  }
  if (saveRows.length) {
    await db.insert(savesTable).values(saveRows).onConflictDoNothing();
  }

  // 7. Comments — authentic golf-speak
  const golfComments = [
    "Absolute rope.",
    "Pure.",
    "That tracer is unreal.",
    "What club was this?",
    "Ball flight is everything.",
    "Get in the hole.",
    "That's tournament golf right there.",
    "How is that even legal.",
    "The sound alone is 10/10.",
    "Clean contact, bro.",
    "Pinehurst would not survive you.",
    "This is why I come to this app.",
    "Shot of the week easy.",
    "Course management on point.",
    "That's a poster.",
    "Can't teach that.",
    "Unreal ball flight.",
    "What's the carry on this?",
    "Textbook.",
    "I've been trying to hit that for years.",
  ];

  const commentRows: { postId: string; authorId: string; text: string }[] = [];
  posts.forEach((post, pi) => {
    // 2-4 comments per post from random other users
    const commenters = everyone.filter(u => u.id !== post.authorId).slice(0, 3 + (pi % 2));
    commenters.forEach((user, ci) => {
      commentRows.push({
        postId: post.id,
        authorId: user.id,
        text: golfComments[(pi * 3 + ci) % golfComments.length],
      });
    });
  });

  if (commentRows.length) {
    await db.insert(commentsTable).values(commentRows);
  }

  console.log(`✓ Seeded ${inserted.length} creator accounts`);
  console.log(`✓ ${posts.length} posts`);
  console.log(`✓ ${followPairs.length} follows`);
  console.log(`✓ ${likeRows.length} likes`);
  console.log(`✓ ${saveRows.length} saves`);
  console.log(`✓ ${commentRows.length} comments`);
  console.log("Logins: jack@pinview.com / marcus@pinview.com / ryan@pinview.com / etc.");
  console.log("Password: password123");

  await pool.end();
}

seed().catch(async e => {
  console.error(e);
  await pool.end();
  process.exit(1);
});
