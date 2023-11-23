<script lang="ts">
    import { onMount } from "svelte";

    export let src: string;
    export let alt: string;
    export let width: number = 0;
    export let height: number = 0;
    export let timeout: number = 0;
    export let className: string;

    let ref = null;
    let observer: IntersectionObserver;

    onMount(() => {
        observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const img = entry.target as HTMLImageElement;
                    img.src = img.dataset.src;
                    img.classList.remove("lazy-loaded");
                    observer.unobserve(img);
                }
            });
        });

        if (timeout) {
            setTimeout(() => {
                observer.observe(ref);
            }, timeout);
        } else {
            observer.observe(ref);
        }
    });
</script>

<img
    bind:this={ref}
    class={className}
    src={src.replace(src.split(".").pop(), "preview.jpg")}
    data-src={src}
    width={width ? width : "auto"}
    height={height ? height : "auto"}
    {alt}
/>
