
function restore_options(){
    var process_script = localStorage["process_script"]
    if(!process_script){
        process_script = "function process_node(node_data){\n"+
            "\n"+
            "}"
    }
    $('textarea').val(process_script)
}

function save_options(){
    localStorage["process_script"] = $('textarea').val()
}

$(function(){

    restore_options()

    $('#save').click(function(){
        save_options()

        $.ajax({
          type: "GET",
          url: "http://www.google.com",
          data:1,
          success: function(data){
            console.log("got data from google", data)
          }
        });

    });

});