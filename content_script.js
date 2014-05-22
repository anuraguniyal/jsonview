
chrome.extension.onMessage.addListener(function(request, sender, sendResponse) {
    console.log("got request", request)
    if(request.name = "view_json") {
        view_json(request.data.selectionText)
    }
});

g_options = {}
g_usercode = {}
function load_usercode(){
    try{
        eval(g_options.process_script)
        g_usercode.process_node = process_node
    }catch(e){
        g_usercode.process_node = null
        console.log("error in loading usercode",e.name, e.message)
    }
}
function update_options(){
    chrome.extension.sendMessage({method: "get_options"}, function(response) {
        g_options = response
        //load user code, eval inside a func so our scope is restricted
        load_usercode()
    });
}

function process_node_by_user_code(key, value, node_data, orig_data, level){
    try{
        if(g_usercode.process_node) g_usercode.process_node.call(null, key, value, node_data, orig_data, level)
    }catch(e){
        console.log("error in calling usercode",e.name, e.message)
    }
}
function view_json(json_text){
    // update extension options, this is a hack, because message passing is asynchcronous
    // so we wait for a second
    // but if we won't get latest options this time but next time it should be there
    var options = update_options()
    setTimeout(function(){_view_json(json_text)}, 300)
}

function _view_json(json_text){
    var jsonDlg = $('<div><div class="json-tree">Loading JSON...</div></div>');
    jsonDlg.dialog({
        modal: false,
        title: "JSON View",
        show: 'clip',
        hide: 'clip',
        width: 'auto',
        buttons: [
            {text: "Expand All", click: function() { expandAll($(this))}},
            {text: "Collapse All", click: function() { expandAll($(this), false)}},
            {text: "Close", click: function() {$(this).dialog("close")}}
        ]
    });

    add_dynatree(jsonDlg.find(".json-tree"), json_text)
}

function expandAll(dlg, expand){
    if(expand==null) expand=true
    dlg.find(".json-tree").dynatree("getRoot").visit(function(n){
        n.expand(expand);
    });

}
function add_dynatree(tree_div, json_text){

    try{
        data = $.parseJSON(json_text)
        tree_data = convert_json_to_dynatree_data('JSON', data, data)
    }catch(e){
        tree_data = {'JSON ERROR':""+e}
        tree_data = convert_json_to_dynatree_data('JSON', tree_data)
    }

    tree_div.dynatree({
      children: tree_data['children']
    });
}

function convert_json_to_dynatree_data(key, data, orig_data, level){
    level = level || 0
    if(data === null || typeof data != 'object'){
        var value = String(data)
        var data = {'title':key+': '+value}
        process_node_by_user_code(key, value, data, orig_data, level)
        //encode title, after user processing e.g. he may add < or newlines etc
        data['title'] = multiLineHtmlEncode(data['title'])
        return data
    }
    var children = []
    var tree_data = {'title': key, 'children': children, isFolder: true}
    for(var ckey in data){
        children.push(convert_json_to_dynatree_data(ckey, data[ckey], orig_data, level+1))
    }
    return tree_data
}

function add_jstree(tree_div, json_text){
    try{
        data = $.parseJSON(json_text)
        tree_data = convert_json_to_jstree_data('JSON', data)
    }catch(e){
        tree_data = {'JSON ERROR':""+e}
        tree_data = convert_json_to_tree_data('JSON', tree_data)
    }

    tree_div.jstree({
        // List of active plugins
        "plugins" : [
            "themes","json_data","ui","crrm","dnd","search"
        ],
    "json_data" :{data: tree_data}
    });
}

function convert_json_to_jstree_data(key, data, level){
    level = level || 0
    if(data === null || typeof data != 'object'){
        var value = String(data)
        var data = {'title':key+': '+value}
        if(key=='NIMBUS_VCQA_LAUNCHER_RUN_ID'){
            data['attr'] = {'href': "http://cat.eng.vmware.com/testrun/"+value}
        }else{
            data['attr'] = {'href': ""}
        }
        return {'data':data}
    }
    var children = []
    var tree_data = {'data': {'title':key}, 'children': children, "state" : 'open', 'icon':'ui-icon-bullet'}
    for(var ckey in data){
        children.push(convert_json_to_jstree_data(ckey, data[ckey], level+1))
    }
    return tree_data
}

function multiLineHtmlEncode(value) {
    var lines = value.split(/\r\n|\r|\n/);
    for (var i = 0; i < lines.length; i++) {
        lines[i] = htmlEscape(lines[i]);
    }
    return lines.join('<br>');
}

function htmlEncode(value){
  //create a in-memory div, set it's inner text(which jQuery automatically encodes)
  //then grab the encoded contents back out.  The div never exists on the page.
  return $('<div/>').text(value).html();
}

function htmlEscape(str) {
    return String(str)
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/ /g, '&nbsp;')
}

function htmlDecode(value){
  return $('<div/>').html(value).text();
}

