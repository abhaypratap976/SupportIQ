import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    userEmail: {
      type: String,
      default: ''
    },
    action: {
      type: String,
      required: true
    },
    resourceType: {
      type: String,
      required: true
    },
    resourceId: {
      type: String,
      default: ''
    },
    ip: {
      type: String,
      default: ''
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: { createdAt: true, updatedAt: false }
  }
);

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });

export const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export async function logSecurityEvent({ userId, userEmail, action, resourceType, resourceId, ip, details }) {
  try {
    await AuditLog.create({
      userId,
      userEmail,
      action,
      resourceType,
      resourceId,
      ip,
      details
    });
  } catch (err) {
    console.error('[AuditLog] Failed to record security event:', err.message);
  }
}
