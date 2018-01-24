var labels = {{&labels}};
var game = {{&game}};
var machines = {{&machines}};
var left_players = {{&left_players}};
var right_players = {{&right_players}};
var curScore = -1;
var scores = [0,0,0,0];
var imageData;
var imageRot = 0;
var imageChanged = false;
var posChanged = false;
var scoreChanged = false;

var adjustScale = 1;
var adjustDeltaX = 0;
var adjustDeltaY = 0;

function sendChanges() {
  console.log("sendChanges() ...");
  var data = {};

  $('.edit').hide();
  $('.norm').show();

  var dirty = false;

  if(posChanged) {
console.log("posChanged:",posChanged);
    data.photo_rotation = imageRot;
    data.photo_scale    = adjustScale;
    data.photo_dx       = adjustDeltaX;
    data.photo_dy       = adjustDeltaY;
    dirty = true;
  }

  if(scoreChanged) {
console.log("scoreChanged:",scoreChanged);
    data.score_1 = scores[0];
    data.score_2 = scores[1];
    data.score_3 = scores[2];
    data.score_4 = scores[3];
    dirty = true;
  }
  console.log(data);

  if(imageChanged) {
    console.log("++ imageData len:",imageData.length);
    data.photo_data = imageData;
    dirty = true;
  }

  var info = getInfoChanges();
  if(info) {
console.log("infoChanged -> ",info);
    for(prop in info) {
      data[prop] = info[prop];
    }
    dirty = true;
  }

  if(curScore != -1) {
    $('#s'+(curScore+1)).removeClass('highlight');
    curScore = -1;
  }
  if(dirty) {
    sendData(data);
  }
  else {
    console.log("Nothing to change, consider tying enabled state of save to dirty.");
  }
}

function sendData(data) {
  if(!data) return;
  console.log("sendData...");
  console.log("length:",JSON.stringify(data).length);
  $.ajax({
    xhr: function() {
      var x = new XMLHttpRequest();
      $('.modal-cover').show();
      if(x.upload) {
        x.upload.onprogress = function(e) {
          console.log("prog:",e);
          if(e.lengthComputable) {
            var pct = 100 * e.loaded / e.total;
            $('#progress').css('width',pct+'%');
          }
        }
      }
      return x;
    },
    url: '/games/{{key}}.{{round}}.{{n}}/report',
    data: data,
    method: 'POST',
    success: function(data) {
      console.log("... send successful");
      console.log(data);
      $('.modal-cover').hide();

      game = data;
      setValues();
      showSuccess();
    }
    // TODO: Use a timeout to close the save dialog
    // TODO: Close the save dialog on errors, maybe show the error
  });
}

function showSuccess() {
  var $elm = $('#success');
  $elm.show();
  //Unless we use a short timeout, the transition
  //fails to trigger, and end style instantly shows up.
  setTimeout(function() {
    $elm.addClass('success-end');
    setTimeout(function() {
      $elm.removeClass('success-end');
      $elm.hide();
      $('#progress').css('width','0%');
    }, 1010);
  }, 5);
  console.log(Date.now(),"end of showSuccess");
}

