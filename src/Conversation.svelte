<!-- 

    Mostly from API on svelte-swipe

 -->


<script>

  import { Swipe, SwipeItem } from "svelte-swipe";

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
    height: 30vh;
    width: 100%;
	background: red;
  }

.test{
	background: gray;
}

</style>

<div class="swipe-holder">
  <Swipe {...swipeConfig}>
    <SwipeItem>
      <!-- <img src="./ima/ges/1.jpg" alt=""> -->
	  <!-- <h1>Hello!</h1> -->
		<div class="test">
		hello mudda
		</div>
    </SwipeItem>

    <SwipeItem>
      <!-- <img src="./images/2.jpg" alt=""> -->
	  <h1>Hello!</h1>
    </SwipeItem>

    <SwipeItem>
      <!-- <img src="./images/3.jpg" alt=""> -->
	  <h1>Hello!</h1>
    </SwipeItem>

    <SwipeItem>
      <!-- <img src="./images/4.jpg" alt=""> -->
	  <h1>Hello!</h1>
    </SwipeItem>
  </Swipe>
</div>