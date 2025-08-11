import React, { useState, useEffect } from 'react';

const rotatingTexts = [
  "Each account includes free access to up to three blog posts, allowing users to explore and experience our private blog post backlink service at no cost.",
  "This introductory offer is designed to educate users on how search engine rankings work and demonstrate the impact of high-quality, contextual backlinks.",
  "Our platform is partnered with authoritative websites where we publish tailored blog content to strategically improve keyword performance.",
  "When you purchase credits and launch campaigns, you receive powerful blog post backlinks from diverse, reputable domains—proven to enhance visibility.",
  "SEO traffic is \"free\" compared to ads. Once you rank, you get continuous traffic without paying for every click like PPC. Businesses can generate years of leads from a single piece of content.",
  "Highest long-term ROI in digital marketing. Studies show SEO can generate 200–1,200% ROI over 3–5 years, compared to PPC's 200–300% short-term ROI.",
  "Targets high-intent customers. Organic search users are actively looking for solutions. This means higher conversion rates compared to social media or cold outreach.",
  "Builds brand trust & authority. Top Google rankings position your brand as the \"go-to\" in your niche, creating long-term credibility.",
  "Compounds over time. Every piece of optimized content adds to your site's authority, making it easier to rank for more keywords in the future.",
  "Works 24/7. Your website keeps attracting leads even when your team is sleeping, unlike paid ads which stop the moment you pause spending.",
  "Beats ad blindness. Users skip ads mentally (\"banner blindness\"), but they trust organic results more — leading to higher engagement and click-through rates.",
  "Cheaper lead acquisition cost over time. While initial SEO setup can be costly, per-lead cost drops dramatically after rankings stabilize, unlike ads which always cost per click.",
  "SEO data fuels other channels. Keyword research and analytics from SEO can improve email marketing, paid ads targeting, and social media content.",
  "Backlinks & content have resale value. Unlike ad spend, SEO investments (content, backlinks) remain assets that keep generating traffic and leads over time."
];

export const RotatingTrialText: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;
    let isMounted = true;

    try {
      interval = setInterval(() => {
        if (!isMounted) return;

        setIsVisible(false);

        timeout = setTimeout(() => {
          if (!isMounted) return;
          setCurrentIndex((prevIndex) => (prevIndex + 1) % rotatingTexts.length);
          setIsVisible(true);
        }, 300);

      }, 4000);

    } catch (error) {
      console.error('Error in RotatingTrialText:', error);
    }

    return () => {
      isMounted = false;
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, []);

  return (
    <div className="min-h-[3rem] flex items-center">
      <p
        className={`text-gray-600 transition-all duration-300 ease-in-out ${
          isVisible ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-2'
        }`}
      >
        {rotatingTexts[currentIndex] || rotatingTexts[0]}
      </p>
    </div>
  );
};
