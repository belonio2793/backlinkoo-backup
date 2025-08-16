import React from 'react';
import { useParams } from 'react-router-dom';

const BeautifulBlogPostSimple = () => {
  const { slug } = useParams();

  return (
    <div>
      <h1>Blog Post: {slug}</h1>
      <p>This is a simplified version to test basic functionality.</p>
    </div>
  );
};

export { BeautifulBlogPostSimple };
export default BeautifulBlogPostSimple;
