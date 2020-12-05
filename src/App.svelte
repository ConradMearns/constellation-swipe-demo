<script>
	import Conversation from './Conversation.svelte';
	import Viz from "./Viz.svelte";
	import { LoremIpsum } from "lorem-ipsum";
	// import './example.js';
	import { getExampleData01, getExampleData02 } from './examples.js';

	let getExampleData = getExampleData02;

	const lorem = new LoremIpsum({
	sentencesPerParagraph: {
		max: 8,
		min: 4
	},
	wordsPerSentence: {
		max: 16,
		min: 4
	}
	});


	let SHOW_VIZ = false;
	let SHOW_SWIPE = true;
	let SHOW_DEBUG = false;


// data utilities
	function getEmptyMessage(){
		return {
			body: null,
			before: [],
			after: []
		}
	}

	function createNewMessage(msg){
		let newMsg = getEmptyMessage();
		let msg_hash = funhash(msg);
		newMsg.body = msg;
		messages[msg_hash] = newMsg;
		createLink(focus, msg_hash);
	}

// Add new random message
	var funhash = function(s) {
		for(var i = 0, h = 0xdeadbeef; i < s.length; i++)
			h = Math.imul(h ^ s.charCodeAt(i), 2654435761);
		return ""+((h ^ h >>> 16) >>> 0);
	};
	var randomProperty = function (obj) {
		var keys = Object.keys(obj);
		return obj[keys[ keys.length * Math.random() << 0]];
	};
	var randomKey = function (obj) {
		var keys = Object.keys(obj);
		return keys[ keys.length * Math.random() << 0];
	};


// handles
	function handleRandomMessage() {
		let msg_body = lorem.generateSentences(2);
		let msg_hash = funhash(msg_body);
		let msg = getEmptyMessage()
		
		msg.body = msg_body;
		messages[msg_hash] = msg;

		if (focus === null) {
			focus = msg_hash;
		} else {
			let r = randomKey(messages);
			createLink(r, msg_hash);
		}
	}

	function handleRandomLink() {
		let a = randomKey(messages);
		let b = randomKey(messages);
		createLink(a, b);
		messages = messages; // sorry rich
	}

	function handleReset () {
		messages = {};
		focus = null;
	}

	function handleAttachToFocus() {
		if (next_message != null && next_message != "") {
			let newMsg = createNewMessage(next_message);
			next_message = "";
			// createLink(focus, newMsg);
		}
	}

	function gotoRandom() {
		focus = randomKey(messages);
	}

	function handleLoadExample() {
		messages = getExampleData01();
	}

///

	function createLink(a, b) {
		if (!messages[a].after.includes(b)) 
		messages[a].after.push(b);

		if (!messages[a].before.includes(a)) 
		messages[b].before.push(a);
	}

// MISC

	let messages = getExampleData();
	let focus = "1";

	let focus_list = [];

	let next_message = "";

</script>


<!-- // BUTTONS AND DEMO CONTROLS -->

<!-- <h1>Focus: {focus}</h1> -->

<button on:click={gotoRandom}>
	GOTO RANDOM
</button>

<button on:click={handleLoadExample}>
	LOAD EXAMPLE
</button>

<br />

<button on:click={handleReset}>
	RESET
</button>

<button on:click={handleRandomMessage}>
	ADD RANDOM MSG
</button>

<button on:click={handleRandomLink}>
	ADD RANDOM LINK
</button>



<br />


<button on:click={() => {SHOW_VIZ = !SHOW_VIZ}}>
	{SHOW_VIZ ? 'Showing vis-network' : 'Hiding vis-network'}
</button>

<button on:click={() => {SHOW_SWIPE = !SHOW_SWIPE}}>
	{SHOW_SWIPE ? 'Showing swipe' : 'Hiding swipe'}
</button>

<button on:click={() => {SHOW_DEBUG = !SHOW_DEBUG}}>
	{SHOW_DEBUG ? 'Showing state debug' : 'Hiding state debug'}
</button>







<!-- // the good stuff -->

{#if SHOW_VIZ}
	<Viz messages={messages} />
{/if}

{#if SHOW_SWIPE}
<p>(If messages appear to overlap, toggle swipe on and off again.)</p>
<h2>Swipe left and right on Before and After cards to browse branches</h2>
	<input bind:value={next_message} >
	<button on:click={handleAttachToFocus}>ATTACH TO FOCUS</button>
	<Conversation messages={messages} focus={focus} />
{/if}


{#if SHOW_DEBUG}
<pre>
State Debug:
{JSON.stringify(messages, null, " ")}
</pre>
{/if}
