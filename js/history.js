
// params:
//  startTime
function getHistoryNodesTree(params, callback)  {
    getHistoryNodesDict(
        params,
        function(historyNodesDict) {
            callback(createHistoryNodesTree(historyNodesDict));
        }
    )
}

// params:
//  startTime
function getHistoryNodesDict(params, callback) {
    var historyNodesDict = {};
    var outstandingRequests = 0;

    (function getHistoryItems() {
        chrome.history.search(
            {
                'text' : '',
                'startTime' : params.startTime,
                'maxResults': 100
            },
            processHistoryItems);
    })();

    function processHistoryItems(historyItems) {
        outstandingRequests = historyItems.length;
        historyItems.forEach(function(historyItem) {
            chrome.history.getVisits(
                {
                    url: historyItem.url
                },
                function (visitItems) {
                    appendVisitItems(historyItem, visitItems);
                    outstandingRequests--;
                    tryToReturn();
                });
        });
        tryToReturn();
    }
    
    function appendVisitItems(historyItem, visitItems) {
        visitItems.forEach(function(visitItem) {
            historyNodesDict[visitItem.visitId] =
            {
                    'id'               : visitItem.id,
                    'visitId'          : visitItem.visitId,
                    'referringVisitId' : visitItem.referringVisitId,
                    'transition'       : visitItem.transition,
                    'name'             : historyItem.title,
                    'data'             : {
                        'src'          : historyItem.url,
                        'visitTime'    : visitItem.visitTime,
                        'transition'   : visitItem.transition
                    },
                    'children'         : []
             }
        });
    }

    function tryToReturn() {
        if (outstandingRequests == 0) {
            callback(historyNodesDict);
        }
    }
}

function createHistoryNodesTree(historyNodesDict) {
    
    historyNodesDict['0'] =
    {
        'id'       : 0,
        'name'     : 'Peacock',
        'children' : []
    }

    for (var visitId in historyNodesDict) {
        if (visitId == 0) {
            continue;
        }

        var node = historyNodesDict[visitId];
        var ancestorId;

        switch (node.transition) {

        case 'reload':
        case 'link':
            /*
            if (node.referringVisitId == '0') {
                ancestorId = node.visitId - 1;
            } else {
                ancestorId = node.referringVisitId;
            }
            */
            ancestorId = node.referringVisitId;
            break;

        default:
            ancestorId = '0'; // root
        }

        if (historyNodesDict[ancestorId]) {
            historyNodesDict[ancestorId].children.push(node);
        }
    }

    return historyNodesDict['0'];
}