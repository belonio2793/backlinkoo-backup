// Clean banner data without infinity icons
const cleanBanners = [
  {
    name: 'Leaderboard',
    size: '728x90',
    format: 'PNG',
    preview: 'data:image/svg+xml;charset=utf-8,<svg width="728" height="90" viewBox="0 0 728 90" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%234f79ff"/><stop offset="50%" stop-color="%237838bf"/><stop offset="100%" stop-color="%231d4ed8"/></linearGradient></defs><rect width="728" height="90" fill="url(%23bg)" rx="12"/><text x="200" y="35" fill="white" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="28" font-weight="700" text-anchor="start">Backlink</text><text x="200" y="60" fill="%23ddd" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="16" font-weight="500" text-anchor="start">Automated Link Building Platform</text><text x="550" y="45" fill="%23fbf047" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="18" font-weight="600" text-anchor="start">Start Free Trial</text></svg>'
  },
  {
    name: 'Rectangle',
    size: '300x250',
    format: 'PNG',
    preview: 'data:image/svg+xml;charset=utf-8,<svg width="300" height="250" viewBox="0 0 300 250" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e1065"/><stop offset="30%" stop-color="%233130f2"/><stop offset="70%" stop-color="%236266f7"/><stop offset="100%" stop-color="%234777f3"/></linearGradient></defs><rect width="300" height="250" fill="url(%23bg2)" rx="16"/><text x="150" y="80" fill="white" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="32" font-weight="700" text-anchor="middle">Backlink</text><text x="150" y="120" fill="%23dddfff" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="16" font-weight="500" text-anchor="middle">Automated Link Building Platform</text><text x="150" y="160" fill="%23fff700" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="14" font-weight="600" text-anchor="middle">Start Free Trial Today</text><rect x="100" y="180" width="100" height="35" fill="%23fff700" rx="8"/><text x="150" y="202" fill="%230f172a" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="14" font-weight="700" text-anchor="middle">Get Started</text></svg>'
  },
  {
    name: 'Skyscraper',
    size: '160x600',
    format: 'PNG',
    preview: 'data:image/svg+xml;charset=utf-8,<svg width="160" height="600" viewBox="0 0 160 600" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="160" height="600" fill="%232563eb"/><text x="80" y="50" fill="white" font-family="Arial" font-size="24" font-weight="bold" text-anchor="middle">Backlink</text><text x="80" y="90" fill="white" font-family="Arial" font-size="14" text-anchor="middle">Automated</text><text x="80" y="110" fill="white" font-family="Arial" font-size="14" text-anchor="middle">Link Building</text><text x="80" y="130" fill="white" font-family="Arial" font-size="14" text-anchor="middle">Platform</text><circle cx="80" cy="180" r="30" fill="%23fbf047"/><text x="80" y="187" fill="%23111827" font-family="Arial" font-size="12" font-weight="bold" text-anchor="middle">TRY</text><text x="80" y="240" fill="white" font-family="Arial" font-size="12" text-anchor="middle">• High-DA</text><text x="80" y="260" fill="white" font-family="Arial" font-size="12" text-anchor="middle">Backlinks</text><text x="80" y="290" fill="white" font-family="Arial" font-size="12" text-anchor="middle">• AI Outreach</text><text x="80" y="320" fill="white" font-family="Arial" font-size="12" text-anchor="middle">• Automation</text><rect x="20" y="450" width="120" height="35" fill="%23fbf047" rx="5"/><text x="80" y="472" fill="%23111827" font-family="Arial" font-size="12" font-weight="bold" text-anchor="middle">Start Free Trial</text></svg>'
  },
  {
    name: 'Mobile Banner',
    size: '320x50',
    format: 'PNG',
    preview: 'data:image/svg+xml;charset=utf-8,<svg width="320" height="50" viewBox="0 0 320 50" fill="none" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg4" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%230f57ff"/><stop offset="50%" stop-color="%234777f3"/><stop offset="100%" stop-color="%236666f7"/></linearGradient></defs><rect width="320" height="50" fill="url(%23bg4)" rx="8"/><text x="80" y="20" fill="white" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="16" font-weight="700" text-anchor="middle">Backlink - Automated Link Building</text><text x="80" y="37" fill="%23fff700" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="10" font-weight="600" text-anchor="middle">300% Faster Results - Try Free</text><text x="260" y="30" fill="%23fff700" font-family="-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif" font-size="14" font-weight="700" text-anchor="middle">→</text></svg>'
  }
];
