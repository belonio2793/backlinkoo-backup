import { useState, useEffect } from 'react';

export function AnimatedBlogHeadline() {
  const [showText, setShowText] = useState(false);
  const [showSubtext, setShowSubtext] = useState(false);
  const [animateWords, setAnimateWords] = useState(false);
  const [gradientTheme, setGradientTheme] = useState(0);

  // Gradient themes that complement the background
  const gradientThemes = [
    // Ocean Blues & Purples (matches blue-50 to purple-50 background)
    'from-cyan-400 via-blue-500 via-purple-500 via-pink-500 to-rose-400',

    // Sunset Warmth (complements blue background with warm contrast)
    'from-orange-400 via-pink-500 via-purple-500 via-blue-500 to-indigo-400',

    // Electric Neon (vibrant but harmonious)
    'from-lime-400 via-cyan-500 via-blue-500 via-purple-500 to-pink-400',

    // Royal Jewels (deep, rich colors)
    'from-violet-400 via-purple-500 via-pink-500 via-rose-500 to-orange-400',

    // Arctic Aurora (cool, ethereal)
    'from-teal-400 via-cyan-500 via-blue-500 via-indigo-500 to-purple-400',

    // Cosmic Galaxy (space-themed)
    'from-indigo-400 via-purple-500 via-pink-500 via-red-500 to-yellow-400',

    // Forest to Ocean (natural gradient)
    'from-emerald-400 via-teal-500 via-cyan-500 via-blue-500 to-indigo-400',

    // Fire & Ice (dramatic contrast)
    'from-blue-400 via-cyan-500 via-pink-500 via-red-500 to-orange-400'
  ];

  useEffect(() => {
    // Select a random gradient theme on each page load
    setGradientTheme(Math.floor(Math.random() * gradientThemes.length));

    // Start headline animation immediately
    setShowText(true);

    // Start word-by-word animation after brief delay
    const wordTimer = setTimeout(() => {
      setAnimateWords(true);
    }, 300);

    // Start subtitle animation after headline
    const subtitleTimer = setTimeout(() => {
      setShowSubtext(true);
    }, 1200);

    return () => {
      clearTimeout(wordTimer);
      clearTimeout(subtitleTimer);
    };
  }, []);

  const words = ["Create", "a", "Free", "Permanent", "Natural", "Backlink"];
  const currentGradient = gradientThemes[gradientTheme];

  return (
    <div className="text-center mb-8">
      <div className="relative inline-block">
        {/* Animated headline with word-by-word reveal */}
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight overflow-hidden">
          {words.map((word, index) => (
            <span
              key={index}
              className={`inline-block text-transparent bg-clip-text bg-gradient-to-r ${currentGradient} mr-3 ${
                animateWords 
                  ? `animate-word-slide opacity-100` 
                  : 'opacity-0'
              }`}
              style={{
                animationDelay: `${index * 150}ms`,
                backgroundSize: '300% 300%',
                animation: animateWords 
                  ? `word-slide 0.5s ease-out forwards ${index * 150}ms, gradient-shift 3s ease-in-out infinite ${index * 150 + 800}ms`
                  : 'none'
              }}
            >
              {word}
            </span>
          ))}
        </h2>

        {/* Animated decorative lines */}
        <div 
          className={`absolute -top-2 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full transition-all duration-1000 delay-1000 ${
            showText ? 'w-20 opacity-70 animate-pulse-glow' : 'w-0 opacity-0'
          }`}
        ></div>
        <div 
          className={`absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-1000 delay-1200 ${
            showText ? 'w-14 opacity-50 animate-pulse-glow' : 'w-0 opacity-0'
          }`}
        ></div>
      </div>

      {/* Animated subtitle */}
      <div 
        className={`mt-6 transform transition-all duration-800 delay-1200 ${
          showSubtext 
            ? 'translate-y-0 opacity-100' 
            : 'translate-y-4 opacity-0'
        }`}
      >
        <p className="text-lg text-gray-600 font-light max-w-2xl mx-auto leading-relaxed">
          <span className="relative">
            Generate a high-quality, powerful blog post with natural backlinks in seconds
            <span className="absolute -bottom-3 left-0 w-full h-0.5 bg-gradient-to-r from-blue-300 to-purple-300 opacity-30 transform scale-x-0 animate-[scaleX_1s_ease-out_1.8s_forwards] origin-left"></span>
          </span>
        </p>
      </div>
    </div>
  );
}
