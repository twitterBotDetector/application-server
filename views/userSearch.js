//UserId Search Result Display
//#resultId
$(document).ready(function(){  	
  	$('#searchB').on("click", function(){
  		$.ajax({
  			url: "/",
  			method: "POST",
  			type: "POST",
  			dataType: "json",
  			success: function(data){
              console.log(data);
              alert(data);
  			 }//end success
  		});
  		});
  	});	