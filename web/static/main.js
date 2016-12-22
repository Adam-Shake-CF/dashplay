var path = document.location.pathname.substr(1);
var tvMode = path[path.length-1] == '+' && !!(path = path.substr(0, path.length-1));
var pause = false;
var data2 = new PouchDB('http://localhost:5984/dashplay');
var dashConfig;
var urlList;
var urls = {};
var urlre = /^https?:\/\/.+\..+/;
var delay = 10000;
var mergedURLs = [];
var currentURL = 0;
var next;
var removeUrl;

var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};


var urlParam = getUrlParameter('dash');
//setAlert();
getAllDash();

data2.get(urlParam).then(function (doc) {
  urls = doc.urlList.url;
}).catch(function (err) {
  console.log(err);
});

$('#createNewDash').on("click", function() {
  var dashName = $('#dashName').val();
  createNewDashboard(dashName);
  alert('Complete');
})

if (tvMode) {
    $('#customize').hide();
}

// Reload the whole page every day so the browser to prevent
// browser from dying under memory pressure.
setTimeout(function() {location.reload()}, 86400000);

var keys = [];
for (var i = 0, pos = 0, t = path.length; pos != -1; i++) {
    pos = path.indexOf('/', pos+1);
    keys[i] = btoa(path.substr(0, pos >= 0 ? pos : path.length));
}
// Full path key
var pathKey = keys[keys.length-1];

// Listens for the path's delay setting

data2.get(urlParam).then(function (doc) {
  dashConfig = doc.dashConfig;
  delay = dashConfig.delay;
  restore();
}).catch(function (err) {
  console.log(err);
});

$('#customize').on('click', function() {
    $('#settings').toggle();
});

$('#urls').on('click', 'button.remove', function() {
    var removeUrl = $(this).parent().data('i');
    data2.get(urlParam).then(function (urlParam) {
      urls = urlParam.urlList.url;
      urls.splice(removeUrl, 1)
      saveDelete(urls, pathKey);
    });
});

$('#urls').on('keyup', 'input.edit', function(e) {
    if (e.which == 13) {
        var i = $(this).parent().data('i');
        var url = $(this).val();
        if (urlre.test(url) && i >= 0) {
            urls[pathKey][i] = url;
            save();
        } else {
            $(this).addClass('error');
        }
    }
});

$('#add').on('keyup', function(e) {
    $(this).removeClass('error');
    if (e.which == 13) {
        var url = $(this).val();
        if (urlre.test(url)) {
            save(url);
        } else {
            $(this).addClass('error');
        }
    }
});

$('#delay').on('keyup', function(e) {
    $(this).removeClass('error');
    if (e.which == 13) {
        var d = $(this).val();
        if (d == parseInt(d, 10) && d > 0) {
            delay = d * 1000;
            saveDelay();
        } else {
            $(this).addClass('error');
        }
    }
});

$('#flash-severity').on('change', function(e) {
    data2.get(urlParam).then(function (urlParam) {
      console.log('Severity Set 1');
      console.log(urlParam);
      urlParam.flash.flashSeverity = $('#flash-severity').val();
      data2.put(urlParam).then(function (urlParam) {
        console.log(urlParam);
        setAlert();
      });
    }).then(function () {
    }).then(function () {

    })
});

$('#flash-message').on('keyup', function(e) {
    if (e.which == 13) {
        data2.get(urlParam).then(function (urlParam) {
          urlParam.flash.flashMessage = $('#flash-message').val();
          data2.put(urlParam).then(function (urlParam) {
            console.log(urlParam);
            setAlert();
          });
        }).then(function () {
        }).then(function () {
        })
    }
});

$('.tv-link').attr('href', location.href + '+');
$('.tv-link').on('click', function(e) {
    window.open(this.href, location.href, 'status=0,location=1,scrollbars=0,width=1280,height=720');
    e.preventDefault();
});

$('.pause-link').on('click', function(e) {
    pause = !pause;

    if (!pause) {
        e.target.text = 'Pause';
        loadNext();
    } else {
        e.target.text = 'Unpause';
    }

    e.preventDefault();
});

function save(url) {
  $("#settings *").prop('disabled', true);
  data2.get(urlParam).then(function (urlParam) {
    urlParam.urlList.url.push(url);
    data2.put(urlParam).then(function (urlParam) {
      restore();
    });
  })
}

function saveDelay() {
  data2.get(urlParam).then(function (urlParam) {
    urlParam.dashConfig.delay = delay;
    data2.put(urlParam).then(function (urlParam) {
      restore();
    });
  })
}

function saveDelete(urls) {
  $("#settings *").prop('disabled', true);
  data2.get(urlParam).then(function (urlParam) {
    urlParam.urlList.url = urls;
    data2.put(urlParam).then(function (urlParam) {
      restore();
    });
  })
}

