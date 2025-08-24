/**
 * Utility function to impersonate a tenant as Super Admin
 * Opens a new window with the tenant's admin portal
 * Auto-logout when the window is closed
 */
export function impersonateTenant(tenantId: string, tenantName: string) {
  console.log('Starting impersonation for tenant:', tenantName, tenantId);
  
  // Generate impersonation session
  fetch('/api/super-admin/impersonate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ 
      tenantId, 
      reason: `Super Admin impersonation of ${tenantName}` 
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Impersonation response:', data);
    
    if (data.sessionToken && data.url) {
      // Open tenant's admin portal in new window using the provided URL
      const impersonationWindow = window.open(
        data.url,
        `impersonate_${tenantId}`,
        'width=1200,height=800,left=100,top=100'
      );
      
      if (!impersonationWindow) {
        alert('Please allow pop-ups for this site to enable impersonation');
        return;
      }
      
      // Monitor window closure to auto-logout
      const checkClosed = setInterval(() => {
        if (impersonationWindow.closed) {
          clearInterval(checkClosed);
          console.log('Impersonation window closed, ending session');
          // End impersonation session
          fetch('/api/super-admin/impersonate/end', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ sessionToken: data.sessionToken })
          }).catch(error => {
            console.error('Error ending impersonation session:', error);
          });
        }
      }, 1000);
    } else {
      console.error('Failed to create impersonation session - invalid response:', data);
      alert('Failed to start impersonation session. Please try again.');
    }
  })
  .catch(error => {
    console.error('Impersonation error:', error);
    alert('Failed to start impersonation. Please check the console for details.');
  });
}