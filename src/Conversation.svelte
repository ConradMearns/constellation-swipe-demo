<script>
    // import ContactCard from './Card.svelte';
    import Message from './Message.svelte';
    import { Swipe, SwipeItem } from "svelte-swipe";
    import { LoremIpsum } from "lorem-ipsum";

    export let focus;
    export let messages;

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

    const swipeConfig = {
        autoplay: false,
        delay: 2000,
        showIndicators: false,
        transitionDuration: 100,
        defaultIndex: 0,
    };

</script>

<style>
    .swipe-holder{
        height: 25vh;
        width: 100%;
        /* background: lightblue; */
    }
</style>


{#if focus===null}
    <p>Nothing yet! Add random message to get started :)</p>
{:else}


<div class="swipe-holder">

    {#if messages[focus].before.length > 0}
    <Swipe {...swipeConfig}>
    {#each messages[focus].before as bef, i}
        <SwipeItem>
            <!-- <ContactCard>
                <span slot="name">
                    (Before) ({i+1}/{messages[focus].before.length}) {bef}
                </span>
                <span slot="message">
                    {messages[bef].body}
                </span>
            </ContactCard> -->
            <Message 
                body={messages[bef].body}
                index={i+1}
                index_limit={messages[focus].before.length}
                id={bef}
            />
        </SwipeItem>
    {/each}
    </Swipe>
    {/if}


    <Swipe {...swipeConfig}>
        <SwipeItem>
            <Message 
                body={messages[focus].body}
                id={focus}
            />
        </SwipeItem>
    </Swipe>


    {#if messages[focus].after.length > 0}
    <Swipe {...swipeConfig}>
    {#each messages[focus].after as aft, i}
        <SwipeItem>
            <Message 
                body={messages[aft].body}
                index={i+1}
                index_limit={messages[focus].after.length}
                id={aft}
            />
        </SwipeItem>
    {/each}
    </Swipe>
    {/if}

</div>


{/if}