function restore() {
    setTimeout(function(){
    }, 3000);
    $('#urls').empty();
    $('#add').val("");
    $('#delay').prop('disabled', false).val(delay / 1000);
    $('#add').prop('disabled', false);
    $("#settings *").prop('disabled', false);
    doc = {};
    mergedURLs = [];
    data2.get(urlParam).then(function (doc) {
      $.each(doc.urlList.url, function(i, url) {
        $('#urls').append(
            $('<div>').data('i', i).append(
                $('<input type="text" class="edit url">').attr('value', url),
                $('<button class="remove">✕</button>')
            )
        );
        mergedURLs.push(url);
      });
      $('#urls').scrollTop($('#urls').prop("scrollHeight"));
    }).then(function () {
      restart();
    }).catch(function (err) {
      console.log(err);
    });
}

function restart() {
    currentURL = 0;
    $('#display').empty();
    loadNext();
}

function setAlert() {
  console.log(flash);
  data2.get(urlParam).then(function (urlParam) {
    console.log(flash);
    flashSeverity = urlParam.flash.flashSeverity;
    flashMessage = urlParam.flash.flashMessage
    if (flashSeverity && flashMessage) {
        $('#flash').text(flashMessage).addClass('open');
        $('#flash').toggleClass('info', !flashSeverity || flashSeverity == 'info')
        $('#flash').toggleClass('success', flashSeverity == 'success')
        $('#flash').toggleClass('warning', flashSeverity == 'warning')
        $('#flash').toggleClass('alert', flashSeverity == 'alert')
    } else {
        $('#flash').removeClass('open');
    }
    if (flash) {
      console.log(flash);
        $('#flash-severity').val(flashSeverity);
        $('#flash-message').val(flashMessage);
    }
  }).then(function (flash) {
  })
}

function loadNext() {
    clearTimeout(next);
    if (mergedURLs.length == 0) {
        // Nothing to show, maybe next time
        $('#display').empty();
        return;
    }

    if (pause) {
        return;
    }

    var current = $('#display iframe');
    var url = mergedURLs[currentURL++ % mergedURLs.length];
    var iframe = $('<iframe>').attr('src', url);
    $('#display').append(iframe);
    if (current.length != 0) {
        iframe.css('opacity', 0.00001); // some browsers won't layout the page if not shown
    } else {
        // First time display
        $('#current_url').text(url).fadeIn(500).delay(2000).fadeOut(500);
    }
    next = setTimeout(function() {
        if (current.length != 0 && mergedURLs.length > 1) {
            // Do not show the URL for the first page (done earlier) or if we are
            // cycling (reloading) on a single page
            $('#current_url').hide().text(url).fadeIn(500).delay(2000).fadeOut(500);
        }
        iframe.animate({opacity: 1}, 500, function() {
            current.attr('src', 'about:blank'); // Try to release memory
            current.remove();
            loadNext();
        });
    }, delay )
}

function createNewDashboard(name) {
  data2.put({
    "_id": name,
    "dashConfig": { "delay": 5000 },
     "flash": {"flashSeverity": "info", "flashMessage": "Test Test"},
     "urlList": { "url":
          ["url1", "url2", "url3"]}
  }).then(function (response) {
    data2.info();
  }).catch(function (err) {
    console.log(err);
  });
}

var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = decodeURIComponent(window.location.search.substring(1)),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : sParameterName[1];
        }
    }
};

function getAllDash() {
  $('#existingDash').html("");
  data2.allDocs({
    include_docs: true
  }).then(function (response) {
    console.log(response);
    $.each(response.rows, function(index, value) {
      var newDiv = "<div>";
      newDiv += "<h3>";
      newDiv += value.doc._id;
      newDiv += "</h3>";
      newDiv += "<p>";
      if (value.doc.flash.flashMessage) {
      newDiv += "Severity: " + value.doc.flash.flashSeverity;
      newDiv += "</p>";
      newDiv += "<p>";
      newDiv += "Message: " + value.doc.flash.flashMessage;
      newDiv += "</p>";

    }else{
      newDiv += "<p>No Flash Message</p>";
    }
    newDiv += "<p>";
    newDiv += "Delay: " + value.doc.dashConfig.delay / 1000 + " seconds";
    newDiv += "</p>";
    newDiv += "<p>";
    newDiv += "URLs: ";
    newDiv += "</p>";
    $.each(value.doc.urlList.url, function(index, value) {
      newDiv += "<p>";
      newDiv += value;
      newDiv += "</p>";
    })
    newDiv += "</div>";
    $('#existingDash').append(newDiv);
    })
    //$('#existingDash').append()

    setTimeout(getAllDash, 5000);
  }).catch(function (err) {
    console.log(err);
  });
}
