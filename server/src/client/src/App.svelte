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
    <Route path="/collection/slide-show" component={CollectionSlideShow} />
    <SiteLayout>
      <Route path="/" component={Home} />
      <Route path="/idea" component={Idea} />
      <Route path="/collection" component={Collection} />
      <Route path="/collection/gallery" component={CollectionGallery} />
      <Route path="/collection/:id" let:params>
        <CollectionDetail id={params.id} />
      </Route>
      <Route path="/image-load" component={ImageLoad} />
    </SiteLayout>
  </Router>
</main>
