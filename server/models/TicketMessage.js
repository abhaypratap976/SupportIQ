import mongoose from 'mongoose';

const ticketMessageSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
      index: true
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: [true, 'Message content cannot be blank'],
      trim: true
    },
    visibility: {
      type: String,
      required: true,
      enum: ['public', 'internal'],
      default: 'public'
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

ticketMessageSchema.index({ ticket: 1, visibility: 1, createdAt: 1 });

export const TicketMessage = mongoose.model('TicketMessage', ticketMessageSchema);
