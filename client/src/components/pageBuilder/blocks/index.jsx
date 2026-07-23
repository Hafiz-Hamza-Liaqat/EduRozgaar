import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AdHost } from '../../ads/AdHost';
import { NewsletterSubscribe } from '../../newsletter/NewsletterSubscribe';
import { FormRenderer } from '../../forms/FormRenderer';
import { sanitizeHtmlForRender } from '../../../utils/sanitizeHtml';
import { parseJsonArray } from '@shared/blockValidation.js';
import { resolveBlockGridSettings, resolveResponsiveGridClasses } from '@shared/pageBuilderLayout.js';
import { useBlockLayoutContext } from '../BlockLayoutContext';
import { OptimizedBlockImage } from '../OptimizedBlockImage';
import { DynamicBlockRenderer } from '../dynamic/DynamicBlockRenderer';

function SectionShell({ title, children, className = '', innerClassName = '' }) {
  const { useLayoutContainer } = useBlockLayoutContext();
  const containerClass = useLayoutContainer ? 'w-full' : 'max-w-6xl mx-auto px-4 sm:px-6';

  return (
    <section className={`${useLayoutContainer ? '' : 'py-8'} ${className}`} aria-labelledby={title ? `section-${title.replace(/\s+/g, '-').toLowerCase()}` : undefined}>
      <div className={containerClass}>
        {title ? (
          <h2 id={`section-${title.replace(/\s+/g, '-').toLowerCase()}`} className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {title}
          </h2>
        ) : null}
        <div className={innerClassName}>{children}</div>
      </div>
    </section>
  );
}

