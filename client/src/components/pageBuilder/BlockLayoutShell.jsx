import { memo } from 'react';
import { BlockLayoutContext } from './BlockLayoutContext';
import { useBlockEnterAnimation } from './useBlockEnterAnimation';
import { useBlockLayoutPresentation } from './useBlockLayoutPresentation';

/**
 * Responsive layout shell — visibility, container, spacing, background, typography, animation.
 * @param {{ block: import('@shared/blockSchema.js').PageBlock; children: import('react').ReactNode; className?: string }} props
 */
function BlockLayoutShellInner({ block, children, className = '' }) {
  const {
    visibilityClass,
    containerClass,
    presetClass,
    typographyClass,
    spacingStyle,
    backgroundStyle,
    animationClass,
    animation,
  } = useBlockLayoutPresentation(block);

  const { ref, entered } = useBlockEnterAnimation(animation);
  const hasBackground = Object.keys(backgroundStyle).length > 0;

  const enterClass = animation && animation !== 'none'
    ? (entered ? animationClass : 'pb-animate-pending')
    : '';

  return (
    <BlockLayoutContext.Provider value={{ useLayoutContainer: true, typographyClass }}>
      <div
        ref={ref}
        className={[
          'page-builder-block-shell',
          visibilityClass,
          presetClass,
          enterClass,
          className,
        ].filter(Boolean).join(' ')}
        style={{
          marginTop: spacingStyle.marginTop,
          marginBottom: spacingStyle.marginBottom,
        }}
        data-block-shell={block.id}
      >
        <div
          className={`relative ${hasBackground ? '' : ''}`}
          style={hasBackground ? backgroundStyle : undefined}
        >
          <div
            className={`${containerClass} px-4 sm:px-6`}
            style={{
              paddingTop: spacingStyle.paddingTop,
              paddingBottom: spacingStyle.paddingBottom,
            }}
          >
            <div className={typographyClass || undefined}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </BlockLayoutContext.Provider>
  );
}

export const BlockLayoutShell = memo(BlockLayoutShellInner, (prev, next) => (
  prev.block === next.block && prev.className === next.className
));
