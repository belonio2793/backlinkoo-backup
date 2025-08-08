// Advanced Asset Generator for High-Quality Creative Assets

export interface AssetConfig {
  name: string;
  width: number;
  height: number;
  format: 'PNG' | 'JPG' | 'SVG';
  type: 'display' | 'social' | 'brand';
}

export class AssetGenerator {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
  }

  async generateLeaderboardBanner(): Promise<string> {
    const width = 728;
    const height = 90;
    this.setupCanvas(width, height);

    // Create stunning gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#4f46e5');
    gradient.addColorStop(0.3, '#7c3aed');
    gradient.addColorStop(0.7, '#ec4899');
    gradient.addColorStop(1, '#3b82f6');
    
    this.ctx.fillStyle = gradient;
    this.fillRoundedRect(0, 0, width, height, 12);

    // Add animated shimmer effect
    const shimmer = this.ctx.createLinearGradient(0, 0, width, 0);
    shimmer.addColorStop(0, 'rgba(255,255,255,0)');
    shimmer.addColorStop(0.5, 'rgba(255,255,255,0.3)');
    shimmer.addColorStop(1, 'rgba(255,255,255,0)');
    
    this.ctx.fillStyle = shimmer;
    this.fillRoundedRect(0, 0, width, height, 12);

    // Add glowing dots
    this.addGlowingDots([
      { x: 100, y: 20, radius: 2, color: '#fef08a' },
      { x: 650, y: 25, radius: 3, color: '#c084fc' },
      { x: 220, y: 70, radius: 2, color: '#60a5fa' }
    ]);

    // Add logo circle with gradient
    const logoGradient = this.ctx.createRadialGradient(60, 45, 0, 60, 45, 25);
    logoGradient.addColorStop(0, '#fef08a');
    logoGradient.addColorStop(1, '#f59e0b');
    
    this.ctx.fillStyle = logoGradient;
    this.ctx.beginPath();
    this.ctx.arc(60, 45, 22, 0, Math.PI * 2);
    this.ctx.fill();

    // Add glow effect around logo
    this.ctx.shadowColor = '#f59e0b';
    this.ctx.shadowBlur = 15;
    this.ctx.beginPath();
    this.ctx.arc(60, 45, 22, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // Add infinity symbol
    this.ctx.fillStyle = '#0f172a';
    this.ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('∞', 60, 53);

    // Add main text with glow
    this.ctx.shadowColor = 'rgba(255,255,255,0.8)';
    this.ctx.shadowBlur = 8;
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Backlink ∞', 100, 37);
    this.ctx.shadowBlur = 0;

    this.ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillStyle = '#e0e7ff';
    this.ctx.fillText('Revolutionary AI Link Building & SEO Growth', 100, 57);

    // Add benefits section
    this.ctx.fillStyle = '#fef08a';
    this.ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('🚀 500% ROI Guaranteed', 364, 32);

    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('High-DA Links • AI Powered • 24h Results', 364, 52);

    // Add premium CTA button with gradient
    const ctaGradient = this.ctx.createLinearGradient(540, 20, 700, 70);
    ctaGradient.addColorStop(0, '#fef08a');
    ctaGradient.addColorStop(0.5, '#f59e0b');
    ctaGradient.addColorStop(1, '#ea580c');
    
    this.ctx.fillStyle = ctaGradient;
    this.fillRoundedRect(540, 20, 160, 50, 25);

    // Add CTA button glow
    this.ctx.shadowColor = '#f59e0b';
    this.ctx.shadowBlur = 10;
    this.strokeRoundedRect(540, 20, 160, 50, 25);
    this.ctx.shadowBlur = 0;

    this.ctx.fillStyle = '#0f172a';
    this.ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('START FREE TRIAL', 620, 42);
    this.ctx.fillText('→', 620, 57);

    return this.canvas.toDataURL('image/png');
  }

  async generateRectangleBanner(): Promise<string> {
    const width = 300;
    const height = 250;
    this.setupCanvas(width, height);

    // Create dynamic background gradient
    const gradient = this.ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1e1065');
    gradient.addColorStop(0.3, '#3730a3');
    gradient.addColorStop(0.7, '#7c3aed');
    gradient.addColorStop(1, '#a855f7');
    
    this.ctx.fillStyle = gradient;
    this.fillRoundedRect(0, 0, width, height, 16);

    // Add radial glow effects
    const glow1 = this.ctx.createRadialGradient(150, 60, 0, 150, 60, 100);
    glow1.addColorStop(0, 'rgba(252,211,77,0.4)');
    glow1.addColorStop(1, 'rgba(252,211,77,0)');
    
    this.ctx.fillStyle = glow1;
    this.ctx.fillRect(0, 0, width, height);

    const glow2 = this.ctx.createRadialGradient(80, 180, 0, 80, 180, 80);
    glow2.addColorStop(0, 'rgba(139,92,246,0.3)');
    glow2.addColorStop(1, 'rgba(139,92,246,0)');
    
    this.ctx.fillStyle = glow2;
    this.ctx.fillRect(0, 0, width, height);

    // Add floating particles
    this.addGlowingDots([
      { x: 40, y: 40, radius: 3, color: '#fef08a' },
      { x: 260, y: 50, radius: 4, color: '#c084fc' },
      { x: 50, y: 200, radius: 3, color: '#60a5fa' },
      { x: 250, y: 180, radius: 2, color: '#fbbf24' }
    ]);

    // Add premium logo with multiple gradients
    const logoGradient = this.ctx.createRadialGradient(150, 55, 0, 150, 55, 35);
    logoGradient.addColorStop(0, '#fef08a');
    logoGradient.addColorStop(0.7, '#f59e0b');
    logoGradient.addColorStop(1, '#ea580c');
    
    this.ctx.fillStyle = logoGradient;
    this.ctx.beginPath();
    this.ctx.arc(150, 55, 32, 0, Math.PI * 2);
    this.ctx.fill();

    // Add logo glow
    this.ctx.shadowColor = '#f59e0b';
    this.ctx.shadowBlur = 20;
    this.ctx.beginPath();
    this.ctx.arc(150, 55, 32, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // Add infinity symbol
    this.ctx.fillStyle = '#0f172a';
    this.ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('∞', 150, 66);

    // Add main text with glow effects
    this.ctx.shadowColor = 'rgba(255,255,255,0.8)';
    this.ctx.shadowBlur = 10;
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('Backlink ∞', 150, 115);
    this.ctx.shadowBlur = 0;

    this.ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillStyle = '#e0e7ff';
    this.ctx.fillText('The Ultimate AI-Powered', 150, 140);
    this.ctx.fillText('Link Building Platform', 150, 160);

    // Add animated benefit badge
    const badgeGradient = this.ctx.createLinearGradient(75, 175, 225, 190);
    badgeGradient.addColorStop(0, '#fef08a');
    badgeGradient.addColorStop(1, '#f59e0b');
    
    this.ctx.fillStyle = badgeGradient;
    this.fillRoundedRect(75, 175, 150, 25, 12);

    this.ctx.fillStyle = '#0f172a';
    this.ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('⚡ 1000x Faster Than Manual', 150, 192);

    // Add premium CTA with enhanced styling
    const ctaGradient = this.ctx.createLinearGradient(60, 210, 240, 240);
    ctaGradient.addColorStop(0, '#fef08a');
    ctaGradient.addColorStop(0.5, '#f59e0b');
    ctaGradient.addColorStop(1, '#ea580c');
    
    this.ctx.fillStyle = ctaGradient;
    this.fillRoundedRect(60, 210, 180, 30, 15);

    this.ctx.fillStyle = '#0f172a';
    this.ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('GET INSTANT ACCESS', 150, 230);

    return this.canvas.toDataURL('image/png');
  }

  async generateSkyscraperBanner(): Promise<string> {
    const width = 160;
    const height = 600;
    this.setupCanvas(width, height);

    // Create vertical gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#1e1065');
    gradient.addColorStop(0.2, '#3730a3');
    gradient.addColorStop(0.5, '#7c3aed');
    gradient.addColorStop(0.8, '#a855f7');
    gradient.addColorStop(1, '#ec4899');
    
    this.ctx.fillStyle = gradient;
    this.fillRoundedRect(0, 0, width, height, 12);

    // Add top accent bar
    const accentGradient = this.ctx.createLinearGradient(0, 0, width, 0);
    accentGradient.addColorStop(0, '#fef08a');
    accentGradient.addColorStop(1, '#f59e0b');
    
    this.ctx.fillStyle = accentGradient;
    this.fillRoundedRect(8, 8, width - 16, 8, 4);

    // Add floating particles throughout
    this.addGlowingDots([
      { x: 30, y: 80, radius: 2, color: '#fef08a' },
      { x: 130, y: 150, radius: 3, color: '#c084fc' },
      { x: 40, y: 250, radius: 2, color: '#60a5fa' },
      { x: 120, y: 350, radius: 3, color: '#fbbf24' },
      { x: 50, y: 450, radius: 2, color: '#c084fc' },
      { x: 100, y: 520, radius: 3, color: '#fef08a' }
    ]);

    // Add logo at top
    const logoGradient = this.ctx.createRadialGradient(80, 70, 0, 80, 70, 25);
    logoGradient.addColorStop(0, '#fef08a');
    logoGradient.addColorStop(1, '#f59e0b');
    
    this.ctx.fillStyle = logoGradient;
    this.ctx.beginPath();
    this.ctx.arc(80, 70, 20, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#0f172a';
    this.ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('∞', 80, 78);

    // Add main title
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('Backlink ∞', 80, 110);

    this.ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillStyle = '#e0e7ff';
    this.ctx.fillText('AI-Powered', 80, 130);
    this.ctx.fillText('Link Building', 80, 148);
    this.ctx.fillText('Revolution', 80, 166);

    // Add feature boxes
    const features = [
      { text: '🎯 High-DA\nBacklinks', y: 200 },
      { text: '⚡ AI Outreach\nAutomation', y: 280 },
      { text: '📊 Real-time\nAnalytics', y: 360 }
    ];

    features.forEach(feature => {
      // Feature box background
      this.ctx.fillStyle = 'rgba(255,255,255,0.15)';
      this.fillRoundedRect(15, feature.y, 130, 60, 12);
      
      // Feature box border
      this.ctx.strokeStyle = 'rgba(255,255,255,0.25)';
      this.ctx.lineWidth = 1;
      this.strokeRoundedRect(15, feature.y, 130, 60, 12);

      // Feature text
      const lines = feature.text.split('\n');
      this.ctx.fillStyle = '#fef08a';
      this.ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      this.ctx.fillText(lines[0], 80, feature.y + 20);
      
      this.ctx.fillStyle = 'white';
      this.ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      this.ctx.fillText(lines[1], 80, feature.y + 40);
    });

    // Add ROI badge
    this.ctx.fillStyle = '#fef08a';
    this.ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('⚡ 500% ROI', 80, 460);

    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('Guaranteed Results', 80, 480);

    // Add CTA button
    const ctaGradient = this.ctx.createLinearGradient(20, 510, 140, 540);
    ctaGradient.addColorStop(0, '#fef08a');
    ctaGradient.addColorStop(1, '#f59e0b');
    
    this.ctx.fillStyle = ctaGradient;
    this.fillRoundedRect(20, 510, 120, 35, 17);

    this.ctx.fillStyle = '#0f172a';
    this.ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('TRY FREE', 80, 532);

    // Add bottom tagline
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('Start Today &', 80, 565);
    this.ctx.fillText('Dominate SERPs', 80, 580);

    return this.canvas.toDataURL('image/png');
  }

  async generateMobileBanner(): Promise<string> {
    const width = 320;
    const height = 50;
    this.setupCanvas(width, height);

    // Create mobile-optimized gradient
    const gradient = this.ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#3b82f6');
    gradient.addColorStop(0.5, '#7c3aed');
    gradient.addColorStop(1, '#1e40af');
    
    this.ctx.fillStyle = gradient;
    this.fillRoundedRect(0, 0, width, height, 8);

    // Add mobile logo
    const logoGradient = this.ctx.createRadialGradient(30, 25, 0, 30, 25, 15);
    logoGradient.addColorStop(0, '#fef08a');
    logoGradient.addColorStop(1, '#f59e0b');
    
    this.ctx.fillStyle = logoGradient;
    this.ctx.beginPath();
    this.ctx.arc(30, 25, 12, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#0f172a';
    this.ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('∞', 30, 30);

    // Add compact branding
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Backlink ∞', 50, 22);
    
    this.ctx.font = 'bold 11px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillStyle = '#e0e7ff';
    this.ctx.fillText('AI Link Building', 50, 35);

    // Add mobile benefit
    this.ctx.fillStyle = '#fef08a';
    this.ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('⚡ 500% Faster', 190, 20);
    
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('Try Free Today', 190, 32);

    // Add mobile CTA arrow
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('→', 290, 30);

    return this.canvas.toDataURL('image/png');
  }

  async generateInstagramPost(): Promise<string> {
    const width = 1080;
    const height = 1080;
    this.setupCanvas(width, height);

    // Create Instagram-style gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#ec4899');
    gradient.addColorStop(0.3, '#7c3aed');
    gradient.addColorStop(0.7, '#3b82f6');
    gradient.addColorStop(1, '#1e40af');
    
    this.ctx.fillStyle = gradient;
    this.fillRoundedRect(0, 0, width, height, 24);

    // Add background pattern overlay
    this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      this.ctx.beginPath();
      this.ctx.arc(x, y, Math.random() * 3 + 1, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Add main logo with Instagram style
    const logoGradient = this.ctx.createRadialGradient(540, 350, 0, 540, 350, 100);
    logoGradient.addColorStop(0, '#ffffff');
    logoGradient.addColorStop(1, '#fef08a');
    
    this.ctx.fillStyle = logoGradient;
    this.ctx.beginPath();
    this.ctx.arc(540, 350, 80, 0, Math.PI * 2);
    this.ctx.fill();

    // Add logo border
    this.ctx.strokeStyle = '#fef08a';
    this.ctx.lineWidth = 6;
    this.ctx.beginPath();
    this.ctx.arc(540, 350, 80, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.fillStyle = '#7c3aed';
    this.ctx.font = 'bold 60px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('∞', 540, 375);

    // Add main headline
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 60px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('Backlink ∞', 540, 480);

    // Add testimonial text
    this.ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillStyle = '#e0e7ff';
    this.ctx.fillText('I just increased my', 540, 550);
    this.ctx.fillText('organic traffic by', 540, 590);
    
    this.ctx.fillStyle = '#fef08a';
    this.ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('300%!', 540, 650);

    // Add feature badges
    const badges = [
      { text: '✨ Automated Outreach', y: 720 },
      { text: '📈 High-DA Links Only', y: 780 },
      { text: '🚀 Instant Results', y: 840 }
    ];

    badges.forEach(badge => {
      this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
      this.fillRoundedRect(240, badge.y, 600, 50, 25);
      
      this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      this.ctx.lineWidth = 2;
      this.strokeRoundedRect(240, badge.y, 600, 50, 25);

      this.ctx.fillStyle = 'white';
      this.ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      this.ctx.fillText(badge.text, 540, badge.y + 35);
    });

    // Add CTA
    const ctaGradient = this.ctx.createLinearGradient(340, 920, 740, 980);
    ctaGradient.addColorStop(0, '#fef08a');
    ctaGradient.addColorStop(1, '#f59e0b');
    
    this.ctx.fillStyle = ctaGradient;
    this.fillRoundedRect(340, 920, 400, 60, 30);

    this.ctx.fillStyle = '#0f172a';
    this.ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('Link in Bio', 540, 960);

    // Add hashtags
    this.ctx.fillStyle = '#fef08a';
    this.ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('#SEO #LinkBuilding #Growth', 540, 1020);

    return this.canvas.toDataURL('image/png');
  }

  async generateInstagramStory(): Promise<string> {
    const width = 1080;
    const height = 1920;
    this.setupCanvas(width, height);

    // Create Instagram Story gradient
    const gradient = this.ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#ec4899');
    gradient.addColorStop(0.3, '#7c3aed');
    gradient.addColorStop(0.7, '#3b82f6');
    gradient.addColorStop(1, '#1e40af');
    
    this.ctx.fillStyle = gradient;
    this.fillRoundedRect(0, 0, width, height, 0);

    // Add animated background elements
    this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * width;
      const y = Math.random() * height;
      this.ctx.beginPath();
      this.ctx.arc(x, y, Math.random() * 4 + 2, 0, Math.PI * 2);
      this.ctx.fill();
    }

    // Add top logo
    const logoGradient = this.ctx.createRadialGradient(540, 400, 0, 540, 400, 100);
    logoGradient.addColorStop(0, '#ffffff');
    logoGradient.addColorStop(1, '#fef08a');
    
    this.ctx.fillStyle = logoGradient;
    this.ctx.beginPath();
    this.ctx.arc(540, 400, 80, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.strokeStyle = '#fef08a';
    this.ctx.lineWidth = 6;
    this.ctx.beginPath();
    this.ctx.arc(540, 400, 80, 0, Math.PI * 2);
    this.ctx.stroke();

    this.ctx.fillStyle = '#7c3aed';
    this.ctx.font = 'bold 60px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('∞', 540, 425);

    // Add brand name
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 72px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('Backlink ∞', 540, 540);

    // Add story text
    this.ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillStyle = '#e0e7ff';
    this.ctx.fillText('Secret to my', 540, 650);
    this.ctx.fillText('SEO success?', 540, 710);
    
    this.ctx.fillStyle = '#fef08a';
    this.ctx.font = 'bold 54px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('AI automation!', 540, 780);

    // Add feature highlights
    const features = [
      { text: '✨ 500+ Backlinks', y: 900 },
      { text: '📊 DA 70+ Sites', y: 980 },
      { text: '⚡ 24h Delivery', y: 1060 }
    ];

    features.forEach(feature => {
      this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
      this.fillRoundedRect(240, feature.y, 600, 60, 30);
      
      this.ctx.strokeStyle = 'rgba(255,255,255,0.3)';
      this.ctx.lineWidth = 2;
      this.strokeRoundedRect(240, feature.y, 600, 60, 30);

      this.ctx.fillStyle = 'white';
      this.ctx.font = 'bold 36px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      this.ctx.fillText(feature.text, 540, feature.y + 42);
    });

    // Add swipe up CTA
    const ctaGradient = this.ctx.createLinearGradient(240, 1200, 840, 1280);
    ctaGradient.addColorStop(0, '#fef08a');
    ctaGradient.addColorStop(1, '#f59e0b');
    
    this.ctx.fillStyle = ctaGradient;
    this.fillRoundedRect(240, 1200, 600, 80, 40);

    this.ctx.fillStyle = '#0f172a';
    this.ctx.font = 'bold 42px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('Swipe Up to Try', 540, 1250);

    return this.canvas.toDataURL('image/png');
  }

  async generateFacebookPost(): Promise<string> {
    const width = 1200;
    const height = 630;
    this.setupCanvas(width, height);

    // Create dynamic Facebook background
    const gradient = this.ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1e3a8a');
    gradient.addColorStop(0.3, '#312e81');
    gradient.addColorStop(0.7, '#1e1065');
    gradient.addColorStop(1, '#581c87');
    
    this.ctx.fillStyle = gradient;
    this.fillRoundedRect(0, 0, width, height, 16);

    // Add floating background elements
    this.addGlowingDots([
      { x: 100, y: 100, radius: 40, color: 'rgba(252,211,77,0.2)' },
      { x: 1100, y: 530, radius: 32, color: 'rgba(236,72,153,0.2)' },
      { x: 400, y: 300, radius: 24, color: 'rgba(6,182,212,0.2)' }
    ]);

    // Add success story box
    this.ctx.fillStyle = 'rgba(34,197,94,0.2)';
    this.fillRoundedRect(80, 80, 500, 120, 12);

    this.ctx.strokeStyle = 'rgba(34,197,94,0.4)';
    this.ctx.lineWidth = 2;
    this.strokeRoundedRect(80, 80, 500, 120, 12);

    // Success checkmark and label
    this.ctx.fillStyle = '#10b981';
    this.ctx.beginPath();
    this.ctx.arc(110, 120, 16, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('✓', 110, 126);

    this.ctx.fillStyle = '#10b981';
    this.ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('SUCCESS STORY', 140, 110);

    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('"I went from 0 to 50,000 monthly', 100, 140);
    this.ctx.fillText('organic visitors in 90 days!"', 100, 170);

    // Main headline
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 56px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('Backlink', 80, 280);
    
    this.ctx.fillStyle = '#fef08a';
    this.ctx.fillText(' ∞', 320, 280);

    this.ctx.fillStyle = '#93c5fd';
    this.ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('The AI That Builds High-DA Backlinks', 80, 320);
    
    this.ctx.fillStyle = '#fef08a';
    this.ctx.fillText('While You Sleep', 80, 355);

    // Benefits metrics
    const benefits = [
      { label: '500+', desc: 'Backlinks/Month', x: 130 },
      { label: 'DA 70+', desc: 'High Authority', x: 300 },
      { label: '24h', desc: 'First Results', x: 470 }
    ];

    benefits.forEach(benefit => {
      this.ctx.fillStyle = '#fef08a';
      this.ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(benefit.label, benefit.x, 410);
      
      this.ctx.fillStyle = '#06b6d4';
      this.ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      this.ctx.fillText(benefit.desc, benefit.x, 430);
    });

    // CTA Button with enhanced styling
    const ctaGradient = this.ctx.createLinearGradient(80, 460, 520, 520);
    ctaGradient.addColorStop(0, '#fef08a');
    ctaGradient.addColorStop(0.5, '#f59e0b');
    ctaGradient.addColorStop(1, '#ef4444');
    
    this.ctx.fillStyle = ctaGradient;
    this.fillRoundedRect(80, 460, 440, 60, 20);

    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('🚀 Start Free Trial - Get 100 Backlinks', 300, 495);

    // Right side visual elements
    const logoGradient = this.ctx.createRadialGradient(880, 280, 0, 880, 280, 100);
    logoGradient.addColorStop(0, '#fef08a');
    logoGradient.addColorStop(1, '#f59e0b');
    
    this.ctx.fillStyle = logoGradient;
    this.ctx.beginPath();
    this.ctx.arc(880, 280, 80, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#0f172a';
    this.ctx.font = 'bold 72px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('∞', 880, 300);

    // AI badge
    this.ctx.fillStyle = '#ef4444';
    this.ctx.beginPath();
    this.ctx.arc(940, 220, 20, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('AI', 940, 227);

    // Growth indicators
    this.ctx.fillStyle = '#10b981';
    this.ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('↗', 880, 420);
    
    this.ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('+500% Growth', 880, 450);

    // Bottom social proof bar
    this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
    this.fillRoundedRect(80, 560, 1040, 40, 12);

    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('🔥 2,847 businesses grew 300%+ this month', 100, 585);

    this.ctx.fillStyle = '#fef08a';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('Limited Time: 50% OFF', 1100, 585);

    return this.canvas.toDataURL('image/png');
  }

  async generateTwitterHeader(): Promise<string> {
    const width = 1500;
    const height = 500;
    this.setupCanvas(width, height);

    // Create sophisticated Twitter header gradient
    const gradient = this.ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#111827');
    gradient.addColorStop(0.3, '#1e3a8a');
    gradient.addColorStop(0.7, '#312e81');
    gradient.addColorStop(1, '#1e1065');
    
    this.ctx.fillStyle = gradient;
    this.fillRoundedRect(0, 0, width, height, 0);

    // Add grid pattern overlay
    this.ctx.fillStyle = 'rgba(255,255,255,0.05)';
    for (let x = 40; x < width; x += 40) {
      for (let y = 40; y < height; y += 40) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 1, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // Add floating particles
    this.addGlowingDots([
      { x: 1300, y: 80, radius: 8, color: '#fef08a' },
      { x: 320, y: 420, radius: 6, color: '#06b6d4' },
      { x: 500, y: 160, radius: 4, color: '#ec4899' }
    ]);

    // Main logo section
    const logoGradient = this.ctx.createRadialGradient(128, 250, 0, 128, 250, 60);
    logoGradient.addColorStop(0, '#fef08a');
    logoGradient.addColorStop(1, '#f59e0b');
    
    this.ctx.fillStyle = logoGradient;
    this.ctx.beginPath();
    this.ctx.arc(128, 250, 48, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#0f172a';
    this.ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('∞', 128, 265);

    // Main branding text
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Backlink', 200, 230);
    
    this.ctx.fillStyle = '#fef08a';
    this.ctx.fillText(' ∞', 380, 230);
    
    this.ctx.fillStyle = 'white';
    this.ctx.fillText(' Affiliate', 480, 230);

    this.ctx.fillStyle = '#bfdbfe';
    this.ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('AI-Powered Link Building • Earn Premium Commissions', 200, 270);

    // Commission badges
    const badges = [
      { text: '💰 Up to 35% Commission', x: 200, color: '#10b981' },
      { text: '🚀 $10K+ Monthly Potential', x: 500, color: '#8b5cf6' }
    ];

    badges.forEach(badge => {
      const badgeGradient = this.ctx.createLinearGradient(badge.x, 290, badge.x + 220, 330);
      badgeGradient.addColorStop(0, badge.color);
      badgeGradient.addColorStop(1, badge.color + '80');
      
      this.ctx.fillStyle = badgeGradient;
      this.fillRoundedRect(badge.x, 290, 220, 40, 20);
      
      this.ctx.fillStyle = 'white';
      this.ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(badge.text, badge.x + 110, 315);
    });

    // Success metrics panel
    this.ctx.fillStyle = 'rgba(255,255,255,0.1)';
    this.fillRoundedRect(1000, 120, 400, 280, 20);

    this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    this.ctx.lineWidth = 2;
    this.strokeRoundedRect(1000, 120, 400, 280, 20);

    // Panel header
    this.ctx.fillStyle = '#fef08a';
    this.ctx.font = 'bold 32px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('JOIN THE', 1200, 160);
    
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('SUCCESS NETWORK', 1200, 190);

    // Metrics grid
    const metrics = [
      { label: '5,847', desc: 'Active Affiliates', x: 1080, y: 240, color: '#06b6d4' },
      { label: '$2.3M', desc: 'Paid Out', x: 1320, y: 240, color: '#10b981' },
      { label: '89%', desc: 'Success Rate', x: 1080, y: 320, color: '#ec4899' },
      { label: '24h', desc: 'Fast Approval', x: 1320, y: 320, color: '#f97316' }
    ];

    metrics.forEach(metric => {
      this.ctx.fillStyle = metric.color;
      this.ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(metric.label, metric.x, metric.y);
      
      this.ctx.fillStyle = 'white';
      this.ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      this.ctx.fillText(metric.desc, metric.x, metric.y + 20);
    });

    // Call-to-action button
    const ctaGradient = this.ctx.createLinearGradient(1020, 360, 1380, 400);
    ctaGradient.addColorStop(0, '#fef08a');
    ctaGradient.addColorStop(1, '#f59e0b');
    
    this.ctx.fillStyle = ctaGradient;
    this.fillRoundedRect(1020, 360, 360, 40, 20);

    this.ctx.fillStyle = '#0f172a';
    this.ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('START EARNING TODAY', 1200, 385);

    // Top trending notification
    this.ctx.fillStyle = 'rgba(34,197,94,0.2)';
    this.fillRoundedRect(96, 40, 1308, 40, 12);

    this.ctx.strokeStyle = 'rgba(34,197,94,0.3)';
    this.ctx.lineWidth = 1;
    this.strokeRoundedRect(96, 40, 1308, 40, 12);

    this.ctx.fillStyle = '#10b981';
    this.ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('🔥 TRENDING: New affiliate earned $15,247 in their first month!', 750, 65);

    return this.canvas.toDataURL('image/png');
  }

  // Brand Asset Generators
  async generateBacklinkLogo(): Promise<string> {
    const width = 1024;
    const height = 1024;
    this.setupCanvas(width, height);

    // Create premium logo background
    const gradient = this.ctx.createRadialGradient(512, 512, 0, 512, 512, 512);
    gradient.addColorStop(0, '#1e293b');
    gradient.addColorStop(1, '#0f172a');
    
    this.ctx.fillStyle = gradient;
    this.fillRoundedRect(0, 0, width, height, 32);

    // Add background glow effects
    const glow1 = this.ctx.createRadialGradient(512, 512, 0, 512, 512, 400);
    glow1.addColorStop(0, 'rgba(252,211,77,0.3)');
    glow1.addColorStop(1, 'rgba(252,211,77,0)');
    
    this.ctx.fillStyle = glow1;
    this.ctx.fillRect(0, 0, width, height);

    // Create main logo circle
    const logoGradient = this.ctx.createRadialGradient(512, 512, 0, 512, 512, 200);
    logoGradient.addColorStop(0, '#fef08a');
    logoGradient.addColorStop(0.7, '#f59e0b');
    logoGradient.addColorStop(1, '#ea580c');
    
    this.ctx.fillStyle = logoGradient;
    this.ctx.beginPath();
    this.ctx.arc(512, 512, 180, 0, Math.PI * 2);
    this.ctx.fill();

    // Add logo glow ring
    this.ctx.shadowColor = '#f59e0b';
    this.ctx.shadowBlur = 40;
    this.ctx.strokeStyle = '#fef08a';
    this.ctx.lineWidth = 8;
    this.ctx.beginPath();
    this.ctx.arc(512, 512, 180, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.shadowBlur = 0;

    // Add infinity symbol
    this.ctx.fillStyle = '#0f172a';
    this.ctx.font = 'bold 160px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('∞', 512, 560);

    // Add brand name below
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 80px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('Backlink', 512, 800);

    return this.canvas.toDataURL('image/png');
  }

  async generateLogoWithTagline(): Promise<string> {
    const width = 1920;
    const height = 1080;
    this.setupCanvas(width, height);

    // Create professional background
    const gradient = this.ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1e293b');
    gradient.addColorStop(1, '#0f172a');
    
    this.ctx.fillStyle = gradient;
    this.fillRoundedRect(0, 0, width, height, 24);

    // Add subtle background pattern
    this.ctx.fillStyle = 'rgba(255,255,255,0.03)';
    for (let x = 100; x < width; x += 100) {
      for (let y = 100; y < height; y += 100) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 2, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // Create main logo
    const logoGradient = this.ctx.createRadialGradient(580, 540, 0, 580, 540, 120);
    logoGradient.addColorStop(0, '#fef08a');
    logoGradient.addColorStop(1, '#f59e0b');
    
    this.ctx.fillStyle = logoGradient;
    this.ctx.beginPath();
    this.ctx.arc(580, 540, 100, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#0f172a';
    this.ctx.font = 'bold 120px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('∞', 580, 580);

    // Add brand name
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 120px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Backlink', 720, 580);

    // Add tagline
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = 'bold 48px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Automated Link Building Platform', 960, 680);

    return this.canvas.toDataURL('image/png');
  }

  async generateIconOnly(): Promise<string> {
    const width = 512;
    const height = 512;
    this.setupCanvas(width, height);

    // Create icon background with multiple gradients
    const bgGradient = this.ctx.createRadialGradient(256, 256, 0, 256, 256, 256);
    bgGradient.addColorStop(0, '#1e293b');
    bgGradient.addColorStop(1, '#0f172a');
    
    this.ctx.fillStyle = bgGradient;
    this.fillRoundedRect(0, 0, width, height, 32);

    // Add animated background effect
    const pulseGradient = this.ctx.createRadialGradient(256, 256, 0, 256, 256, 200);
    pulseGradient.addColorStop(0, 'rgba(59,130,246,0.3)');
    pulseGradient.addColorStop(0.5, 'rgba(124,58,237,0.2)');
    pulseGradient.addColorStop(1, 'rgba(59,130,246,0)');
    
    this.ctx.fillStyle = pulseGradient;
    this.ctx.fillRect(0, 0, width, height);

    // Create main icon circle
    const iconGradient = this.ctx.createRadialGradient(256, 256, 0, 256, 256, 150);
    iconGradient.addColorStop(0, '#3b82f6');
    iconGradient.addColorStop(0.5, '#7c3aed');
    iconGradient.addColorStop(1, '#3b82f6');
    
    this.ctx.fillStyle = iconGradient;
    this.ctx.beginPath();
    this.ctx.arc(256, 256, 140, 0, Math.PI * 2);
    this.ctx.fill();

    // Add border with glow
    this.ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    this.ctx.lineWidth = 8;
    this.ctx.beginPath();
    this.ctx.arc(256, 256, 140, 0, Math.PI * 2);
    this.ctx.stroke();

    // Add infinity symbol
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 120px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('∞', 256, 290);

    // Add subtle top highlight
    const highlightGradient = this.ctx.createLinearGradient(0, 0, 0, 256);
    highlightGradient.addColorStop(0, 'rgba(255,255,255,0.1)');
    highlightGradient.addColorStop(1, 'rgba(255,255,255,0)');
    
    this.ctx.fillStyle = highlightGradient;
    this.fillRoundedRect(0, 0, width, height, 32);

    return this.canvas.toDataURL('image/png');
  }

  private setupCanvas(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.clearRect(0, 0, width, height);
    // Reset any transforms or styles
    this.ctx.resetTransform();
    this.ctx.globalAlpha = 1;
    this.ctx.shadowBlur = 0;
  }

  private fillRoundedRect(x: number, y: number, width: number, height: number, radius: number) {
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, height, radius);
    this.ctx.fill();
  }

  private strokeRoundedRect(x: number, y: number, width: number, height: number, radius: number) {
    this.ctx.beginPath();
    this.ctx.roundRect(x, y, width, height, radius);
    this.ctx.stroke();
  }

  private addGlowingDots(dots: Array<{ x: number; y: number; radius: number; color: string }>) {
    dots.forEach(dot => {
      // Add glow effect
      this.ctx.shadowColor = dot.color;
      this.ctx.shadowBlur = dot.radius * 3;
      
      this.ctx.fillStyle = dot.color;
      this.ctx.beginPath();
      this.ctx.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
      this.ctx.fill();
      
      this.ctx.shadowBlur = 0;
    });
  }
}

// Export convenience functions
export async function generateAsset(name: string): Promise<string> {
  const generator = new AssetGenerator();

  switch (name) {
    case 'Leaderboard Banner':
      return generator.generateLeaderboardBanner();
    case 'Rectangle Banner':
      return generator.generateRectangleBanner();
    case 'Skyscraper Banner':
      return generator.generateSkyscraperBanner();
    case 'Mobile Banner':
      return generator.generateMobileBanner();
    case 'Instagram Post':
      return generator.generateInstagramPost();
    case 'Instagram Story':
      return generator.generateInstagramStory();
    case 'Facebook Post':
      return generator.generateFacebookPost();
    case 'Twitter Header':
      return generator.generateTwitterHeader();
    case 'Backlink Logo':
      return generator.generateBacklinkLogo();
    case 'Logo + Tagline':
      return generator.generateLogoWithTagline();
    case 'Icon Only':
      return generator.generateIconOnly();
    default:
      // Enhanced fallback - create a custom asset based on name
      return generator.generateLeaderboardBanner();
  }
}
