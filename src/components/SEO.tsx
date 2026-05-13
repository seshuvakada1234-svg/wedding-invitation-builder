import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
}

const SEO: React.FC<SEOProps> = ({ 
  title, 
  description, 
  canonical, 
  ogImage = 'https://www.weddinginvitation.tech/og-image.jpg',
  ogType = 'website'
}) => {
  const siteTitle = 'Wedding Invitation';
  const fullTitle = title ? `${title} | ${siteTitle}` : `${siteTitle} — Luxury AI Wedding Invitation Builder`;
  const defaultDescription = 'Create ultra-luxury digital wedding invitations with premium templates, RSVP management, and cinematic storytelling.';

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description || defaultDescription} />
      {canonical && <link rel="canonical" href={canonical} />}
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || defaultDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content={ogType} />
      
      {/* Twitter */}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || defaultDescription} />
      <meta name="twitter:image" content={ogImage} />
    </Helmet>
  );
};

export default SEO;
