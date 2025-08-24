/**
 * Utility function to impersonate a tenant as Super Admin
 * Opens a new window with the tenant's admin portal
 * Auto-logout when the window is closed
 */
export function impersonateTenant(tenantId: string, tenantName: string) {
  // Generate impersonation session
  fetch('/api/super-admin/impersonate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ tenantId })
  })
  .then(response => response.json())
  .then(data => {
    if (data.sessionToken) {
      // Open tenant's admin portal in new window
      const impersonationWindow = window.open(
        `/admin?impersonate=${data.sessionToken}&tenant=${tenantId}`,
        `impersonate_${tenantId}`,
        'width=1200,height=800,left=100,top=100'
      );
      
      // Monitor window closure to auto-logout
      if (impersonationWindow) {
        const checkClosed = setInterval(() => {
          if (impersonationWindow.closed) {
            clearInterval(checkClosed);
            // End impersonation session
            fetch('/api/super-admin/impersonate/end', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ sessionToken: data.sessionToken })
            });
          }
        }, 1000);
      }
    } else {
      console.error('Failed to create impersonation session');
    }
  })
  .catch(error => {
    console.error('Impersonation error:', error);
  });
}