import { getDashboardWidgetDefinition } from './widgetRegistry';
import { getWidgetComponent } from './widgetComponentMap';

/**
 * Loads and renders a single dashboard widget from registry configuration.
 * @param {{ widgetType: string; data?: unknown }} props
 */
export function WidgetRenderer({ widgetType, data }) {
  const definition = getDashboardWidgetDefinition(widgetType);
  if (!definition) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500">
        Unknown widget: {widgetType}
      </div>
    );
  }

  const Component = getWidgetComponent(definition.rendererKey);
  if (!Component) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500">
        Missing renderer: {definition.rendererKey}
      </div>
    );
  }

  return <Component data={data} />;
}

/**
 * Renders widgets for a layout zone.
 * @param {{ widgetTypes: string[]; widgets: Record<string, unknown> }} props
 */
export function WidgetZone({ widgetTypes, widgets }) {
  return (
    <div className="space-y-6">
      {widgetTypes.map((type) => (
        <WidgetRenderer key={type} widgetType={type} data={widgets?.[type]} />
      ))}
    </div>
  );
}
