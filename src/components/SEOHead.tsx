import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  jsonLd?: Record<string, unknown>;
}

export function SEOHead({ 
  title = 'FerreHogar — Tu ferretería en casa',
  description = 'Encuentra herramientas, materiales de construcción y artículos para el hogar con entrega a domicilio en toda Cuba.',
  image,
  url,
  jsonLd,
}: SEOHeadProps) {
  const fullTitle = title.includes('FerreHogar') ? title : `${title} | FerreHogar`;
  
  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      {image && <meta property="og:image" content={image} />}
      {url && <meta property="og:url" content={url} />}
      <meta property="og:type" content="website" />
      {jsonLd && (
        <script type="application/ld+json">
          {JSON.stringify(jsonLd)}
        </script>
      )}
    </Helmet>
  );
}
