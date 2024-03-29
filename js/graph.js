function GraphStyle(node_width, node_height, href_length, title_length) {
    this.node_width = node_width;
    this.node_height = node_height;
    this.href_length = href_length;
    this.title_length = title_length;
}

function trim_string(string, trim_size) {
    var new_string;
    if (string.length > trim_size) {
        new_string = string.substring(0, trim_size - 3);
        new_string += '...';
    }
    else
        new_string = string;
    return new_string;
}

function draw_graph(json_nodes, graph_style) {
    //Create a new ST instance
    //Create a new ST instance
    var normal = {};
    // при клике по узлу смещаться к нему или делать его корнем
    normal.checked = true;
    var st = new $jit.ST({
        //id of viz container element
        injectInto: 'infovis',
        //set duration for the animation
        duration: 200,
        //set animation transition type
        transition: $jit.Trans.Quart.easeInOut,
        //set distance between node and its children
        levelDistance: 50,
        //enable panning
        Navigation: {
            enable:true,
            panning:true
        },
        //set node and edge styles
        //set overridable=true for styling individual
        //nodes or edges
        Node: {
            height: graph_style.node_height,
            width: graph_style.node_width,
            type: 'rectangle',
            color: '#aaa',
            overridable: true
        },
        //Add Tips
        Tips: {
            enable: true,
            onShow: function(tip, node) {
                var d = new Date(node.data.visitTime);
                //d.setUTCMilliseconds(node.data.visitTime);
                //display node info in tooltip
                tip.innerHTML = "<div class=\"tip-title\"><b>" + trim_string(node.name, graph_style.title_length) + "</b></div>" +
                    "<div class=\"tip-text\">" +
                        "<a href=\"" + node.data.src + "\">" + trim_string(node.data.src, graph_style.href_length) + "</a>" +
                        "<br>" + node.data.transition +
                        "<div class=\"date-time\">"+ d.format("dd/mm/yyyy HH-MM-ss") +
                        "</div>" +
                    "</div>";
            }
        },
        Edge: {
            type: 'bezier',
            lineWidth: 2,
            color:'#23A4FF',
            overridable: true
        },

        onBeforeCompute: function(node) {
            console.log("loading " + node.name);
        },

        onAfterCompute: function() {
            console.log("done");
        },

        //This method is called on DOM label creation.
        //Use this method to add event handlers and styles to
        //your node.
        onCreateLabel: function(label, node) {
            label.id = node.id;
            var img_src = "chrome://favicon/" + node.data.src;
            label.innerHTML = "<div class=\"label_data\"><img class=\"favicon_img\" src=\"" + img_src + "\"> " + node.name + "</div>";
            label.oncontextmenu = function() {
                console.log('right click');
                chrome.tabs.create({"url":node.data.src});
            };
            label.onclick = function() {
                if (normal.checked) {
                    st.onClick(node.id);
                } else {
                    st.setRoot(node.id, 'animate');
                }
            }
            //set label styles
            var style = label.style;
            style.width = graph_style.node_width - 2 + 'px';
            style.height = graph_style.node_height + 'px';
            style.cursor = 'pointer';
            style.color = '#000';
            //style.fontSize = graph_style.node_height - 6 + 'px';
            style.family = 'Times New Roman';
            style.verticalAlign =  'top';
            style.textAlign = 'left';
            style.align = 'left';
        },

        //This method is called right before plotting
        //a node. It's useful for changing an individual node
        //style properties before plotting it.
        //The data properties prefixed with a dollar
        //sign will override the global node style properties.
        /*onBeforePlotNode: function(node) {
            //add some color to the nodes in the path between the
            //root node and the selected node.
            if (node.selected) {
                node.data.$color = "#ff7";
            }
            else {
                delete node.data.$color;
                //if the node belongs to the last plotted level
                if (!node.anySubnode("exist")) {
                    //count children number
                    var count = 0;
                    node.eachSubnode(function(n) {
                        count++;
                    });
                    //assign a node color based on
                    //how many children it has
                    node.data.$color = ['#aaa', '#baa', '#caa', '#daa', '#eaa', '#faa'][count];
                }
            }
        },*/

        //This method is called right before plotting
        //an edge. It's useful for changing an individual edge
        //style properties before plotting it.
        //Edge data proprties prefixed with a dollar sign will
        //override the Edge global style properties.
        onBeforePlotLine: function(adj) {
            if (adj.nodeFrom.selected && adj.nodeTo.selected) {
                adj.data.$color = "#FF0AFF";
                adj.data.$lineWidth = 3;
            }
            else {
                delete adj.data.$color;
                delete adj.data.$lineWidth;
            }
        }
    });
//load json data
    st.loadJSON(json_nodes);
//compute node positions and layout  
    st.compute();
//optional: make a translation of the tree
    st.geom.translate(new $jit.Complex(-200, 0), "current");
//emulate a click on the root node.
    st.onClick(st.root);
}

function create_test_nodes() {
    var json = {
        id: "node02",
        name: "GoodRoadsRu",
        data: {
            src: "http://goodroads.ru",
            visitTime: 1305472919588.649
        },
        children: [
            {
                id: "node13",
                name: "wwwwwwwwwwwqeqewqeqeqeqeqeqeqeqeqeeqewqeqeqeqeqeqeqeqeqe",
                data: {
                    src: "http://www.google.ru/search?sourceid=chrome&ie=UTF-8&q=text-wrap#pq=text-wrap&hl=ru&cp=9&gs_id=19&xhr=t&q=css+word+wrap&pf=p&sclient=psy&newwindow=1&source=hp&pbx=1&oq=css+word+&aq=0&aqi=g5&aql=&gs_sm=&gs_upl=&bav=on.2,or.r_gc.r_pw.&fp=381d983201ad396e&biw=1366&bih=653",
                    visitTime: 1314529011668.186
                },
                children: [
                    {
                        id: "node24",
                        name: "TheJitOrg",
                        data: {
                            src: "http://thejit.org",
                            visitTime: 12345
                        },
                        children: []
                    },
                    {
                        id: "node222",
                        name: "HabrahabrRu",
                        data: {
                            src: "http://habrahabr.ru",
                            visitTime: 12345
                        },
                        children: []
                    }
                ]
            },
            {
                id: "node125",
                name: "MailRu",
                data: {
                    src: "http://mail.ru",
                    visitTime: 12345
                },
                children: [
                    {
                        id: "node226",
                        name: "VkontakteRu",
                        data: {
                            src: "http://vkontakte.ru",
                            visitTime: 12345
                        },
                        children: []
                    },
                    {
                        id: "node237",
                        name: "SexCom",
                        data: {
                            src: "http://sex.com",
                            visitTime: 12345
                        },
                        children: []
                    }
                ]
            }
        ]
    };
    return json;
}
