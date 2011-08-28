
function getHistoryNodes(callback)  {
  var maxResults = 100;
  var microsecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
  var microsecondsPerHour = 1000 * 60 * 60;
  var microsecondsPerMinute = 1000 * 60;

  chrome.history.search({
      'text'      : '',
      'startTime' : (new Date).getTime() - microsecondsPerMinute,
      'maxResults': maxResults
    },
    function (historyItems) {
        getVisits(historyItems, callback); 
    });
}

function getVisits(historyItems, callback) {
    var numRequestsOutstanding = historyItems.length;
    var expectedAncestors = {};
    var addedAncestors = {};

    var tree = {
        'id' : 0,
        'children' : []
    };

    // process visits for URL
    var processVisits = function(url, name, visitItems) {

        console.log(url);
        console.log(name);

        // disable this URL for debug reasons
        // XXX
        if (url.indexOf('chrome-extension') == 0) {
            --numRequestsOutstanding;
            return;
        }
        
        for (var i = 0; i < visitItems.length;  i++) {
            var visitItem = visitItems[i];

            // XXX
            //if (visitItem.transition == "reload") {
            //    continue;
            //}

            var newNode = {
                'id' : visitItem.visitId,
                'name' : name,
                'data' : {
                    'src' : url,
                    'visitTime' : visitItem.visitTime,
                    'transition' : visitItem.transition 
                },
                'children' : []
            };

            addedAncestors[visitItem.visitId] = newNode;

            // link with ancestor
            var ancestorId = visitItem.referringVisitId;
            if (ancestorId == "0" || visitItem.transition != 'link') {
                // this node has no referrer, pushing it to the second level of main tree
                tree.children.push(newNode);
            } else {
                // this node has referrer...
                var ancestorNode = addedAncestors[ancestorId];
                if (ancestorNode) {
                    // 1) ...and ancestor already exists
                    ancestorNode.children.push(newNode);
                } else {
                    // 2) ... and ancestor doesn't exist yet, make ancestor expected by it's children
                    if (!expectedAncestors[ancestorId]) {
                        expectedAncestors[ancestorId] = [];
                    }
                    expectedAncestors[ancestorId].push(newNode);
                }
            }
            
            // link with children
            var children = expectedAncestors[visitItem.visitId];
            if (children) {
                // there is some children waiting for this node
                children.forEach(function(child) {
                    newNode.children.push(child);
                });
                delete expectedAncestors[visitItem.visitId];
            }
        }
        
        if (!--numRequestsOutstanding) {
            callback(tree);
        }
    };

    for (var i = 0; i < historyItems.length; ++i) {
        var processVisitsWithUrl = function(url, title) {
            return function(visitItems) {
                processVisits(url, title, visitItems);
            };
        };
        chrome.history.getVisits(
            {
                url: historyItems[i].url
            },
            processVisitsWithUrl(
                historyItems[i].url,
                historyItems[i].title));
    }

    if (!numRequestsOutstanding) {
        callback(tree);
    }
}

