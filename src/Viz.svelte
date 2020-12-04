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
    let breaks = -20;

    let network = null;
    let container = null;

    $: {
        breaks = breaks; // this update gets executed whenever something on the RHS of an assignment is updated
        network = makeNetwork(container, makeData(messages));
    }

    function makeNetwork(container, data) {
        if ( container === null) return null;

        return new Network(container, data, {});
    }

    function insertBreaks(text) {
        var res = text.split(" ");
        let newText = "";
        var i = 0;

        if (breaks < 0) {
            return text.substr(0, -breaks);
        }
        
        for (i = 0; i < res.length; i++) {
            newText += res[i];
            if ((i % breaks) == breaks-1) {
                newText += "\n";
            } else {
                newText += " ";
            }
        }
        
        // console.log(newText);
        return newText;
    }

    function makeNodes(messages) {
        // for every message, make a node with id and label
        var keys = Object.keys(messages);
        var nodes = new DataSet([
            //   { id: 1, label: "Node 1" },
        ]);
        keys.forEach(key => {
            nodes.add({
                id: key,
                label: insertBreaks(messages[key].body)
                // label: messages[key].body.substr(0, 5)
            });
            // console.log("message:", messages[key].body.substr(0, 5));
        });


        return nodes;

    }
    function makeEdges(messages) {
        var keys = Object.keys(messages);
        var edges = new DataSet([]);
        keys.forEach(key => {
            messages[key].after.forEach(aft => {
                edges.add({ from: key, to: aft });
            });

            messages[key].before.forEach(bel => {
                edges.add({ from: bel, to: key });
            });
        });

        return edges;
    }
    function makeData(messages) {
        return {
            nodes: makeNodes(messages),
            edges: makeEdges(messages),
        };
    }

    onMount(async () => {
        container = document.getElementById("mynetwork");
	});
</script>

<style type="text/css">
    #mynetwork {
    width: 100%;
    height: 800px;
    border: 1px solid lightgray;
    }
</style>


<p>Cutoff: negative will preform substr. Positive will break by wordcount</p><input type=number bind:value={breaks} min=-50 max=10>


<div id="mynetwork"></div>