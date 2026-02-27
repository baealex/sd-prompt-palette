<script lang="ts">
    import { Router, Route } from "svelte-routing";

    import SiteLayout from "./components/SiteLayout.svelte";
    import Home from "./pages/Home.svelte";
    import Idea from "./pages/Idea.svelte";
    import Collection from "./pages/Collection.svelte";
    import CollectionDetail from "./pages/CollectionDetail.svelte";
    import CollectionGallery from "./pages/CollectionGallery.svelte";
    import CollectionSlideShow from "./pages/CollectionSlideShow.svelte";
    import ImageLoad from "./pages/ImageLoad.svelte";
</script>

<main>
    <Router>
        <Route path="/collection/slide-show">
            <CollectionSlideShow />
        </Route>
        <SiteLayout>
            <Route path="/">
                <Home />
            </Route>
            <Route path="/idea">
                <Idea />
            </Route>
            <Route path="/collection">
                <Collection />
            </Route>
            <Route path="/collection/gallery">
                <CollectionGallery />
            </Route>
            <Route path="/collection/:id" let:params>
                <CollectionDetail id={Number(params.id)} />
            </Route>
            <Route path="/image-load">
                <ImageLoad />
            </Route>
        </SiteLayout>
    </Router>
</main>
