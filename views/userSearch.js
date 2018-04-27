//UserId Search Result Display
//#resultId	
  	$('#searchB').click(function(e){
      e.preventDefault();
      var userClass='';
  		$.ajax({
  			type: "GET",
        url: "/api/classifyUserName/",
        data: {
              userName: $("#userid-search").val()
            },
  			dataType: "json",
  			success: function(data){
              console.log(data);
              if (data.bot == 1) {
                document.getElementById("#resultId").innerHTML = 'BOT';
                $("#resultId").css('color', 'red');
              }
              else {
                color = "#0f9b0f";
                document.getElementById("#resultId").innerHTML = 'HUMAN';
                $("#resultId").css('color', '"#0f9b0f"');
              }
            
  			 }//end success
  		});
  	});
 