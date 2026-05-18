export function applyTemplateVariables(
  text: string,
  values: Record<string, string>,
) {
  if (!text) return "";
  let result = text;
  Object.entries(values).forEach(([key, value]) => {
    const placeholder = key.startsWith("{{") ? key : `{{${key}}}`;
    result = result.split(placeholder).join(value || "");
  });
  return result;
}

/**
 * Converts template body (with pseudo-HTML tags and \n) to real HTML for email clients.
 */
export function renderEmailTemplate(text: string) {
  if (!text) return "";

  // 1. Escape HTML for safety (prevent raw <script> etc from being injected)
  let html = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

  // 2. Convert pseudo-HTML tags back to real HTML
  // We do this BEFORE converting \n to <br/> to avoid issues with tags spanning multiple lines
  html = html
    .replace(/&lt;b&gt;([\s\S]*?)&lt;\/b&gt;/g, '<b style="font-weight: 800">$1</b>')
    .replace(/&lt;i&gt;([\s\S]*?)&lt;\/i&gt;/g, "<i>$1</i>")
    .replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/g, "<u>$1</u>")
    .replace(/&lt;s&gt;([\s\S]*?)&lt;\/s&gt;/g, "<s>$1</s>")
    .replace(/&lt;mark&gt;([\s\S]*?)&lt;\/mark&gt;/g, '<mark style="background-color: #fef08a; padding: 0 2px; border-radius: 4px;">$1</mark>')
    .replace(/&lt;li&gt;([\s\S]*?)&lt;\/li&gt;/g, '<div style="display: flex; gap: 8px; margin: 4px 0;"><span style="color: #10b981">•</span><span>$1</span></div>')
    .replace(/&lt;a href=&quot;([\s\S]*?)&quot;&gt;([\s\S]*?)&lt;\/a&gt;/g, '<a href="$1" target="_blank" style="color: #3b82f6; text-decoration: underline;">$2</a>')
    .replace(/&lt;color hex=&quot;([\s\S]*?)&quot;&gt;([\s\S]*?)&lt;\/color&gt;/g, '<span style="color: $1">$2</span>')
    .replace(/&lt;font face=&quot;([\s\S]*?)&quot;&gt;([\s\S]*?)&lt;\/font&gt;/g, '<span style="font-family: $1">$2</span>')
    .replace(/&lt;size value=&quot;([\s\S]*?)&quot;&gt;([\s\S]*?)&lt;\/size&gt;/g, '<span style="font-size: $1">$2</span>');

  // 3. Convert newlines to <br/>
  html = html.replace(/\n/g, "<br/>");

  return html;
}
