export async function copyToClipboard(text: string): Promise<boolean> {
    if (navigator.clipboard?.writeText) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // fallback below
        }
    }
    try {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
    } catch {
        return false;
    }
}

export async function shareLink(url: string, title?: string, text?: string): Promise<void> {
    if (navigator.share) {
        try {
            await navigator.share({ url, title, text });
            return;
        } catch {
            // fall through to copy
        }
    }
    await copyToClipboard(url);
}
