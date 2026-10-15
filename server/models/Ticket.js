import mongoose from 'mongoose';

export const TICKET_CATEGORIES = [
  'Technical Issue',
  'Billing',
  'Account Access',
  'Feature Request',
  'General Inquiry'
];

export const TICKET_PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'];

export const TICKET_STATUSES = [
  'Open',
  'In Progress',
  'Waiting for Customer',
  'Resolved'
];

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [200, 'Subject cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: TICKET_CATEGORIES,
        message: '{VALUE} is not a valid category'
      }
    },
    priority: {
      type: String,
      required: [true, 'Priority is required'],
      enum: {
        values: TICKET_PRIORITIES,
        message: '{VALUE} is not a valid priority'
      },
      default: 'Medium'
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: TICKET_STATUSES,
        message: '{VALUE} is not a valid status'
      },
      default: 'Open'
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true
    },
    resolvedAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret.ticketId;
        ret._dbId = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Compound indexes for performant query and analytics
ticketSchema.index({ status: 1, priority: 1, createdAt: -1 });
ticketSchema.index({ customer: 1, status: 1, createdAt: -1 });
ticketSchema.index({ assignedTo: 1, status: 1 });

/**
 * Generate next sequential ticket ID (e.g. TK-1001, TK-1002...)
 */
ticketSchema.statics.generateNextTicketId = async function () {
  const lastTicket = await this.findOne({}, { ticketId: 1 }).sort({ createdAt: -1 });
  let nextNum = 1001;
  if (lastTicket && lastTicket.ticketId) {
    const match = lastTicket.ticketId.match(/TK-(\d+)/);
    if (match) {
      nextNum = parseInt(match[1], 10) + 1;
    }
  }
  // Double-check uniqueness
  let candidate = `TK-${nextNum}`;
  while (await this.exists({ ticketId: candidate })) {
    nextNum++;
    candidate = `TK-${nextNum}`;
  }
  return candidate;
};

export const Ticket = mongoose.model('Ticket', ticketSchema);
