<script>
    import ContactCard from './Card.svelte';
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

    <Swipe {...swipeConfig}>
    {#each messages[focus].before as bef}
        <SwipeItem>
            <ContactCard>
                <span slot="name">
                    Before
                </span>
                <span slot="message">
                    {messages[bef].body}
                </span>
            </ContactCard>
        </SwipeItem>
    {/each}
    </Swipe>


    <Swipe {...swipeConfig}>
        <SwipeItem>
            <ContactCard>
                <span slot="name">
                    Focus (this shows how swiping _should_ work)
                </span>
                <span slot="message">
                    {messages[focus].body}
                </span>

            </ContactCard>
        </SwipeItem>

        <!-- <SwipeItem>
            <ContactCard>
                <span slot="name">
                    Theres another message too
                </span>
                <span slot="message">
                    {messages[focus].body}
                </span>

            </ContactCard>
        </SwipeItem>

        <SwipeItem>
            <ContactCard>
                <span slot="name">
                    Keep 'adding random' until before and after have swipes available...
                </span>
                <span slot="message">
                    {messages[focus].body}
                </span>

            </ContactCard>
        </SwipeItem> -->
    </Swipe>



    <Swipe {...swipeConfig}>
    {#each messages[focus].after as aft}
        <SwipeItem>
            <ContactCard>
                <span slot="name">
                    After
                </span>
                <span slot="message">
                    {messages[aft].body}
                </span>
            </ContactCard>
        </SwipeItem>
    {/each}
    </Swipe>


</div>


{/if}





<!-- idk, i just like my scraps -->



                <!-- <span slot="name">
                    P. Sherman
                </span> -->
