import { parseJsonArray } from '@shared/blockValidation.js';
import { RichTextFieldEditor } from './RichTextFieldEditor';
import { FaqItemsEditor, GalleryItemsEditor, FeatureCardsEditor, LogosItemsEditor } from './RepeaterFieldEditors';
import { FormPickerField } from '../../forms/FormPickerField';

/**
 * Renders block-specific custom field editors (C.6.4.10).
 */
export function BlockCustomField({ blockType, field, config, onChange }) {
  if (blockType === 'rich-text' && field.key === 'htmlContent') {
    return (
      <RichTextFieldEditor
        value={config.htmlContent || ''}
        onChange={(html) => onChange('htmlContent', html)}
      />
    );
  }

  if (blockType === 'faq' && field.key === 'itemsJson') {
    const items = parseJsonArray(config.itemsJson);
    return (
      <FaqItemsEditor
        value={items}
        onChange={(items) => onChange('itemsJson', JSON.stringify(items))}
      />
    );
  }

  if (blockType === 'gallery' && field.key === 'imagesJson') {
    const items = parseJsonArray(config.imagesJson);
    return (
      <GalleryItemsEditor
        value={items}
        onChange={(items) => onChange('imagesJson', JSON.stringify(items))}
      />
    );
  }

  if (blockType === 'feature-cards' && field.key === 'cardsJson') {
    const items = parseJsonArray(config.cardsJson);
    return (
      <FeatureCardsEditor
        value={items}
        onChange={(items) => onChange('cardsJson', JSON.stringify(items))}
      />
    );
  }

  if (blockType === 'logo-grid' && field.key === 'logosJson') {
    const items = parseJsonArray(config.logosJson);
    return (
      <LogosItemsEditor
        value={items}
        onChange={(items) => onChange('logosJson', JSON.stringify(items))}
      />
    );
  }

  if (blockType === 'form' && field.key === 'formId') {
    return (
      <FormPickerField
        value={config.formId || ''}
        onChange={(v) => onChange('formId', v)}
      />
    );
  }

  return null;
}

export function isCustomField(blockType, field) {
  if (blockType === 'rich-text' && field.key === 'htmlContent') return true;
  if (blockType === 'faq' && field.key === 'itemsJson') return true;
  if (blockType === 'gallery' && field.key === 'imagesJson') return true;
  if (blockType === 'feature-cards' && field.key === 'cardsJson') return true;
  if (blockType === 'logo-grid' && field.key === 'logosJson') return true;
  if (blockType === 'form' && field.key === 'formId') return true;
  return false;
}

export function shouldHideField(blockType, field, config) {
  if (blockType === 'rich-text' && field.key === 'body') return Boolean(config.htmlContent);
  if (blockType === 'gallery') {
    const mode = config.mode || 'gallery';
    if (mode === 'single' && field.key === 'imagesJson') return true;
    if (mode === 'gallery' && ['imageUrl', 'altText', 'caption'].includes(field.key)) return true;
  }
  return false;
}