export function HeroBlock({ block }) {
  const {
    headline,
    subheadline,
    backgroundImageUrl,
    overlayOpacity = 45,
    primaryCtaLabel,
    primaryCtaUrl,
    secondaryCtaLabel,
    secondaryCtaUrl,
    alignment = 'center',
    height = 'lg',
  } = block.config || {};

  const opacity = Math.min(100, Math.max(0, Number(overlayOpacity) || 45)) / 100;
  const style = backgroundImageUrl
    ? {
        backgroundImage: `linear-gradient(rgba(0,0,0,${opacity}), rgba(0,0,0,${opacity})), url(${backgroundImageUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : undefined;

  const heightClass = {
    sm: 'py-12 sm:py-16',
    md: 'py-16 sm:py-20',
    lg: 'py-20 sm:py-28',
    xl: 'py-24 sm:py-36',
  }[height] || 'py-20 sm:py-28';

  const alignClass = {
    left: 'text-left items-start',
    center: 'text-center items-center',
    right: 'text-right items-end',
  }[alignment] || 'text-center items-center';

  const hasImage = Boolean(backgroundImageUrl);
  const textClass = hasImage ? 'text-white' : 'text-gray-900 dark:text-white';

  return (
    <div className={`relative ${heightClass} ${textClass}`} style={style}>
      <div className={`max-w-4xl mx-auto px-4 sm:px-6 flex flex-col ${alignClass}`}>
        {headline ? <h2 className="text-3xl sm:text-5xl font-bold mb-4">{headline}</h2> : null}
        {subheadline ? <p className="text-lg opacity-90 max-w-2xl">{subheadline}</p> : null}
        {(primaryCtaLabel || secondaryCtaLabel) ? (
          <div className={`mt-8 flex flex-wrap gap-3 ${alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : 'justify-start'}`}>
            {primaryCtaLabel && primaryCtaUrl ? (
              <a href={primaryCtaUrl} className="inline-flex px-6 py-3 rounded-lg bg-primary text-white font-medium hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary">
                {primaryCtaLabel}
              </a>
            ) : null}
            {secondaryCtaLabel && secondaryCtaUrl ? (
              <a href={secondaryCtaUrl} className="inline-flex px-6 py-3 rounded-lg border border-white/80 text-inherit font-medium hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-white">
                {secondaryCtaLabel}
              </a>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function RichTextBlock({ block }) {
  const { heading, body, htmlContent } = block.config || {};
  const html = htmlContent || (body ? `<p>${body.replace(/\n/g, '<br>')}</p>` : '');
  const safe = sanitizeHtmlForRender(html);

  return (
    <SectionShell title={heading}>
      {safe ? (
        <div
          className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300"
          dangerouslySetInnerHTML={{ __html: safe }}
        />
      ) : null}
    </SectionShell>
  );
}

export function CtaBlock({ block }) {
  const {
    title,
    description,
    buttonLabel,
    buttonUrl,
    buttonStyle = 'primary',
    icon,
    backgroundColor,
    backgroundImageUrl,
  } = block.config || {};

  const btnClass = {
    primary: 'bg-primary text-white hover:opacity-90',
    secondary: 'bg-gray-900 dark:bg-white dark:text-gray-900 text-white hover:opacity-90',
    outline: 'border-2 border-primary text-primary bg-transparent hover:bg-primary/10',
  }[buttonStyle] || 'bg-primary text-white hover:opacity-90';

  const shellStyle = {};
  if (backgroundColor) shellStyle.backgroundColor = backgroundColor;
  if (backgroundImageUrl) {
    shellStyle.backgroundImage = `linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,.35)), url(${backgroundImageUrl})`;
    shellStyle.backgroundSize = 'cover';
    shellStyle.backgroundPosition = 'center';
  }

  const onImage = Boolean(backgroundImageUrl);

  return (
    <SectionShell>
      <div
        className={`rounded-2xl p-8 text-center ${!backgroundColor && !backgroundImageUrl ? 'bg-primary/10 dark:bg-primary/20' : ''} ${onImage ? 'text-white' : ''}`}
        style={Object.keys(shellStyle).length ? shellStyle : undefined}
      >
        {title ? <h2 className="text-2xl font-bold mb-2">{title}</h2> : null}
        {description ? <p className={`mb-6 max-w-2xl mx-auto ${onImage ? 'text-white/90' : 'text-gray-600 dark:text-gray-300'}`}>{description}</p> : null}
        {buttonLabel && buttonUrl ? (
          <a href={buttonUrl} className={`inline-flex items-center gap-2 px-6 py-3 rounded-lg font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary ${btnClass}`}>
            {icon ? <span aria-hidden>{icon}</span> : null}
            {buttonLabel}
          </a>
        ) : null}
      </div>
    </SectionShell>
  );
}

function FaqAccordionItem({ id, question, answer, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const panelId = `faq-panel-${id}`;
  const buttonId = `faq-btn-${id}`;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <h3 className="m-0">
        <button
          type="button"
          id={buttonId}
          className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-800/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          <span>{question}</span>
          <span className="text-gray-400 shrink-0" aria-hidden>{open ? '−' : '+'}</span>
        </button>
      </h3>
      <div
        id={panelId}
        role="region"
        aria-labelledby={buttonId}
        hidden={!open}
        className="px-4 pb-4 text-gray-600 dark:text-gray-300 border-t border-gray-100 dark:border-gray-800 pt-3"
      >
        {answer}
      </div>
    </div>
  );
}

export function FaqBlock({ block }) {
  const { title, itemsJson } = block.config || {};
  const items = parseJsonArray(itemsJson).filter((item) => item?.question && item?.answer);
  const sectionTitle = title || 'FAQ';

  return (
    <SectionShell title={sectionTitle}>
      <div className="space-y-3">
        {items.map((item, i) => (
          <FaqAccordionItem
            key={`${block.id}-faq-${i}`}
            id={`${block.id}-${i}`}
            question={item.question}
            answer={item.answer}
            defaultOpen={i === 0}
          />
        ))}
      </div>
    </SectionShell>
  );
}

export function GalleryBlock({ block }) {
  const {
    title,
    mode = 'gallery',
    imageUrl,
    altText,
    caption,
    imagesJson,
    lazyLoad = true,
  } = block.config || {};

  const loading = lazyLoad !== false ? 'lazy' : 'eager';
  const gridSettings = resolveBlockGridSettings(block);
  const gridClass = resolveResponsiveGridClasses(gridSettings);

  if (mode === 'single') {
    return (
      <SectionShell title={title}>
        {imageUrl ? (
          <figure className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 max-w-4xl mx-auto">
            <OptimizedBlockImage src={imageUrl} alt={altText || ''} loading={loading} className="w-full h-auto object-cover" />
            {caption ? <figcaption className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400">{caption}</figcaption> : null}
          </figure>
        ) : null}
      </SectionShell>
    );
  }

  const images = parseJsonArray(imagesJson);
  return (
    <SectionShell title={title}>
      <div className={`grid gap-4 ${gridClass}`}>
        {images.map((img, i) => (
          <figure key={i} className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            {img.url ? (
              <OptimizedBlockImage src={img.url} alt={img.alt || ''} loading={loading} className="w-full h-40 sm:h-48 object-cover" height={192} width={320} />
            ) : null}
            {img.caption ? <figcaption className="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{img.caption}</figcaption> : null}
          </figure>
        ))}
      </div>
    </SectionShell>
  );
}

const CARD_HOVER = {
  lift: 'transition-transform hover:-translate-y-1 hover:shadow-lg',
  border: 'transition-colors hover:border-primary',
  none: '',
};

export function FeatureCardsBlock({ block }) {
  const { title, cardsJson, hoverStyle = 'lift' } = block.config || {};
  const cards = parseJsonArray(cardsJson);
  const hoverClass = CARD_HOVER[hoverStyle] || CARD_HOVER.lift;
  const gridSettings = resolveBlockGridSettings(block);
  const colClass = resolveResponsiveGridClasses(gridSettings);

  return (
    <SectionShell title={title}>
      <div className={`grid gap-4 ${colClass}`}>
        {cards.map((card, i) => {
          const inner = (
            <>
              {card.imageUrl ? (
                <OptimizedBlockImage src={card.imageUrl} alt="" className="w-12 h-12 rounded object-cover mb-3" width={48} height={48} />
              ) : card.icon ? (
                <span className="text-2xl mb-3 block" aria-hidden>{card.icon}</span>
              ) : null}
              {card.title ? <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{card.title}</h3> : null}
              {card.description ? <p className="text-sm text-gray-600 dark:text-gray-300">{card.description}</p> : null}
            </>
          );
          const className = `rounded-xl border border-gray-200 dark:border-gray-700 p-5 h-full ${hoverClass}`;

          if (card.linkUrl) {
            const isExternal = /^https?:\/\//i.test(card.linkUrl);
            return isExternal ? (
              <a key={i} href={card.linkUrl} className={`block ${className}`} rel="noopener noreferrer">
                {inner}
              </a>
            ) : (
              <Link key={i} to={card.linkUrl} className={`block ${className}`}>
                {inner}
              </Link>
            );
          }

          return <div key={i} className={className}>{inner}</div>;
        })}
      </div>
    </SectionShell>
  );
}

export function AdPlacementBlock({ block }) {
  const { placementId, variant = 'banner' } = block.config || {};
  const { useLayoutContainer } = useBlockLayoutContext();
  if (!placementId) return null;
  const wrapClass = useLayoutContainer ? 'w-full py-4' : 'max-w-6xl mx-auto px-4 sm:px-6 py-4';
  return (
    <div className={wrapClass}>
      <AdHost placementId={String(placementId)} variant={variant} />
    </div>
  );
}

export function FeaturedJobsBlock(props) {
  return <DynamicBlockRenderer {...props} />;
}

export function FeaturedScholarshipsBlock(props) {
  return <DynamicBlockRenderer {...props} />;
}

export function FeaturedAdmissionsBlock(props) {
  return <DynamicBlockRenderer {...props} />;
}

export function DynamicUniversitiesBlock(props) {
  return <DynamicBlockRenderer {...props} />;
}

export function DynamicBlogsBlock(props) {
  return <DynamicBlockRenderer {...props} />;
}

export function DynamicCareerBlock(props) {
  return <DynamicBlockRenderer {...props} />;
}

export function DynamicTestimonialsBlock(props) {
  return <DynamicBlockRenderer {...props} />;
}

export function DynamicPartnersBlock(props) {
  return <DynamicBlockRenderer {...props} />;
}

// Legacy listing helper removed — all listing blocks use DynamicBlockRenderer (C.7.0.3)

export function NewsletterBlock({ block }) {
  const { title, subtitle } = block.config || {};
  return (
    <SectionShell>
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-8">
        {title ? <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h2> : null}
        {subtitle ? <p className="text-gray-600 dark:text-gray-300 mb-6">{subtitle}</p> : null}
        <NewsletterSubscribe />
      </div>
    </SectionShell>
  );
}

export function FormBlock({ block, preview }) {
  const { formId, title, subtitle } = block.config || {};
  if (!formId) {
    return (
      <SectionShell>
        <p className="text-sm text-gray-500">Select a form in the block settings.</p>
      </SectionShell>
    );
  }
  return (
    <SectionShell>
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 md:p-8 max-w-xl">
        <FormRenderer
          formId={String(formId)}
          title={title || undefined}
          subtitle={subtitle || undefined}
          preview={preview}
        />
      </div>
    </SectionShell>
  );
}

export function StudentResourcesBlock({ block }) {
  const { title, itemsJson } = block.config || {};
  const items = parseJsonArray(itemsJson);
  const gridClass = resolveResponsiveGridClasses(resolveBlockGridSettings(block));
  return (
    <SectionShell title={title || 'Student Resources'}>
      <div className={`${gridClass} gap-3`}>
        {items.map((item, i) => (
          <Link
            key={i}
            to={item.path || '#'}
            className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-primary"
          >
            <span className="font-medium text-gray-900 dark:text-white">{item.label}</span>
          </Link>
        ))}
      </div>
    </SectionShell>
  );
}

export function ForeignStudyCountriesBlock({ block }) {
  const { title, itemsJson } = block.config || {};
  const items = parseJsonArray(itemsJson);
  return (
    <SectionShell title={title || 'Foreign Study Opportunities'}>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => {
          const to = item.path ? `${item.path}${item.query ? `?${item.query}` : ''}` : '#';
          return (
            <Link
              key={i}
              to={to}
              className="px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 text-sm hover:border-primary"
            >
              {item.name}
            </Link>
          );
        })}
      </div>
    </SectionShell>
  );
}

export function SpacerBlock({ block }) {
  const height = Number(block.config?.height) || 32;
  return <div aria-hidden="true" style={{ height: `${height}px` }} />;
}

export function DividerBlock({ block }) {
  const style = block.config?.style === 'dashed' ? 'border-dashed' : 'border-solid';
  const { useLayoutContainer } = useBlockLayoutContext();
  const wrapClass = useLayoutContainer ? 'w-full py-2' : 'max-w-6xl mx-auto px-4 sm:px-6 py-2';
  return (
    <div className={wrapClass}>
      <hr className={`border-gray-200 dark:border-gray-700 ${style}`} />
    </div>
  );
}

export function LogoGridBlock({ block }) {
  const { title, logosJson, grayscale = false } = block.config || {};
  const logos = parseJsonArray(logosJson);
  const gridClass = resolveResponsiveGridClasses(resolveBlockGridSettings(block));

  return (
    <SectionShell title={title}>
      <div className={`${gridClass} gap-6 items-center`}>
        {logos.map((logo, i) => {
          const img = logo.url ? (
            <OptimizedBlockImage
              src={logo.url}
              alt={logo.alt || ''}
              className={`max-h-12 w-auto mx-auto object-contain ${grayscale ? 'grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition' : ''}`}
              width={120}
              height={48}
            />
          ) : null;
          const content = logo.linkUrl ? (
            <a href={logo.linkUrl} rel="noopener noreferrer" className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded">
              {img}
            </a>
          ) : img;
          return <div key={i} className="flex justify-center">{content}</div>;
        })}
      </div>
    </SectionShell>
  );
}
