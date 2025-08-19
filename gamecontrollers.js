/*
 * Below originates from https://github.com/luser/gamepadtest/
 * 
 */
var haveEvents = 'GamepadEvent' in window;
var haveWebkitEvents = 'WebKitGamepadEvent' in window;
var gamePads_debug = true;
var gamePads_updateIndex = 0;
var gamePads_data = [];
var gamePads_data_previous = {};
var gamePads_index2use = -1;
var rAF = window.mozRequestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.requestAnimationFrame;

class GamePadData {
  update_index = -1;

  gamepad_index = -1;

  high_precision_origin = null;
  high_precision_timestamp = null;
  origin_utc = null;
  time_utc = null;

  buttons_changes = {};
  buttons_changed_count = 0;
  axes_changes = {};
  axes_changed_count = 0;
  
  constructor(updateIndex, gamepad_prev, gamepad_next) {
    this.update_index = updateIndex;
    if (gamepad_next) {
      this.gamepad_index = gamepad_next.index;

      this.high_precision_origin = performance.timeOrigin;
      this.high_precision_timestamp = gamepad_next.timestamp;
      var timestamp = gamepad_next.timestamp + performance.timeOrigin;
      var date_origin = new Date(this.high_precision_origin);
      this.origin_utc = date_origin.toISOString();
      var asDate = new Date(timestamp);
      this.time_utc = asDate.toISOString();

      for (var i=0; i<gamepad_next.buttons.length; i++) {
        var button_values = gamepad_next.buttons[i];
        var prev_value = (gamepad_prev) ? gamepad_prev.buttons[i].value : null; 
        if (null == prev_value || 0.00001 < Math.abs(button_values.value - prev_value)) {
          this.buttons_changes[i] = button_values.value;
          this.buttons_changed_count++;
        }
      }
      for (var i=0; i<gamepad_next.axes.length; i++) {
        var axis_value = gamepad_next.axes[i];
        var prev_value = (gamepad_prev) ? gamepad_prev.axes[i] : null; 
        if (null == prev_value || 0.00001 < Math.abs(axis_value - prev_value)) {
          this.axes_changes[i] = axis_value;
          this.axes_changed_count++;
        }
      }
    }
  }
};

function connecthandler(e) {
  if (gamePads_debug) console.log("connecthandler: e=" + e);
  addgamepad(e.gamepad);
}
function addgamepad(gamePad) {
  if (gamePads_debug) console.log("addgamepad: gamePad.index=" + gamePad.index);
  gamePads_index2use = gamePad.index;

  rAF(updateStatus);
}

function disconnecthandler(e) {
  if (gamePads_debug) console.log("disconnecthandler: e=" + e);

  removegamepad(e.gamepad);
}

function removegamepad(gamepad) {
  if (gamePads_debug) console.log("removegamepad: gamePad.index=" + gamepad.index);

  if (0 <= gamePads_index2use)
    if (gamepad.index == gamePads_index2use)
      gamePads_index2use = -1;
  
}

function updateStatus() {

//  if (gamePads_debug && gamePads_updateIndex%1000==0) console.log("updateStatus: update#" + gamePads_updateIndex);

  var gamePads = getGamePads();
  for (j in gamePads) {
    var gamePad = gamePads[j];
    if (gamePad) {
      var gamePad_index = gamePad.index;
      if (gamePad_index == gamePads_index2use) {
        var data_previous = gamePads_data_previous[gamePad_index];
        var data_current = new GamePadData(gamePads_updateIndex, data_previous, gamePad);
        gamePads_data_previous[gamePad_index] = gamePad;
        if(0 < data_current.buttons_changed_count || 0 < data_current.axes_changed_count) {
          gamePads_data.push(data_current);
          if (gamePads_debug) console.log("updateStatus: update#" + gamePads_updateIndex + ", data=" + JSON.stringify(data_current));
        }
      }
    }
  }
  gamePads_updateIndex++;
  rAF(updateStatus);
}

function getGamePads() {
//  if (gamePads_debug && gamePads_updateIndex%1000==0) console.log("getGamePads: update#" + gamePads_updateIndex);

  var gamePads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
  return gamePads;
}

if (haveEvents) {
  window.addEventListener("gamepadconnected", connecthandler);
  window.addEventListener("gamepaddisconnected", disconnecthandler);
} else if (haveWebkitEvents) {
  window.addEventListener("webkitgamepadconnected", connecthandler);
  window.addEventListener("webkitgamepaddisconnected", disconnecthandler);
} else {
  setInterval(scangamepads, 500);
}