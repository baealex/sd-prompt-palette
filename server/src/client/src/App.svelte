<script lang="ts">
  import { Router, Route } from "svelte-routing";

  import SiteHeader from "./components/SiteHeader.svelte";
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
    <!-- 효율적으로 처리할 방법이 없을까 -->
    <Route path="/">
      <SiteHeader />
      <Home />
    </Route>
    <Route path="/idea">
      <SiteHeader />
      <Idea />
    </Route>
    <Route path="/collection">
      <SiteHeader />
      <Collection />
    </Route>
    <Route path="/collection/gallery">
      <SiteHeader />
      <CollectionGallery />
    </Route>
    <Route path="/collection/slide-show" component={CollectionSlideShow} />
    <Route path="/collection/:id" let:params>
      <SiteHeader />
      <CollectionDetail id={params.id} />
    </Route>
    <Route path="/image-load">
      <SiteHeader />
      <ImageLoad />
    </Route>
  </Router>
</main>
