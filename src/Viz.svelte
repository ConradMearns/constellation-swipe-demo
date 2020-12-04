<!-- <script
    type="text/javascript"
    src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"
>
</script>
 -->


<script>
    import { onMount } from 'svelte';
    import { DataSet } from 'vis-data';
	import { Network } from "vis-network";

	export let messages;


    // create a network

    onMount(async () => {
        // const res = await fetch(`https://jsonplaceholder.typicode.com/photos?_limit=20`);
        // photos = await res.json();
            // create an array with nodes
        var nodes = new DataSet([
        { id: 1, label: "Node 1" },
        { id: 2, label: "Node 2" },
        { id: 3, label: "Node 3" },
        { id: 4, label: "Node 4" },
        { id: 5, label: "Node 5" },
        ]);

        // create an array with edges
        var edges = new DataSet([
        // { from: 1, to: 3 },
        // { from: 1, to: 2 },
        // { from: 2, to: 4 },
        // { from: 2, to: 5 },
        // { from: 3, to: 3 },
        ]);

        var container = document.getElementById("mynetwork");
        var data = {
            nodes: nodes,
            edges: edges,
        };
        var options = {};
        var network = new Network(container, data, options);
	});
</script>

<style type="text/css">
    #mynetwork {
    width: 100%;
    height: 400px;
    border: 1px solid lightgray;
    }
</style>


<body>
    <div id="mynetwork"></div>
</body>