function getInfoChanges() {
  var $m = $('#machine');

  //Gather up the data to send.
  var data = {
    machine: $('#machine').val(),
    player_1: $('#player_1').val(),
    player_2: $('#player_2').val()
  }
  var orig = {
    machine: game.machine,
    player_1: game.player_1,
    player_2: game.player_2
  }
  {{#doubles}}
  data.player_3 = $('#player_3').val();
  data.player_4 = $('#player_4').val();
  orig.player_3 = game.player_3,
  orig.player_4 = game.player_4
  {{/doubles}}
  // console.log("data:",data);

  if(JSON.stringify(orig) == JSON.stringify(data)) {
    console.log("stringify: orig == data, bailing out.");
    //We don't need to do anything.
    return;
  }
  return data;
}

var curImageUrl;

function loadThumb(url) {
  if(curImageUrl == url) {
    console.log("Already loaded " +url);
    return;
  }
  curImageUrl = url;
console.log("Trying to load thumb: " +url);
  $.ajax({
    xhr: function() {
      var x = new XMLHttpRequest();
      x.onprogress = function(e) {
        console.log("prog:",e);
        if(e.lengthComputable) {
          var pct = 100 * e.loaded / e.total;
          // $('#progress').css('width',pct+'%');
          // TODO: Just let the image fill in as it loads.
        }
      }
      return x;
    },
    url: url,
    success: function(data) {
console.log("success!",data.length);
      // $('#progress').css('width','0%');
      setImageData(data);
      // transformPhoto();
    },
    error: function(xhr, status, err) {
      // $('#progress').css('width','0%');
      console.log(status,err);
    }
  });
}

var currentScale = 1;
var currentDeltaX = 0;
var currentDeltaY = 0;

/**
Some pan and zoom code found here:
https://gist.github.com/synthecypher/f778e4f5a559268a874e
NOTE: This found code doesn't work very well for our
purposes. Need to change to make more sense for the user.
*/

function setupImageController() {
  var frame = document.getElementById('canvas');
  var mc = new Hammer.Manager(frame);
  var pinch = new Hammer.Pinch();
  var pan = new Hammer.Pan();
  pinch.recognizeWith(pan);
  mc.add([pinch,pan]);

  // Handles pinch and pan events/transforming at the same time;
  mc.on("pinch pan", function (ev) {
    // Adjusting the current pinch/pan event properties using the previous ones set when they finished touching
    currentScale = adjustScale * ev.scale;
    currentDeltaX = adjustDeltaX + (ev.deltaX / currentScale);
    currentDeltaY = adjustDeltaY + (ev.deltaY / currentScale);
    posChanged = true;
    drawImage();
  });

  mc.on("panend pinchend", function (ev) {
    // Saving the final transforms for adjustment next time the user interacts.
    adjustScale = currentScale;
    adjustDeltaX = currentDeltaX;
    adjustDeltaY = currentDeltaY;
    $('#save-icon').show();
  });
}

function setImageData(data) {
console.log("setImageData()...");
  resizeImage(data, function(resized) {
    imageData = resized;
    renderImage();
    $('#canvas').show();
    $('#cell-left').show();
    $('#cell-right').show();
  });
}

function resizeImage(data, callback) {
  var img = document.createElement('img');
  img.onload = function() {
    console.log('Loaded img:', img.width, img.height);
    var maxWidth = 1024;
    if(img.width < maxWidth) return callback(data);
    var ratio = maxWidth / img.width;
    var canvas = document.createElement('canvas');
    canvas.width = img.width * ratio;
    canvas.height = img.height * ratio;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    callback(canvas.toDataURL());
  };
  img.src = data;
}

var imgElm;
function setupImage() {
  imgElm = document.createElement('img');
  imgElm.onload = function() {
    drawImage();
  };
}

function renderImage() {
  if(!imgElm) setupImage();
  imgElm.src = imageData;
}

function drawImage() {
  var img = imgElm;
  var MAX_WIDTH = 300;
  var MAX_HEIGHT = 188;

  var canvas = document.getElementById('canvas');
  var ctx = canvas.getContext('2d');
  var ang = (imageRot + 360) % 360;

  var w = img.width;
  var h = img.height;

  canvas.width  = MAX_WIDTH;
  canvas.height = MAX_HEIGHT;

  var flip = (ang == 90 || ang == 270);
  var dx = flip ? h/2 : w/2;
  var dy = flip ? w/2 : h/2;

  //Calc scale factor.
  var scale = 1;
  if(flip) {
    if(w > h) {
// console.log("Case 1: flip,w>h,",MAX_HEIGHT + " / " + w);
      scale = MAX_HEIGHT / w;
    }
    else {
// console.log("Case 2: flip,h>=w,",MAX_WIDTH + " / " + h);
      scale = MAX_WIDTH / h;
    }
  }
  else {
    if(w > h) {
// console.log("Case 3: w>h,",MAX_WIDTH + " / " + w);
      scale = MAX_WIDTH / w;
    }
    else {
// console.log("Case 4: h>=w,",MAX_HEIGHT + " / " + h);
      scale = MAX_HEIGHT / h;
    }
  }
  // console.log("ang:",ang,"flip:",flip,"w:",w,"h:",h,"dx:",dx,"dy:",dy,"scale:",scale);

  scale *= currentScale;
  dx    += currentDeltaX;
  dy    += currentDeltaY;
  // console.log("trans -> scale:",scale,"dx:",dx,"dy:",dy);
  //TODO: Clamp dx and dy to meaningful range.

  ctx.scale(scale,scale);
  ctx.translate(dx, dy);
  ctx.rotate(ang * Math.PI / 180);
  ctx.translate(-w/2, -h/2);
  ctx.drawImage(img, 0, 0, w, h);
  // var dataUrl = canvas.toDataURL("image/jpg");
  // console.log("imageData: ",imageData.length);
  // console.log("dataURL:   ",dataUrl.length);
}

function rotatePhoto(degrees) {
  imageRot += degrees;
  imageRot = imageRot % 360;
console.log("rotatePhoto("+degrees+") -> " +imageRot);
  posChanged = true;
  $('#save-icon').show();
  drawImage();
}

function preview(files) {
console.log("preview(), files.length:",files.length);
  for (var i = 0; i < files.length; i++) {
    var file = files[i];
    var imageType = /^image\//;

    if (!imageType.test(file.type)) {
      continue;
    }
    var reader = new FileReader();
    reader.onload = function(e) {
      //Reset transform values for new images.
      imageRot     = 0;
      adjustScale  = 1;
      adjustDeltaX = 0;
      adjustDeltaY = 0;
      setImageData(e.target.result);
      //TODO: We should do sha or md5 to compare imageData
      imageChanged = true;
      $('#save-icon').show();
    };
    reader.readAsDataURL(file);
  }
}

function navigate(url) {
  var modified = imageChanged || posChanged || scoreChanged;
  if(modified) {
    if(window.confirm("Are you sure you want to leave? You will lose your changes")) {
      window.location=url;
    }
    else {
    }
  }
  else {
    window.location=url;
  }
}

function setValues() {
  scores = [
    game.score_1 || 0,
    game.score_2 || 0,
    game.score_3 || 0,
    game.score_4 || 0
  ];

  if(game.photos && game.photos.length > 0) {
    var ph = game.photos[0];
    loadThumb(ph.url);

    imageRot = ph.rot || 0;
    adjustScale = ph.scale || 1;
    adjustDeltaX = ph.dx || 0;
    adjustDeltaY = ph.dy || 0;

    currentScale = adjustScale;
    currentDeltaX = adjustDeltaX;
    currentDeltaY = adjustDeltaY;
  }

  $('#machine-label').text(labels[game.machine]);

  $('#p1').text(labels[game.player_1]);
  $('#p2').text(labels[game.player_2]);
  if(game.score_1 > 0) {
    $('#s1').text(numeral(game.score_1).format());
    $('#s1').addClass('recorded');
  }
  if(game.score_2 > 0) {
    $('#s2').text(numeral(game.score_2).format());
    $('#s2').addClass('recorded');
  }
  $('#pnts1').text(numeral(game.points_1).format('0.0'));
  $('#pnts2').text(numeral(game.points_2).format('0.0'));

  {{#doubles}}
  $('#p3').text(labels[game.player_3]);
  $('#p4').text(labels[game.player_4]);
  if(game.score_3 > 0) {
    $('#s3').text(numeral(game.score_3).format());
    $('#s3').addClass('recorded');
  }
  if(game.score_4 > 0) {
    $('#s4').text(numeral(game.score_4).format());
    $('#s4').addClass('recorded');
  }
  $('#pnts3').text(numeral(game.points_3).format('0.0'));
  $('#pnts4').text(numeral(game.points_4).format('0.0'));

  $('#s13').text(numeral(game.score_13).format());
  $('#p13').text(numeral(game.points_13).format('0.0'));
  $('#s24').text(numeral(game.score_24).format());
  $('#p24').text(numeral(game.points_24).format('0.0'));
  {{/doubles}}

  {{#shared}}
  $('#p3').text(labels[game.player_3]);
  $('#p4').text(labels[game.player_4]);
  {{/shared}}

  imageChanged = false;
  posChanged = false;
  scoreChanged = false;
  $('#save-icon').hide();
}

function numTapped(n) {
  var i = curScore;
  if(i == -1) return;
  if(n == -1) {
    var s = '' + scores[i];
    scores[i] = numeral().unformat(s.substring(0,s.length-1));
  }
  else {
    var s = scores[i];
    scores[i] = numeral().unformat(s + '' + n);
  }
  var $elm = $('#s'+(i+1));
  $elm.text(numeral(scores[i]).format());
  $elm.removeClass('recorded');
  scoreChanged = true;
  $('#save-icon').show();
}

function advanceHighlight() {
// console.log("advance:",curScore);
  if(curScore < scores.length - 1) {
    highlightScore(curScore + 1);
  }
}

function retreatHighlight() {
  // console.log("retreat:",curScore);
  if(curScore > 0) {
    highlightScore(curScore - 1);
  }
}

function highlightScore(n) {
// console.log("highlight, curScore:",curScore,"n:",n);
  if(curScore != -1) {
    //Unhighlight the old one.
    var $old = $('#s'+(curScore+1));
    $old.removeClass('highlight');
    if(scores[curScore] == 0) {
      $old.text('Player ' + (curScore+1) + ' Score');
    }
  }
  curScore = n;
  $('#s'+(n+1)).addClass('highlight');
}

function makeSelect(name, options, selected) {
  var html = '<select id="' +name+ '" class="custom-select">';
  for(var i = 0; i < options.length; i++) {
    var opt = options[i];
    var value = opt.value || opt;
    var label = opt.label || labels[opt];
    if(label.length > 10) {
      label = label.substring(0,10);
    }
    var sel = opt == selected ? ' selected' : '';
    html += '<option value="' +value+ '"' +sel+ '>' +label+ '</option>';
  }
  html += '</select>';
  return html;
}

$(document).ready(function() {
console.log("Document ready...");

  $(document).keydown(function(e) {
    var x = e.which;
    if(x > 47 && x < 58) {
      var n = x - 48;
      numTapped(n);
    }
    else if(x == 8 || x == 37) {
      numTapped(-1);
    }
    else if(x == 9) {
      if(e.shiftKey) {
        retreatHighlight();
      }
      else {
        advanceHighlight();
      }
      e.preventDefault();
    }
  });

  {{#editable}}
  $('.num').on('touchstart mousedown',function(e) {
    $(this).addClass('num-press');
  });

  $('.num').on('touchend mouseup',function(e) {
    $(this).removeClass('num-press');
    var x = $(this).text();
    if(x == '<-') {
      numTapped(-1);
    }
    else if(x == '000') {
      numTapped(0); numTapped(0); numTapped(0);
    }
    else {
      numTapped(parseInt(x));
    }
    e.preventDefault();
  });

  $('#edit-machine').html(
    makeSelect('machine',machines, game.machine)
  );
  $('#edit-p1').html(
    makeSelect('player_1',left_players, game.player_1)
  );
  $('#edit-p2').html(
    makeSelect('player_2',right_players, game.player_2)
  );
  $('#edit-p3').html(
    makeSelect('player_3',left_players, game.player_3)
  );
  $('#edit-p4').html(
    makeSelect('player_4',right_players, game.player_4)
  );
  $('.score').click(function() {
  // $('.score').on('touchend mouseup',function(e) {
    var n = parseInt(this.id.substring(1,2)) - 1;
    highlightScore(n);
  });
  $('#edit-on').show();

  $('#edit-on').click(function() {
    $('.norm').hide();
    $('.edit').show();
  });
  $('#save-icon').click(function() {
    sendChanges();
  });
  setupImageController();

  $('select').change(function() {
    $('#save-icon').show();
  });

  //NOTE: TEST TEST TEST
  // $('#zoom').keyup(function() {
  //   var v = $(this).val();
  //   v = parseFloat(v);
  //   console.log("zoom -> " +v);
  //   currentScale = v;
  //   adjustScale = v;
  //   renderImage();
  // });
  //  END TEST

  {{/editable}}

  setValues();
});

/*
Image preview example:
https://developer.mozilla.org/en-US/docs/Using_files_from_web_applications
https://hacks.mozilla.org/2011/01/how-to-develop-a-html5-image-uploader/
*/
