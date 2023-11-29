<script lang="ts">
    import { onDestroy, onMount } from "svelte";

    export let src: string;
    export let alt: string;
    export let width: number = 0;
    export let height: number = 0;
    export let className: string;

    let ref = null;
    let observer: IntersectionObserver;

    onMount(() => {
        observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const img = entry.target as HTMLImageElement;
                    img.src = img.dataset.src;
                    observer.unobserve(img);
                }
            });
        });
    });

    $: {
        if (ref && src && observer) {
            observer.observe(ref);
        }
    }

    onDestroy(() => {
        observer.disconnect();
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
