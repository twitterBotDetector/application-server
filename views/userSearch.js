//UserId Search Result Display
//#resultId
  	$('#searchB').on("click", function(){
  		$.ajax({
  			url: "/api/extractUserData",
  			success: function(data){
              console.log(data);
  			 }//end success
  		});
  	});		