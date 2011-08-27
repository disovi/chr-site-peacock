
function buildHistoryList(divName, data) {
  var div = document.getElementById(divName);

  var ul = document.createElement('ul');
  div.appendChild(ul);

  for (var i = 0, ie = data.length; i < ie; ++i) {
    var a = document.createElement('a');
    a.appendChild(document.createTextNode(data[i]));
      
    var li = document.createElement('li');
    li.appendChild(a);

    ul.appendChild(li);
  }
}

function getHistoryItems(callback) {
  var maxResults = 100;
  var microsecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
  var microsecondsPerHour = 1000 * 10 * 60;
  var oneWeekAgo = (new Date).getTime() - microsecondsPerWeek;
  var oneHourAgo = (new Date).getTime() - microsecondsPerHour;

  chrome.history.search({
      'text'      : '',
      'startTime' : oneHourAgo,
      'maxResults': maxResults
    },
    callback);
}

function getVisits(historyItems, callback) {
    var numRequestsOutstanding = historyItems.length;
    var expectedAncestors = {};
    var nodes = {};
    var trees = [];

    var processVisits = function(url, visitItems) {

        // disable this URL for debug reasons
        if (url == 'chrome-extension://fmalidfielikedelgijoglpchhholnkh/main.html') {
            --numRequestsOutstanding;
            return;
        }
        
        for (var i = 0; i < visitItems.length;  i++) {
            var visitItem = visitItems[i];

            if (visitItem.transition == "reload") {
                continue;
            }

            var newNode = {
                children : [],
                url : url
            };

            nodes[visitItem.visitId] = newNode;

            // link with ancestor
            var ancestorId = visitItem.referringVisitId;

            if (ancestorId == "0") {
                // this node has no ancestor
                trees.push(newNode);
            } else {
                var ancestorNode = nodes[ancestorId];
                if (ancestorNode) {
                    // 1)ancestor already exists
                    ancestorNode.children.push(newNode);
                } else {
                    // 2)make ancestor expected by it's children
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
            console.log(nodes);
            console.log(expectedAncestors);

            callback(trees);
        }
    };

    for (var i = 0; i < historyItems.length; ++i) {
        var url = historyItems[i].url;
        var processVisitsWithUrl = function(url) {
            return function(visitItems) {
                processVisits(url, visitItems);
            };
        };
        chrome.history.getVisits(
            {url: url},
            processVisitsWithUrl(url));
    }

    if (!numRequestsOutstanding) {
        callback(trees);
    }
}

