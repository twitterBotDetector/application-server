//UserId Search Result Display
//#resultId	
  	$('#searchB').on("click", function(){
  		$.ajax({
  			type: "POST",
  			dataType: "json",
  			success: function(data){
              console.log(data);
              alert(data);
  			 }//end success
  		});
  		});
 