	//Tweet Display
  	$(document).ready(function(){
  		$.ajax({
  			url: "/api/fetchTweets",
  			dataType: "json",
  			success: function(data){
  				//console.log(data);
  				if (data) {
                  
                  $('#tweetDisplay').removeClass("hidden");     
            
                 function showTweets(tweets){
                   document.querySelector("#tweetDisplay").innerHTML += tweets;
                 }
                  data.map(getTweetDetails).forEach(showTweets);
                 function getTweetDetails(data)
                 {  
                  return `<div class="col-md-4 col-12" id="card-space">
                   <div class="card w-75 border-light">
                      <div class="card-header">
                      <img src=${data.user.profile_image_url_https}></img>
      	                <h5 class="alert-link">${data.user.name}</h5>
                        <h6 class="alert-link screen_name">@${data.user.screen_name}</h6>
                        <p id="verify">Verified User : <span class="badge badge-warning">${data.user.verified}</span></p>	
                       </div>
           
	    	        <div class="card-body">
	    	         <p class="card-text">${data.text}</p>
	    	         <p class="card-text">TweetDevice - ${data.source}</p>
	    	         <ul class="list-unstyled list-inline font-small mt-3">
                    <li class="list-inline-item pr-2 white-text"><i class="fa fa-clock-o pr-1"></i>${data.created_at}</li>
                 </ul>
                </div> 

	    	        <!-- Card footer -->
                   <!-- <div class="card-footer bg-transparent border-dark">
                      <ul class="list-unstyled list-inline font-small mt-3">
                        <li class="list-inline-item pr-2 white-text"><i class="fa fa-clock-o pr-1"></i>${data.created_at}</li>
                      </ul>
                    </div>-->
	               </div>
                  </div>`
                 }
                //$('.card-header').append(data[0].created_at);
  				}//endIf
  			}//endSuccess
  		});
  		
  	});