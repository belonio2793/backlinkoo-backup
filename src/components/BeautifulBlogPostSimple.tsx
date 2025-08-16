import React from 'react';
import { useParams } from 'react-router-dom';

const BeautifulBlogPostSimple: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  return React.createElement('div', {},
    React.createElement('h1', {}, `Blog Post: ${slug}`),
    React.createElement('p', {}, 'This is a simplified version to test basic functionality.')
  );
};

export { BeautifulBlogPostSimple };
export default BeautifulBlogPostSimple;
