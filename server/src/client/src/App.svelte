<script lang="ts">
  import { Router, Route } from "svelte-routing";

  import Header from "./components/Header.svelte";
  import Home from "./pages/Home.svelte";
  import Collection from "./pages/Collection.svelte";
  import CollectionGalley from "./pages/CollectionGalley.svelte";
  import ImageLoad from "./pages/ImageLoad.svelte";
</script>

<main>
  <Router>
    <Header />
    <Route path="/" component={Home} />
    <Route path="/collection" component={Collection} />
    <Route path="/collection/galley" component={CollectionGalley} />
    <Route path="/image-load" component={ImageLoad} />
  </Router>
</main>
