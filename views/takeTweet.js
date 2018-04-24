	//Tweet Display
	$(document).ready(function () {
		var userId = [];
		$.ajax({
			url: "/api/fetchTweets",
			dataType: "json",
			success: function (data) {
				if (data) {

					$('#tweetDisplay').removeClass("hidden");
					$('#logOut').removeClass("hidden");
                     $('signIn').attr("disabled", true);
					function getTweetDetails(data, userClass, color) {
						return `<div class="col-md-4 col-12" id="card-space">
                   <div class="card w-75 border-light">
                      <div class="card-header">
                      <img src=${data.user.profile_image_url_https} id="profile-image"></img>
      	                <h5 class="alert-link" id="name-person">${data.user.name}</h5>
						<h6 class="alert-link screen_name">@${data.user.screen_name}</h6>
						<p id="classification"><u><font color="${color}">${userClass}</font></u></p>
                        <p id="verify">Verified User : <span class="badge badge-info">${data.user.verified}</span></p>	
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
				} //endIf
				for (var i = 0; i < data.length; i++) {
					userId[i] = (data[i].user.id);
				}

                var color = 'red';
				for (let i = 0; i < userId.length; i++) {
					let element = userId[i];
					// console.log(element);
					$.ajax({
						url: "/api/extractUserData/",
						method: "POST",
						type: "POST",
						data: {
							userId: element
						},
						dataType: "json",
						success: function (userClass) {
							console.log(userClass);

							function showTweets(tweets) {
								document.querySelector("#tweetDisplay").innerHTML += tweets;
							}
							
							if (userClass.bot == 1) {
								userClass = "Bot";
                                color = "red";
							}
							else {
								userClass = "Human";
								color = "green";
							}

							showTweets(getTweetDetails(data[i], userClass, color));
						} //end success
					});
				}
			} //endSuccess
		});
	});