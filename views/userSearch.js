//UserId Search Result Display
//#resultId	
  	$("#searchB").click(function(){
  		$.ajax({
  			type: "GET",
        url: "/api/classifyUserName/",
        data: {
              userName: $("#userid-search").val()
            },
  			dataType: "json",
  			success: function(data){
            if(data){
              console.log(data);
              if (data.bot == 1) {
                document.getElementById("#resultId").innerHTML = 'BOT';
                $("#resultId").css('color', 'red');
              }
              else {
                document.getElementById("#resultId").innerHTML = 'HUMAN';
                $("#resultId").css('color', '"#0f9b0f"');
              }
            }
  			 }//end success
  		});
  	});