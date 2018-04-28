//UserId Search Result Display
//#resultId	
  	$("#searchB").click(function(){
      $('#loader-div').removeClass("hidden");
      var userClass = '';
      var color = '';
  		$.ajax({
  			type: "GET",
        url: "/api/classifyUserName/",
        data: {
              userName: $("#userid-search").val()
            },
  			dataType: "json",
  			success: function(data){

          if (data) {

            function showResult(userClass, color) {
                return `<span class="mdl-chip">
                         <span class="mdl-chip__text"><font color="${color}">${userClass}</font></span>
                        </span>`}

            function displayResult(classifyResult) {
                $('#loader-div').addClass("hidden");
                document.querySelector("#resultId").innerHTML = classifyResult;
              }
              if (data.bot == 1) {
                 userClass = 'BOT';
                 color = 'red';
              }
              else {
                userClass = 'HUMAN';
                color = "#6f42c1";
              }

            displayResult(showResult(userClass, color));
          }    
  			 }//end success
  		});
  	});

              
