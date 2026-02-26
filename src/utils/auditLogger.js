import { collection, addDoc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, serverTimestamp } from './firebaseConfig';

export const AuditEventType = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REPORT_CREATE: 'REPORT_CREATE',
  REPORT_UPDATE: 'REPORT_UPDATE',
  REPORT_DELETE: 'REPORT_DELETE',
  PROFILE_UPDATE: 'PROFILE_UPDATE',
  DATA_EXPORT: 'DATA_EXPORT',
  DATA_DELETE: 'DATA_DELETE',
};

export class AuditEvent {
  constructor({
    eventType,
    userId,
    userEmail,
    userRole,
    targetId,
    targetType,
    metadata = {},
    ipAddress = '',
    userAgent = '',
  }) {
    this.eventType = eventType;
    this.userId = userId;
    this.userEmail = userEmail;
    this.userRole = userRole;
    this.targetId = targetId;
    this.targetType = targetType;
    this.metadata = sanitizeForLog(metadata);
    this.ipAddress = ipAddress;
    this.userAgent = userAgent;
    this.timestamp = serverTimestamp();
  }

  toFirestoreObject() {
    return {
      eventType: this.eventType,
      userId: this.userId,
      userEmail: this.userEmail,
      userRole: this.userRole,
      targetId: this.targetId,
      targetType: this.targetType,
      metadata: this.metadata,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      timestamp: this.timestamp,
    };
  }
}

export function sanitizeForLog(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  const sensitiveFields = [
    'password',
    'passwordHash',
    'token',
    'accessToken',
    'refreshToken',
    'apiKey',
    'secret',
    'creditCard',
    'ssn',
    'socialSecurityNumber',
    'dateOfBirth',
    'birthDate',
    'phoneNumber',
    'phone',
    'address',
    'fullAddress',
    'emergencyContact',
  ];

  const sanitized = { ...data };

  for (const field of sensitiveFields) {
    if (field in sanitized) {
      sanitized[field] = '[REDACTED]';
    }
  }

  for (const key of Object.keys(sanitized)) {
    if (sanitized[key] && typeof sanitized[key] === 'object') {
      sanitized[key] = sanitizeForLog(sanitized[key]);
    }
  }

  return sanitized;
}

export async function logAuditEvent(event) {
  try {
    const eventData = event instanceof AuditEvent ? event.toFirestoreObject() : event;
    await addDoc(collection(db, 'audit'), eventData);
    return true;
  } catch (error) {
    console.error('Failed to log audit event:', error);
    return false;
  }
}

export async function getAuditTrail({
  userId,
  eventType,
  startDate,
  endDate,
  targetId,
  maxResults = 100,
}) {
  try {
    const conditions = [orderBy('timestamp', 'desc'), limit(maxResults)];

    if (userId) {
      conditions.unshift(where('userId', '==', userId));
    }

    if (eventType) {
      conditions.unshift(where('eventType', '==', eventType));
    }

    const q = query(collection(db, 'audit'), ...conditions);
    const snapshot = await getDocs(q);

    let results = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    if (startDate || endDate) {
      results = results.filter((doc) => {
        const docDate = doc.timestamp?.toDate?.() || new Date(doc.timestamp);
        if (startDate && docDate < startDate) return false;
        if (endDate && docDate > endDate) return false;
        return true;
      });
    }

    if (targetId) {
      results = results.filter((doc) => doc.targetId === targetId);
    }

    return results;
  } catch (error) {
    console.error('Failed to fetch audit trail:', error);
    throw error;
  }
}

export async function exportUserData(userId, userEmail) {
  const event = new AuditEvent({
    eventType: AuditEventType.DATA_EXPORT,
    userId,
    userEmail,
    targetType: 'user',
    targetId: userId,
    metadata: { action: 'user_data_export_request' },
  });

  await logAuditEvent(event);
}

export async function logUserDataDeletion(userId, userEmail) {
  const event = new AuditEvent({
    eventType: AuditEventType.DATA_DELETE,
    userId,
    userEmail,
    targetType: 'user',
    targetId: userId,
    metadata: { action: 'user_account_deletion' },
  });

  await logAuditEvent(event);
}
