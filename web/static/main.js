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
setAlert();


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

data2.get('dashConfig').then(function (doc) {
  dashConfig = doc;
  delay = dashConfig.delay;
  restore();
}).catch(function (err) {
  console.log(err);
});


// Listen for each intermediate path components URLs and flash
// $.each(keys, function(_, key) {
//     data.child(key).child('urls').on("value", function(snapshot) {
//         var u = snapshot.val();
//         if (Object.prototype.toString.call(u) == '[object Array]') {
//             urls[key] = u;
//         } else {
//             delete urls[key];
//         }
//         restore();
//         if (!tvMode && key == pathKey && !snapshot.hasChildren()) {
//             // Show settings when current path is empty
//             $('#settings').show();
//         }
//     }, function (err) {
//         console.log("Database read failed: " + err.code);
//         restore();
//     });
// });

$('#customize').on('click', function() {
    $('#settings').toggle();
});

$('#urls').on('click', 'button.remove', function() {
    var i = $(this).parent().data('i');
    urls[pathKey].splice(i, 1);
    save(urls, pathKey);
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
            if (!urls[pathKey]) {
                urls[pathKey] = [];
            }
            urls[pathKey].push(url);
            save();
            $(this).val('');
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
            save();
        } else {
            $(this).addClass('error');
        }
    }
});

$('#flash-severity').on('change', function(e) {
    data2.get('flash').then(function (flash) {
      console.log('Severity Set 1');
      console.log(flash);
      flash.flashSeverity = $('#flash-severity').val();
      data2.put(flash).then(function (flash) {
        console.log(flash);
        setAlert();
      });
    }).then(function () {
    }).then(function () {

    })
});

$('#flash-message').on('keyup', function(e) {
    if (e.which == 13) {
        data2.get('flash').then(function (flash) {
          flash.flashMessage = $('#flash-message').val();
          data2.put(flash).then(function (flash) {
            console.log(flash);
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

function save() {
    $("#settings *").prop('disabled', true);
    data2.get('urlList').then(function (urlList) {
      urlList.url = urls[pathKey];
      data2.put(urlList);
    }).then(function () {
    }).then(function (doc) {
    })
    data2.get('dashConfig').then(function (dashConfig) {
      dashConfig.delay = delay;
      data2.put(dashConfig);
    }).then(function () {
    }).then(function (doc) {
    })
}

function restore() {
    setTimeout(function(){
    }, 3000);
    $('#urls').empty();
    $('#delay').prop('disabled', false).val(delay / 1000);
    $('#add').prop('disabled', false);
    mergedURLs = []
    data2.get('urlList').then(function (doc) {
      $.each(doc.url, function(i, url) {
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
  data2.get('flash').then(function (flash) {
    console.log(flash);
    flashSeverity = flash.flashSeverity;
    flashMessage = flash.flashMessage
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
