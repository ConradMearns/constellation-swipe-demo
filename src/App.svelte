<script>
	import ContactCard from './Card.svelte';
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


// Add random message to current focus
	let count = 0;
	function handleClick() {
		count += 1;
	}

// data utilities
	function getEmptyMessage(){
		return {
			body: null,
			before: null,
			after: null
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
//
	function handleRandomMessage() {
		let msg_body = lorem.generateSentences(2);
		console.log(msg_body);

		let msg_hash = funhash(msg_body);
		console.log(msg_hash)

		let msg = getEmptyMessage()
		msg.body = msg_body;

		messages[msg_hash] = msg;
		messages = messages; // im sorry rich harris

		if (focus === null) {
			focus = msg_hash;
		} else {
			let append_to = randomProperty(messages);
			console.log("append_to", append_to)

			append_to.after = msg_hash;
			messages = messages; //im sobbing
		}
	}


// MISC

	let messages = {};
	let focus = null;

</script>



<button on:click={handleRandomMessage}>
	ADD RANDOM
</button>

<h1>Focus: {focus}</h1>


<!-- <ContactCard>
	<span slot="name">
		P. Sherman
	</span>

	<span slot="message">
		{msg}
		
		<br />
		<button on:click={handleClick}>
			Reply
		</button>
	</span>

</ContactCard> -->