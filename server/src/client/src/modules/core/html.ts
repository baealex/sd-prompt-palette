export function html(texts: TemplateStringsArray, ...values: unknown[]) {
    return texts.map((text, i) => text + (values[i] || '')).join('');
}

export function htmlToElement(text: string) {
    const template = document.createElement('template');
    template.innerHTML = text.trim();
    return template.content.firstChild as HTMLElement;
}
