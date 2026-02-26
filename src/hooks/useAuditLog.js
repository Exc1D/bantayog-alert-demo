import { useCallback, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import { AuditEvent, AuditEventType, logAuditEvent } from '../utils/auditLogger';

export function useAuditLog() {
  const { user, userProfile } = useAuthContext();

  const getCurrentUserInfo = useCallback(() => {
    return {
      userId: user?.uid || null,
      userEmail: user?.email || null,
      userRole: userProfile?.role || null,
    };
  }, [user, userProfile]);

  const logEvent = useCallback(
    async (eventType, options = {}) => {
      const userInfo = getCurrentUserInfo();

      const event = new AuditEvent({
        eventType,
        userId: userInfo.userId,
        userEmail: userInfo.userEmail,
        userRole: userInfo.userRole,
        ...options,
      });

      return logAuditEvent(event);
    },
    [getCurrentUserInfo]
  );

  const logLogin = useCallback(
    async (metadata = {}) => {
      return logEvent(AuditEventType.LOGIN, {
        targetType: 'user',
        targetId: user?.uid,
        metadata: { ...metadata, method: 'email_password' },
      });
    },
    [logEvent, user]
  );

  const logLogout = useCallback(
    async (metadata = {}) => {
      return logEvent(AuditEventType.LOGOUT, {
        targetType: 'user',
        targetId: user?.uid,
        metadata,
      });
    },
    [logEvent, user]
  );

  const logProfileUpdate = useCallback(
    async (targetId, metadata = {}) => {
      return logEvent(AuditEventType.PROFILE_UPDATE, {
        targetType: 'user',
        targetId,
        metadata,
      });
    },
    [logEvent]
  );

  const logReportCreate = useCallback(
    async (reportId, metadata = {}) => {
      return logEvent(AuditEventType.REPORT_CREATE, {
        targetType: 'report',
        targetId: reportId,
        metadata,
      });
    },
    [logEvent]
  );

  const logReportUpdate = useCallback(
    async (reportId, metadata = {}) => {
      return logEvent(AuditEventType.REPORT_UPDATE, {
        targetType: 'report',
        targetId: reportId,
        metadata,
      });
    },
    [logEvent]
  );

  const logReportDelete = useCallback(
    async (reportId, metadata = {}) => {
      return logEvent(AuditEventType.REPORT_DELETE, {
        targetType: 'report',
        targetId: reportId,
        metadata,
      });
    },
    [logEvent]
  );

  const logDataExport = useCallback(
    async (metadata = {}) => {
      return logEvent(AuditEventType.DATA_EXPORT, {
        targetType: 'user',
        targetId: user?.uid,
        metadata,
      });
    },
    [logEvent, user]
  );

  const logDataDelete = useCallback(
    async (metadata = {}) => {
      return logEvent(AuditEventType.DATA_DELETE, {
        targetType: 'user',
        targetId: user?.uid,
        metadata,
      });
    },
    [logEvent, user]
  );

  return {
    logEvent,
    logLogin,
    logLogout,
    logProfileUpdate,
    logReportCreate,
    logReportUpdate,
    logReportDelete,
    logDataExport,
    logDataDelete,
  };
}

export function useAuditLogOnAuthChange() {
  const { user } = useAuthContext();
  const { logLogout } = useAuditLog();

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user && !user.isAnonymous) {
        logLogout({ action: 'browser_close' });
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, logLogout]);

  return null;
}
