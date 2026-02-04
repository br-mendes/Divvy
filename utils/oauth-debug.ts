// Debug utilities for Google OAuth troubleshooting

export class OAuthDebugger {
  static logGoogleOAuthFlow() {
    if (typeof window !== 'undefined') {
      console.group('🔍 Google OAuth Debug Info');
      
      // Current page info
      console.log('Current URL:', window.location.href);
      console.log('Origin:', window.location.origin);
      console.log('Path:', window.location.pathname);
      console.log('Search:', window.location.search);
      console.log('Hash:', window.location.hash);
      
      // URL params analysis
      const params = new URLSearchParams(window.location.search);
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      
      console.log('Search params:', Object.fromEntries(params));
      console.log('Hash params:', Object.fromEntries(hashParams));
      
      // Check for OAuth response params
      const oauthParams = ['code', 'state', 'error', 'error_description', 'access_token'];
      oauthParams.forEach(param => {
        const value = params.get(param) || hashParams.get(param);
        if (value) console.log(`OAuth ${param}:`, value);
      });
      
      // Local storage check
      console.log('LocalStorage auth data:', {
        supabaseAuth: localStorage.getItem('supabase.auth.token'),
        hasAnyAuth: Object.keys(localStorage).some(key => key.includes('auth'))
      });
      
      // Session storage check
      console.log('SessionStorage auth data:', {
        supabaseAuth: sessionStorage.getItem('supabase.auth.token')
      });
      
      console.groupEnd();
    }
  }

  static async checkSupabaseSession(supabase: any) {
    console.group('🔍 Supabase Session Check');
    
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('Session exists:', !!session);
      console.log('User email:', session?.user?.email);
      console.log('Session expires at:', session?.expires_at);
      console.log('Provider:', session?.user?.app_metadata?.provider);
      
      if (error) {
        console.error('Session error:', error);
      }
    } catch (err) {
      console.error('Session check failed:', err);
    }
    
    console.groupEnd();
  }

  static logNetworkRequests() {
    if (typeof window !== 'undefined') {
      // Override fetch to log auth-related requests
      const originalFetch = window.fetch;
      window.fetch = function(...args) {
        const [url, options] = args;
        
        if (typeof url === 'string' && (
          url.includes('auth') || 
          url.includes('supabase') ||
          url.includes('google')
        )) {
          console.log('🌐 Auth-related request:', url, options?.method);
        }
        
        return originalFetch.apply(this, args).then(response => {
          if (typeof url === 'string' && (
            url.includes('auth') || 
            url.includes('supabase') ||
            url.includes('google')
          )) {
            console.log('📬 Auth response:', url, response.status, response.statusText);
          }
          return response;
        });
      };
    }
  }
}