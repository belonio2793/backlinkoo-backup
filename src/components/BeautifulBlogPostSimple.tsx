import React from 'react';
import { useParams } from 'react-router-dom';

function BeautifulBlogPostSimple() {
  const params = useParams();
  const slug = params.slug;

  return React.createElement('div', { style: { padding: '20px' } },
    React.createElement('h1', {}, 'Blog Post: ' + (slug || 'Unknown')),
    React.createElement('p', {}, 'This is a simplified version to test basic functionality.')
  );
}

export { BeautifulBlogPostSimple };
export default BeautifulBlogPostSimple;
