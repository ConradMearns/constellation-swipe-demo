<script>
    import ContactCard from './Card.svelte';
    export let index = 0;
    export let index_limit = 0;
    export let id = null;
    export let body = null;
</script>

<ContactCard>
    <!-- <span slot="name">
        ({index}/{index_limit}) {id}
    </span> -->
    <span slot="message">
        {body}
    </span>
</ContactCard>
