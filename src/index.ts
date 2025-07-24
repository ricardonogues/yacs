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

const { entityBuilder } = yacs({
  orm: YacsOrm.DRIZZLE, // Specify the ORM to use
  databaseUrl: process.env.DATABASE_URL, // Database connection URL
});

// Define entities with relationships
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
    // User relationships
    profile: hasOne("user_profiles").foreignKey("user_id").onDelete(YacsCascadeAction.CASCADE).build(),
    posts: hasMany("posts").foreignKey("author_id").build(),
    comments: hasMany("comments").foreignKey("author_id").build(),
    roles: belongsToMany("roles").through("user_roles").build(),
  }
);

const UserProfile = entityBuilder.buildEntity(
  "user_profiles",
  {
    id: serial(),
    userId: integer().unique().notNullable(),
    bio: text().nullable(),
    website: url().nullable(),
    avatar: varchar(255).nullable(),
    createdAt: timestamp().default(new Date()).notNullable(),
  },
  {
    // Profile relationships
    user: belongsTo("users").foreignKey("user_id").onDelete(YacsCascadeAction.CASCADE).build(),
  }
);

const Post = entityBuilder.buildEntity(
  "posts",
  {
    id: serial(),
    title: varchar(200).notNullable(),
    slug: varchar(200).unique().notNullable(),
    content: text().notNullable(),
    authorId: integer().notNullable(),
    categoryId: integer().nullable(),
    isPublished: boolean().default(false),
    publishedAt: timestamp().nullable(),
    createdAt: timestamp().default(new Date()).notNullable(),
  },
  {
    // Post relationships
    author: belongsTo("users").foreignKey("author_id").onDelete(YacsCascadeAction.CASCADE).build(),
    category: belongsTo("categories").foreignKey("category_id").nullable().build(),
    comments: hasMany("comments").foreignKey("post_id").build(),
    tags: belongsToMany("tags").through("post_tags").build(),
    media: morphTo(["images", "videos", "documents"]).polymorphicType("attachable_type").build(),
  }
);

const Category = entityBuilder.buildEntity(
  "categories",
  {
    id: serial(),
    name: varchar(100).notNullable(),
    slug: varchar(100).unique().notNullable(),
    parentId: integer().nullable(),
    sortOrder: integer().default(0),
    createdAt: timestamp().default(new Date()).notNullable(),
  },
  {
    // Category relationships (self-referencing)
    parent: belongsTo("categories").foreignKey("parent_id").nullable().build(),
    children: hasMany("categories").foreignKey("parent_id").build(),
    posts: hasMany("posts").foreignKey("category_id").build(),
  }
);

const Comment = entityBuilder.buildEntity(
  "comments",
  {
    id: serial(),
    postId: integer().notNullable(),
    authorId: integer().nullable(),
    content: text().notNullable(),
    parentId: integer().nullable(), // For nested comments
    isApproved: boolean().default(false),
    createdAt: timestamp().default(new Date()).notNullable(),
  },
  {
    // Comment relationships
    post: belongsTo("posts").foreignKey("post_id").onDelete(YacsCascadeAction.CASCADE).build(),
    author: belongsTo("users").foreignKey("author_id").nullable().build(),
    parent: belongsTo("comments").foreignKey("parent_id").nullable().build(), // Self-referencing
    replies: hasMany("comments").foreignKey("parent_id").build(),
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
    // Tag relationships
    posts: belongsToMany("posts").through("post_tags").build(),
  }
);

// Many-to-many pivot table
const PostTag = entityBuilder.buildEntity(
  "post_tags",
  {
    id: serial(),
    postId: integer().notNullable(),
    tagId: integer().notNullable(),
    createdAt: timestamp().default(new Date()).notNullable(),
  },
  {
    // Pivot relationships
    post: belongsTo("posts").foreignKey("post_id").onDelete(YacsCascadeAction.CASCADE).build(),
    tag: belongsTo("tags").foreignKey("tag_id").onDelete(YacsCascadeAction.CASCADE).build(),
  }
);

// Build all relationships after entities are defined
entityBuilder.buildRelationships();
