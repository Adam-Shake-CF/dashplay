var data2 = new PouchDB('http://localhost:5984/dashplay');

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


function getAllDash() {
  $('#accordion').html("");
  data2.allDocs({
    include_docs: true
  }).then(function (response) {
    console.log(response);

    $.each(response.rows, function(index, value) {

      var newDiv2 = "";
      if (value.doc.flash.flashMessage && value.doc.flash.flashSeverity === "info") {
        newDiv2 += '<div class="panel panel-primary">';
      }else if (value.doc.flash.flashMessage && value.doc.flash.flashSeverity === "success") {
        newDiv2 += '<div class="panel panel-success">';
      }else if (value.doc.flash.flashMessage && value.doc.flash.flashSeverity === "warning") {
        newDiv2 += '<div class="panel panel-warning">';
      }else if (value.doc.flash.flashMessage && value.doc.flash.flashSeverity === "alert") {
        newDiv2 += '<div class="panel panel-danger">';
      }else{
        newDiv2 += '<div class="panel panel-default">';
      }
      newDiv2 += '<div class="panel-heading" role="tab" id="Heading' + value.doc._id + '">';
      newDiv2 += '<h4 class="panel-title">';
      newDiv2 += '<a role="button" data-toggle="collapse" data-parent="#accordion" href="#' + value.doc._id + '" aria-expanded="true" aria-controls="' + value.doc._id + '">';
      if (value.doc.flash.flashMessage) {
        newDiv2 += value.doc._id + "     Flash Message:" + value.doc.flash.flashMessage;
      }else{
        newDiv2 += value.doc._id
      }
      newDiv2 += '</a>';
      newDiv2 += '</h4>';
      newDiv2 += '</div>';
      newDiv2 += '<div id="' + value.doc._id + '" class="panel-collapse collapse" role="tabpanel" aria-labelledby="Heading' + value.doc._id + '">';
      newDiv2 += '<div class="panel-body">';
      newDiv2 += '    <div>Delay: <input id="delay" value=' + value.doc.dashConfig.delay / 1000 + '> seconds</div>'
      newDiv2 += '    <div>Flash Info:'
      newDiv2 += '        <select id="flash-severity">'
      newDiv2 += '            <option value="info">info</option>'
      newDiv2 += '            <option value="success">success</option>'
      newDiv2 += '            <option value="warning">warning</option>'
      newDiv2 += '            <option value="alert">alert</option>'
      newDiv2 += '        </select>'
      newDiv2 += '        <input id="flash-message" placeholder="Flash info message">'
      newDiv2 += '    </div>'
      newDiv2 += '    <div id="urls">'
      $.each(value.doc.urlList.url, function(index, value) {
        newDiv2 += "<p>";
        newDiv2 += value;
        newDiv2 += "</p>";
      })
      newDiv2 += '</div>'
      newDiv2 += '    <input type="text" id="add" class="url" placeholder="Enter a dashboard URL">'
      newDiv2 += "</div>";
      newDiv2 += "</div>";
      newDiv2 += "</div>";




      var newDiv = "";
      if (value.doc.flash.flashMessage && value.doc.flash.flashSeverity === "info") {
        newDiv += '<div class="panel panel-primary">';
      }else if (value.doc.flash.flashMessage && value.doc.flash.flashSeverity === "success") {
        newDiv += '<div class="panel panel-success">';
      }else if (value.doc.flash.flashMessage && value.doc.flash.flashSeverity === "warning") {
        newDiv += '<div class="panel panel-warning">';
      }else if (value.doc.flash.flashMessage && value.doc.flash.flashSeverity === "alert") {
        newDiv += '<div class="panel panel-danger">';
      }else{
        newDiv += '<div class="panel panel-default">';
      }
      newDiv += '<div class="panel-heading" role="tab" id="Heading' + value.doc._id + '">';
      newDiv += '<h4 class="panel-title">';
      newDiv += '<a role="button" data-toggle="collapse" data-parent="#accordion" href="#' + value.doc._id + '" aria-expanded="true" aria-controls="' + value.doc._id + '">';
      if (value.doc.flash.flashMessage) {
        newDiv += value.doc._id + "     Flash Message:" + value.doc.flash.flashMessage;
      }else{
        newDiv += value.doc._id
      }
      newDiv += '</a>';
      newDiv += '</h4>';
      newDiv += '</div>';
      newDiv += '<div id="' + value.doc._id + '" class="panel-collapse collapse" role="tabpanel" aria-labelledby="Heading' + value.doc._id + '">';
      newDiv += '<div class="panel-body">';
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
    newDiv += "</div>";
    newDiv += "</div>";
    $('#accordion').append(newDiv2);
    })
    //$('#accordion').append(newDiv);

    setTimeout(getAllDash, 500000);
  }).catch(function (err) {
    console.log(err);
  });
}
