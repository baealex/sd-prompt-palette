<script lang="ts">
  import { Router, Route } from "svelte-routing";

  import SiteHeader from "./components/SiteHeader.svelte";
  import Home from "./pages/Home.svelte";
  import Collection from "./pages/Collection.svelte";
  import CollectionDetail from "./pages/CollectionDetail.svelte";
  import CollectionGalley from "./pages/CollectionGalley.svelte";
  import ImageLoad from "./pages/ImageLoad.svelte";
</script>

<main>
  <Router>
    <SiteHeader />
    <Route path="/" component={Home} />
    <Route path="/collection" component={Collection} />
    <Route path="/collection/galley" component={CollectionGalley} />
    <Route path="/collection/:id" let:params>
      <CollectionDetail id={params.id} />
    </Route>
    <Route path="/image-load" component={ImageLoad} />
  </Router>
</main>
