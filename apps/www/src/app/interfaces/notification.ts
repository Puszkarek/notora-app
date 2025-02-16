export type NotificationType = 'info' | 'error' | 'warn' | 'success' | 'loading';

export type NotificationData = {
  readonly message: string;
  readonly type: NotificationType;
};
