'use client';

export interface ActivityLog {
  timestamp: string;
  user: string;
  activity: string;
}

export function addActivityLog(activity: string, userName?: string | null) {
  const logs: ActivityLog[] = JSON.parse(localStorage.getItem('sukabumi-activity-logs') || '[]');
  
  let user = userName;
  if (userName === undefined) { // Check for undefined to allow passing null
    const activeUserJson = sessionStorage.getItem('sukabumi-active-user');
    if (activeUserJson) {
      const activeUser = JSON.parse(activeUserJson);
      user = activeUser.fullname;
    } else {
      user = 'Sistem';
    }
  }

  const newLog: ActivityLog = {
    timestamp: new Date().toISOString(),
    user: user || 'Sistem', // Fallback to 'Sistem' if userName is null
    activity: activity,
  };

  logs.unshift(newLog);

  const MAX_LOGS = 500;
  if (logs.length > MAX_LOGS) {
    logs.pop();
  }

  localStorage.setItem('sukabumi-activity-logs', JSON.stringify(logs));
  window.dispatchEvent(new Event('storage'));
}
