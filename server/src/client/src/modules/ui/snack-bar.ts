interface SnackBarOptions {
    onClick?: (e: MouseEvent) => void;
}

const container = (function () {
    if (typeof window !== 'undefined') {
        const containerName = 'snackbar-container';

        if (!document.getElementById(containerName)) {
            const div = document.createElement('div');
            div.id = containerName;
            div.className = containerName;
            document.body.appendChild(div);
        }
        return document.getElementById(containerName);
    }
}()) as HTMLElement;

export function snackBar(text: string, options?: SnackBarOptions) {
    container.childNodes.forEach(($node) => {
        $node.remove();
    });

    const snackBar = document.createElement('div');
    snackBar.textContent = text;
    snackBar.classList.add('snack-bar');

    if (options?.onClick) {
        snackBar.classList.add('have-event');
        snackBar.addEventListener('click', options.onClick);
    }

    container.appendChild(snackBar);
    snackBar.addEventListener('animationend', () => {
        snackBar.remove();
    });
}
