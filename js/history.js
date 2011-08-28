
function getHistoryNodes(callback)  {
  var maxResults = 100;
  var microsecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
  var microsecondsPerHour = 1000 * 60 * 60;
  var microsecondsPerMinute = 1000 * 60;
  
  var startTime = (new Date).getTime() - microsecondsPerMinute * 10;
  
  chrome.history.search({
      'text'      : '',
      'startTime' : startTime, 
      'maxResults': maxResults
    },
    function (historyItems) {
        getVisits(historyItems, startTime, callback); 
    });
}

function getVisits(historyItems, startTime, callback) {
    var numRequestsOutstanding = historyItems.length;
    var expectedAncestors = {};
    var addedAncestors = {};

    var tree = {
        'id' : 0,
        'name' : "Peacock",
        'children' : []
    };

    // process visits for URL
    var processVisits = function(name, url, notOlderThen, visitItems) {

        // disable this URL for debug reasons
        // XXX
        if (url.indexOf('chrome-extension') == 0) {
            --numRequestsOutstanding;
            return;
        }
        
        for (var i = 0; i < visitItems.length;  i++) {
            var visitItem = visitItems[i];

            if (visitItem.visitTime < notOlderThen) {
                continue;
            }

            console.log(name + '  ' + visitItem.transition);

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
            //for (var key in expectedAncestors) {
            //    tree.children.push(expectedAncestors[key]);
            //}

            callback(tree);
        }
    };

    for (var i = 0; i < historyItems.length; ++i) {
        var processVisitsWithUrl = function(name, url, notOlderThen) {
            return function(visitItems) {
                processVisits(name, url, notOlderThen, visitItems);
            };
        };
        chrome.history.getVisits(
            {
                url: historyItems[i].url
            },
            processVisitsWithUrl(historyItems[i].title, historyItems[i].url, startTime));
    }

    if (!numRequestsOutstanding) {
        callback(tree);
    }
}

