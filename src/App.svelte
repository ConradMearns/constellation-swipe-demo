<script>
	import Conversation from './Conversation.svelte';
	import Viz from "./Viz.svelte";
	import { LoremIpsum } from "lorem-ipsum";

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


// data utilities
	function getEmptyMessage(){
		return {
			body: null,
			before: [],
			after: []
		}
	}
	// function addMessage(msg, ) {

	// }
// Add new random message
	var funhash = function(s) {
		for(var i = 0, h = 0xdeadbeef; i < s.length; i++)
			h = Math.imul(h ^ s.charCodeAt(i), 2654435761);
		return (h ^ h >>> 16) >>> 0;
	};
	var randomProperty = function (obj) {
		var keys = Object.keys(obj);
		return obj[keys[ keys.length * Math.random() << 0]];
	};
	var randomKey = function (obj) {
		var keys = Object.keys(obj);
		return keys[ keys.length * Math.random() << 0];
	};
//
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


	function createLink(a, b) {
		messages[a].after.push(b);
		messages[b].before.push(a);
	}

// MISC

	let messages = {};
	let focus = null;

</script>


<!-- // BUTTONS AND DEMO CONTROLS -->

<h1>Focus: {focus}</h1>
<button on:click={handleRandomMessage}>
	ADD RANDOM
</button>

<button on:click={() => {SHOW_VIZ = !SHOW_VIZ}}>
	{SHOW_VIZ ? 'Showing vis-network' : 'Hiding vis-network'}
</button>

<button on:click={() => {SHOW_SWIPE = !SHOW_SWIPE}}>
	{SHOW_SWIPE ? 'Showing swipe' : 'Hiding swipe'}
</button>


<!-- // the good stuff -->

{#if SHOW_VIZ}
	<Viz messages={messages} />
{/if}

{#if SHOW_SWIPE}
	<Conversation messages={messages} focus={focus} />
{/if}