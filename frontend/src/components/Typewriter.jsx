import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

/**
 * A component that renders text with a typing animation.
 * Ideal for AI responses.
 * 
 * @param {string} text - The full text to type out.
 * @param {boolean} animate - Whether to animate the typing.
 * @param {number} speed - Milliseconds per character.
 * @param {function} onComplete - Callback when typing is done.
 * @param {boolean} showCursor - Whether to show a typing cursor.
 */
const Typewriter = ({ 
  text = '', 
  animate = true, 
  speed = 20, 
  onComplete, 
  showCursor = true,
  className = ''
}) => {
  const [displayedText, setDisplayedText] = useState(animate ? '' : text);
  const [isTyping, setIsTyping] = useState(animate && text.length > 0);

  useEffect(() => {
    if (!animate || !text) {
      setDisplayedText(text);
      setIsTyping(false);
      return;
    }

    // Reset if text changes
    setDisplayedText('');
    setIsTyping(true);

    let i = 0;
    const timer = setInterval(() => {
      setDisplayedText(text.substring(0, i + 1));
      i++;
      if (i >= text.length) {
        clearInterval(timer);
        setIsTyping(false);
        if (onComplete) onComplete();
      }
    }, speed);

    return () => clearInterval(timer);
  }, [text, animate, speed, onComplete]);

  return (
    <div className={`typewriter-container ${className}`}>
      <ReactMarkdown>
        {displayedText + (isTyping && showCursor ? ' ▊' : '')}
      </ReactMarkdown>
    </div>
  );
};

export default Typewriter;
