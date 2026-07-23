import { getEmployerWidgetDefinition } from './widgetRegistry';
import { getEmployerWidgetComponent } from './widgetComponentMap';

export function EmployerWidgetRenderer({ widgetType, data }) {
  const definition = getEmployerWidgetDefinition(widgetType);
  if (!definition) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500">
        Unknown widget: {widgetType}
      </div>
    );
  }
  const Component = getEmployerWidgetComponent(definition.rendererKey);
  if (!Component) {
    return (
      <div className="p-4 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-sm text-gray-500">
        Missing renderer: {definition.rendererKey}
      </div>
    );
  }
  return <Component data={data} />;
}

export function EmployerWidgetZone({ widgetTypes, widgets }) {
  return (
    <div className="space-y-4">
      {(widgetTypes || []).map((type) => (
        <EmployerWidgetRenderer key={type} widgetType={type} data={widgets?.[type]} />
      ))}
    </div>
  );
}
