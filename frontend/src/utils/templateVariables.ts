export function applyTemplateVariables(
  text: string,
  values: Record<string, string>,
) {
  let result = text;
  Object.entries(values).forEach(([key, value]) => {
    // Both {{key}} and key formats handled
    const placeholder = key.startsWith("{{") ? key : `{{${key}}}`;
    result = result.split(placeholder).join(value || "");
  });
  return result;
}
