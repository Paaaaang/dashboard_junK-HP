export function applyTemplateVariables(
  text: string,
  values: Record<'companyName' | 'courseName' | 'deadline' | 'contactPhone' | 'managerName', string>,
) {
  return text
    .split('{{companyName}}')
    .join(values.companyName)
    .split('{{courseName}}')
    .join(values.courseName)
    .split('{{deadline}}')
    .join(values.deadline)
    .split('{{contactPhone}}')
    .join(values.contactPhone)
    .split('{{managerName}}')
    .join(values.managerName);
}
