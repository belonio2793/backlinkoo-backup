import { useState, useEffect } from 'react';

export function AnimatedBlogHeadline() {
  const [showText, setShowText] = useState(false);
  const [showSubtext, setShowSubtext] = useState(false);
  const [animateWords, setAnimateWords] = useState(false);

  useEffect(() => {
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

  return (
    <div className="text-center mb-8">
      <div className="relative inline-block">
        {/* Animated headline with word-by-word reveal */}
        <h2 className="text-3xl md:text-5xl lg:text-6xl font-black leading-tight tracking-tight overflow-hidden">
          {words.map((word, index) => (
            <span
              key={index}
              className={`inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 mr-3 ${
                animateWords 
                  ? `animate-word-slide opacity-100` 
                  : 'opacity-0'
              }`}
              style={{
                animationDelay: `${index * 150}ms`,
                backgroundSize: '200% 200%',
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
            <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-gradient-to-r from-blue-300 to-purple-300 opacity-30 transform scale-x-0 animate-[scaleX_1s_ease-out_1.8s_forwards] origin-left"></span>
          </span>
        </p>
      </div>
    </div>
  );
}
