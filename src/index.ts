import { serial, varchar, text, timestamp, boolean, integer, uuid, email, url } from "./fields";
import {
  oneToOne,
  oneToMany,
  manyToOne,
  manyToMany,
  belongsTo,
  hasOne,
  hasMany,
  belongsToMany,
  selfReference,
  morphTo,
} from "./relationships/yacs.relationship.builder";
import { yacs } from "./system/yacs.system";
import { YacsCascadeAction, YacsOrm } from "./types/yacs.types";

async function setupCMSWithAutoForeignKeys() {
  const { entityBuilder } = yacs({
    orm: YacsOrm.DRIZZLE,
    databaseUrl: process.env.DATABASE_URL,
  });

  // ✨ No need to manually define foreign key fields!
  const User = entityBuilder.buildEntity(
    "users",
    {
      id: serial(),
      email: email().unique().notNullable(),
      firstName: varchar(100).notNullable(),
      lastName: varchar(100).notNullable(),
      createdAt: timestamp().default(new Date()).notNullable(),
    },
    {
      // YACS will auto-generate user_id field in user_profiles
      profile: hasOne("user_profiles").foreignKey("user_id").build(),
      // YACS will auto-generate author_id field in posts
      posts: hasMany("posts").foreignKey("author_id").build(),
    }
  );

  const UserProfile = entityBuilder.buildEntity(
    "user_profiles",
    {
      id: serial(),
      // ✨ No need to manually add userId field - auto-generated!
      bio: text().nullable(),
      website: url().nullable(),
      createdAt: timestamp().default(new Date()).notNullable(),
    },
    {
      // YACS knows this should map to the auto-generated user_id field
      user: belongsTo("users").foreignKey("user_id").build(),
    }
  );

  const Post = entityBuilder.buildEntity(
    "posts",
    {
      id: serial(),
      title: varchar(200).notNullable(),
      content: text().notNullable(),
      // ✨ No need to manually add authorId or categoryId - auto-generated!
      createdAt: timestamp().default(new Date()).notNullable(),
    },
    {
      // YACS will auto-generate author_id field
      author: belongsTo("users").foreignKey("author_id").build(),
      // YACS will auto-generate category_id field
      category: belongsTo("categories").foreignKey("category_id").nullable().build(),
      // YACS will auto-create post_tags pivot table
      tags: belongsToMany("tags").through("post_tags").build(),
    }
  );

  const Category = entityBuilder.buildEntity(
    "categories",
    {
      id: serial(),
      name: varchar(100).notNullable(),
      // ✨ No need to manually add parentId - auto-generated!
      createdAt: timestamp().default(new Date()).notNullable(),
    },
    {
      // YACS will auto-generate parent_id field for self-referencing
      parent: belongsTo("categories").foreignKey("parent_id").nullable().build(),
      children: hasMany("categories").foreignKey("parent_id").build(),
      posts: hasMany("posts").foreignKey("category_id").build(),
    }
  );

  const Tag = entityBuilder.buildEntity(
    "tags",
    {
      id: serial(),
      name: varchar(50).unique().notNullable(),
      slug: varchar(50).unique().notNullable(),
      createdAt: timestamp().default(new Date()).notNullable(),
    },
    {
      // YACS will use the auto-created post_tags pivot table
      posts: belongsToMany("posts").through("post_tags").build(),
    }
  );

  // ✨ YACS will auto-generate:
  // - user_profiles.user_id (for user profile relationship)
  // - posts.author_id (for post author relationship)
  // - posts.category_id (for post category relationship)
  // - categories.parent_id (for category hierarchy)
  // - post_tags table with post_id and tag_id (for many-to-many)

  try {
    const validationResult = entityBuilder.buildRelationships();
    console.log("🎉 CMS setup complete with auto-generated foreign keys!");

    // Show the complete report
    console.log("\n" + entityBuilder.generateRelationshipReport());

    return entityBuilder;
  } catch (error) {
    console.error("💥 Setup failed:", error.message);
    throw error;
  }
}

setupCMSWithAutoForeignKeys();
