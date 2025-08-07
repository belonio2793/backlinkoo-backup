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
    gradient.addColorStop(0, '#4f79ff');
    gradient.addColorStop(0.5, '#7838bf');
    gradient.addColorStop(1, '#1d4ed8');
    
    this.ctx.fillStyle = gradient;
    this.fillRoundedRect(0, 0, width, height, 12);

    // Add shimmer effect
    const shimmer = this.ctx.createLinearGradient(0, 0, width, 0);
    shimmer.addColorStop(0, 'rgba(255,255,255,0)');
    shimmer.addColorStop(0.5, 'rgba(255,255,255,0.2)');
    shimmer.addColorStop(1, 'rgba(255,255,255,0)');
    
    this.ctx.fillStyle = shimmer;
    this.fillRoundedRect(0, 0, width, height, 12);

    // Add logo circle
    const logoGradient = this.ctx.createLinearGradient(40, 25, 80, 65);
    logoGradient.addColorStop(0, '#fff700');
    logoGradient.addColorStop(1, '#ff9500');
    
    this.ctx.fillStyle = logoGradient;
    this.ctx.beginPath();
    this.ctx.arc(60, 45, 20, 0, Math.PI * 2);
    this.ctx.fill();

    // Add infinity symbol
    this.ctx.fillStyle = '#0f172a';
    this.ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('∞', 60, 52);

    // Add main text
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Backlink ∞', 100, 35);

    this.ctx.font = '500 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('Revolutionary AI Link Building & SEO Growth', 100, 55);

    // Add benefits
    this.ctx.fillStyle = '#fff700';
    this.ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('🚀 500% ROI Guaranteed', 364, 30);

    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('High-DA Links • AI Powered • 24h Results', 364, 50);

    // Add CTA button
    const ctaGradient = this.ctx.createLinearGradient(540, 20, 700, 70);
    ctaGradient.addColorStop(0, '#fff700');
    ctaGradient.addColorStop(1, '#ff9500');
    
    this.ctx.fillStyle = ctaGradient;
    this.fillRoundedRect(540, 20, 160, 50, 25);

    this.ctx.fillStyle = '#0f172a';
    this.ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('START FREE TRIAL', 620, 40);
    this.ctx.fillText('→', 620, 55);

    return this.canvas.toDataURL('image/png');
  }

  async generateRectangleBanner(): Promise<string> {
    const width = 300;
    const height = 250;
    this.setupCanvas(width, height);

    // Create background gradient
    const gradient = this.ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1e1065');
    gradient.addColorStop(0.3, '#3130f2');
    gradient.addColorStop(0.7, '#6266f7');
    gradient.addColorStop(1, '#4777f3');
    
    this.ctx.fillStyle = gradient;
    this.fillRoundedRect(0, 0, width, height, 16);

    // Add radial glow
    const glow = this.ctx.createRadialGradient(150, 60, 0, 150, 60, 80);
    glow.addColorStop(0, 'rgba(255,247,0,0.3)');
    glow.addColorStop(1, 'rgba(255,247,0,0)');
    
    this.ctx.fillStyle = glow;
    this.ctx.fillRect(0, 0, width, height);

    // Add logo
    const logoGradient = this.ctx.createLinearGradient(120, 25, 180, 85);
    logoGradient.addColorStop(0, '#fff700');
    logoGradient.addColorStop(1, '#ff9500');
    
    this.ctx.fillStyle = logoGradient;
    this.ctx.beginPath();
    this.ctx.arc(150, 55, 30, 0, Math.PI * 2);
    this.ctx.fill();

    // Add infinity symbol
    this.ctx.fillStyle = '#0f172a';
    this.ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('∞', 150, 64);

    // Add main text
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 28px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('Backlink ∞', 150, 110);

    this.ctx.font = '500 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillStyle = '#dddfF4';
    this.ctx.fillText('The Ultimate AI-Powered', 150, 138);
    this.ctx.fillText('Link Building Platform', 150, 158);

    // Add benefit
    this.ctx.fillStyle = '#fff700';
    this.ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('⚡ 1000x Faster Than Manual', 150, 180);

    // Add CTA
    const ctaGradient = this.ctx.createLinearGradient(60, 200, 240, 230);
    ctaGradient.addColorStop(0, '#fff700');
    ctaGradient.addColorStop(1, '#ff9500');
    
    this.ctx.fillStyle = ctaGradient;
    this.fillRoundedRect(60, 185, 180, 45, 23);

    this.ctx.fillStyle = '#0f172a';
    this.ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('GET INSTANT ACCESS', 150, 207);
    this.ctx.fillText('→', 150, 222);

    return this.canvas.toDataURL('image/png');
  }

  async generateFacebookPost(): Promise<string> {
    const width = 1200;
    const height = 630;
    this.setupCanvas(width, height);

    // Create background gradient
    const gradient = this.ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.3, '#16213e');
    gradient.addColorStop(0.7, '#0f172a');
    gradient.addColorStop(1, '#1e1065');
    
    this.ctx.fillStyle = gradient;
    this.fillRoundedRect(0, 0, width, height, 16);

    // Add floating elements (simplified as circles)
    this.ctx.fillStyle = 'rgba(255, 247, 0, 0.2)';
    this.ctx.beginPath();
    this.ctx.arc(100, 100, 40, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = 'rgba(236, 72, 153, 0.2)';
    this.ctx.beginPath();
    this.ctx.arc(1100, 530, 32, 0, Math.PI * 2);
    this.ctx.fill();

    // Success story box
    this.ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
    this.fillRoundedRect(80, 80, 400, 120, 12);

    this.ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
    this.lineWidth = 2;
    this.strokeRoundedRect(80, 80, 400, 120, 12);

    // Success story content
    this.ctx.fillStyle = '#10b981';
    this.ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('✓ SUCCESS STORY', 100, 110);

    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('"I went from 0 to 50,000 monthly', 100, 140);
    this.ctx.fillText('organic visitors in 90 days!"', 100, 165);

    // Main headline
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 50px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('Backlink', 80, 280);
    
    this.ctx.fillStyle = '#fff700';
    this.ctx.fillText(' ∞', 280, 280);

    this.ctx.fillStyle = '#93c5fd';
    this.ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('The AI That Builds High-DA Backlinks', 80, 320);
    
    this.ctx.fillStyle = '#fff700';
    this.ctx.fillText('While You Sleep', 80, 350);

    // Benefits grid
    const benefits = [
      { label: '500+', desc: 'Backlinks/Month', x: 80 },
      { label: 'DA 70+', desc: 'High Authority', x: 240 },
      { label: '24h', desc: 'First Results', x: 400 }
    ];

    benefits.forEach(benefit => {
      this.ctx.fillStyle = '#fff700';
      this.ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(benefit.label, benefit.x + 50, 400);
      
      this.ctx.fillStyle = '#06b6d4';
      this.ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      this.ctx.fillText(benefit.desc, benefit.x + 50, 420);
    });

    // CTA Button
    const ctaGradient = this.ctx.createLinearGradient(80, 460, 500, 520);
    ctaGradient.addColorStop(0, '#fff700');
    ctaGradient.addColorStop(0.5, '#ff9500');
    ctaGradient.addColorStop(1, '#ef4444');
    
    this.ctx.fillStyle = ctaGradient;
    this.fillRoundedRect(80, 460, 420, 60, 20);

    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('🚀 Start Free Trial - Get 100 Backlinks', 290, 495);

    // Right side logo
    const logoGradient = this.ctx.createLinearGradient(800, 200, 960, 360);
    logoGradient.addColorStop(0, '#fff700');
    logoGradient.addColorStop(1, '#ff9500');
    
    this.ctx.fillStyle = logoGradient;
    this.ctx.beginPath();
    this.ctx.arc(880, 280, 80, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#0f172a';
    this.ctx.font = 'bold 60px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('∞', 880, 295);

    // AI badge
    this.ctx.fillStyle = '#ef4444';
    this.ctx.beginPath();
    this.ctx.arc(930, 230, 16, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('AI', 930, 235);

    // Growth arrow
    this.ctx.fillStyle = '#10b981';
    this.ctx.font = 'bold 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('↗', 880, 420);
    
    this.ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('+500% Growth', 880, 450);

    // Bottom social proof
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.fillRoundedRect(80, 560, 1040, 40, 12);

    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('🔥 2,847 businesses grew 300%+ this month', 100, 585);

    this.ctx.fillStyle = '#fff700';
    this.ctx.textAlign = 'right';
    this.ctx.fillText('Limited Time: 50% OFF', 1100, 585);

    return this.canvas.toDataURL('image/png');
  }

  async generateTwitterHeader(): Promise<string> {
    const width = 1500;
    const height = 500;
    this.setupCanvas(width, height);

    // Create background gradient
    const gradient = this.ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#111827');
    gradient.addColorStop(0.3, '#1e3a8a');
    gradient.addColorStop(0.7, '#312e81');
    gradient.addColorStop(1, '#1e1065');
    
    this.ctx.fillStyle = gradient;
    this.fillRoundedRect(0, 0, width, height, 16);

    // Grid pattern overlay (simplified as dots)
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    for (let x = 40; x < width; x += 40) {
      for (let y = 40; y < height; y += 40) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 1, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }

    // Floating elements
    this.ctx.fillStyle = 'rgba(255, 247, 0, 0.6)';
    this.ctx.beginPath();
    this.ctx.arc(1300, 80, 8, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = 'rgba(6, 182, 212, 0.6)';
    this.ctx.beginPath();
    this.ctx.arc(320, 420, 6, 0, Math.PI * 2);
    this.ctx.fill();

    // Logo
    const logoGradient = this.ctx.createLinearGradient(80, 180, 176, 320);
    logoGradient.addColorStop(0, '#fff700');
    logoGradient.addColorStop(1, '#ff9500');
    
    this.ctx.fillStyle = logoGradient;
    this.ctx.beginPath();
    this.ctx.arc(128, 250, 48, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = '#0f172a';
    this.ctx.font = 'bold 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('∞', 128, 265);

    // Main text
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 40px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'left';
    this.ctx.fillText('Backlink', 200, 230);
    
    this.ctx.fillStyle = '#fff700';
    this.ctx.fillText(' ∞', 360, 230);
    
    this.ctx.fillStyle = 'white';
    this.ctx.fillText(' Affiliate', 460, 230);

    this.ctx.fillStyle = '#bfdbfe';
    this.ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.fillText('AI-Powered Link Building • Earn Premium Commissions', 200, 270);

    // Badge buttons
    const badges = [
      { text: '💰 Up to 35% Commission', x: 200, color: '#10b981' },
      { text: '🚀 $10K+ Monthly Potential', x: 480, color: '#8b5cf6' }
    ];

    badges.forEach(badge => {
      this.ctx.fillStyle = badge.color;
      this.fillRoundedRect(badge.x, 290, 200, 40, 20);
      
      this.ctx.fillStyle = 'white';
      this.ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(badge.text, badge.x + 100, 315);
    });

    // Success metrics box
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    this.fillRoundedRect(1000, 120, 400, 280, 20);

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.lineWidth = 2;
    this.strokeRoundedRect(1000, 120, 400, 280, 20);

    // Metrics header
    this.ctx.fillStyle = '#fff700';
    this.ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('JOIN THE', 1200, 160);
    
    this.ctx.fillStyle = 'white';
    this.ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
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
      this.ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(metric.label, metric.x, metric.y);
      
      this.ctx.fillStyle = 'white';
      this.ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      this.ctx.fillText(metric.desc, metric.x, metric.y + 20);
    });

    // CTA button
    const ctaGradient = this.ctx.createLinearGradient(1020, 360, 1380, 400);
    ctaGradient.addColorStop(0, '#fff700');
    ctaGradient.addColorStop(1, '#ff9500');
    
    this.ctx.fillStyle = ctaGradient;
    this.fillRoundedRect(1020, 360, 360, 40, 20);

    this.ctx.fillStyle = '#0f172a';
    this.ctx.font = 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('START EARNING TODAY', 1200, 385);

    // Top notification bar
    this.ctx.fillStyle = 'rgba(34, 197, 94, 0.2)';
    this.fillRoundedRect(96, 40, 1308, 40, 12);

    this.ctx.strokeStyle = 'rgba(34, 197, 94, 0.3)';
    this.lineWidth = 1;
    this.strokeRoundedRect(96, 40, 1308, 40, 12);

    this.ctx.fillStyle = '#10b981';
    this.ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('🔥 TRENDING: New affiliate earned $15,247 in their first month!', 750, 65);

    return this.canvas.toDataURL('image/png');
  }

  private setupCanvas(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.clearRect(0, 0, width, height);
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
}

// Export convenience functions
export async function generateAsset(name: string): Promise<string> {
  const generator = new AssetGenerator();
  
  switch (name) {
    case 'Leaderboard Banner':
      return generator.generateLeaderboardBanner();
    case 'Rectangle Banner':
      return generator.generateRectangleBanner();
    case 'Facebook Post':
      return generator.generateFacebookPost();
    case 'Twitter Header':
      return generator.generateTwitterHeader();
    default:
      // Fallback for other assets
      return generator.generateLeaderboardBanner();
  }
}
