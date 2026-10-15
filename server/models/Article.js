import mongoose from 'mongoose';

const articleSchema = new mongoose.Schema(
  {
    articleId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Article title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    content: {
      type: String,
      required: [true, 'Article content cannot be empty'],
      trim: true
    },
    summary: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true
    },
    tags: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['published', 'draft', 'archived'],
      default: 'published',
      index: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false
    },
    authorName: {
      type: String,
      default: 'Admin'
    },
    helpfulCount: {
      type: Number,
      default: 0
    },
    voters: {
      type: [String],
      default: []
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret.articleId;
        ret._dbId = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.voters; // Do not leak voter IPs/IDs
        return ret;
      }
    }
  }
);

// Text index for search
articleSchema.index({ title: 'text', content: 'text', tags: 'text' });
articleSchema.index({ status: 1, category: 1, createdAt: -1 });

/**
 * Generate sequential article ID (e.g. KB-101, KB-102...)
 */
articleSchema.statics.generateNextArticleId = async function () {
  const lastArticle = await this.findOne({}, { articleId: 1 }).sort({ createdAt: -1 });
  let nextNum = 101;
  if (lastArticle && lastArticle.articleId) {
    const match = lastArticle.articleId.match(/KB-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }
  let candidate = `KB-${nextNum}`;
  while (await this.exists({ articleId: candidate })) {
    nextNum++;
    candidate = `KB-${nextNum}`;
  }
  return candidate;
};

/**
 * Helper to slugify a title safely
 */
export function slugifyTitle(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const Article = mongoose.model('Article', articleSchema);
