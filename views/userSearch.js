//UserId Search Result Display
//#resultId
  	$(document).ready(function(){
  		$.ajax({
  			url: "/api/extractUserData",
  			success: function(data){
              console.log(data);
  			 }//end success
  		});
  	};		