/*
 * Below originates from https://github.com/luser/gamepadtest/
 * 
 */
var gamePads_haveEvents = 'GamepadEvent' in window;
var gamePads_haveWebkitEvents = 'WebKitGamepadEvent' in window;
var gamePads_debug = false;
var gamePads_updateIndex = 0;
var gamePads_index2use = -1;
var gamePads_previous = {};
var gamePadData_changes = [];
var gamePadData_changesCallback = null;
var gamePads_rAF = window.mozRequestAnimationFrame ||
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
  
  constructor(updateIndex, gamepad_previous, gamepad_next) {
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
        var button_value = gamepad_next.buttons[i].value;
        var prev_value = (gamepad_previous) ? gamepad_previous.button_values[i] : null; 
        if (null == prev_value || 0.00001 < Math.abs(button_value - prev_value)) {
          this.buttons_changes[i] = button_value;
          this.buttons_changed_count++;
        }
      }
      for (var i=0; i<gamepad_next.axes.length; i++) {
        var axis_value = gamepad_next.axes[i];
        var prev_value = (gamepad_previous) ? gamepad_previous.axes_values[i] : null; 
        if (null == prev_value || 0.00001 < Math.abs(axis_value - prev_value)) {
          this.axes_changes[i] = axis_value;
          this.axes_changed_count++;
        }
      }
    }
  }
};

function gamePads_connecthandler(e) {
  if (gamePads_debug) console.log("gamePads_connecthandler: e=" + e);
  gamePads_addgamepad(e.gamepad);
}
function gamePads_addgamepad(gamePad) {
  if (gamePads_debug) console.log("gamePads_addgamepad: gamePad.index=" + gamePad.index);
  gamePads_index2use = gamePad.index;

  gamePads_rAF(gamePads_updateStatus);
}

function gamePads_disconnecthandler(e) {
  if (gamePads_debug) console.log("gamePads_disconnecthandler: e=" + e);

  gamePads_removegamepad(e.gamepad);
}

function gamePads_removegamepad(gamepad) {
  if (gamePads_debug) console.log("gamePads_removegamepad: gamePad.index=" + gamepad.index);

  if (0 <= gamePads_index2use)
    if (gamepad.index == gamePads_index2use)
      gamePads_index2use = -1;
  
}

function gamePadPartialClone(gamePad) {
  var button_values = [];
  var axes_values = [];

  if (gamePad) {
      for (var i=0; i<gamePad.buttons.length; i++) {
        var button_value = gamePad.buttons[i].value;
        button_values[i] = button_value;
      }
      for (var i=0; i<gamePad.axes.length; i++) {
        var axis_value = gamePad.axes[i];
        axes_values[i] = axis_value;
      }
  }
  clone = { 'button_values' : button_values, 'axes_values' : axes_values }
  return clone;
}

function gamePads_updateStatus() {

//  if (gamePads_debug && gamePads_updateIndex%1000==0) console.log("gamePads_updateStatus: update#" + gamePads_updateIndex);

  var gamePads = getGamePads();
  for (j in gamePads) {
    var gamePad = gamePads[j];
    if (gamePad) {
      var gamePad_index = gamePad.index;
      if (gamePad_index == gamePads_index2use) {
        var gamePad_previous = gamePads_previous[gamePad_index];
        var gamePad_changes = new GamePadData(gamePads_updateIndex, gamePad_previous, gamePad);
        gamePads_previous[gamePad_index] = gamePadPartialClone(gamePad);
        if(0 < gamePad_changes.buttons_changed_count || 0 < gamePad_changes.axes_changed_count) {
          gamePadData_changes.push(gamePad_changes);
          if (gamePads_debug) console.log("gamePads_updateStatus: update#" + gamePads_updateIndex + ", changes=" + JSON.stringify(gamePad_changes));
          if (gamePadData_changesCallback) {
            gamePadData_changesCallback();
          }
        }
      }
    }
  }
  gamePads_updateIndex++;
  gamePads_rAF(gamePads_updateStatus);
}

function getGamePads() {
//  if (gamePads_debug && gamePads_updateIndex%1000==0) console.log("getGamePads: update#" + gamePads_updateIndex);

  var gamePads = navigator.getGamepads ? navigator.getGamepads() : (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);
  return gamePads;
}


if (gamePads_haveEvents) {
  window.addEventListener("gamepadconnected", gamePads_connecthandler);
  window.addEventListener("gamepaddisconnected", gamePads_disconnecthandler);
} else if (gamePads_haveWebkitEvents) {
  window.addEventListener("webkitgamepadconnected", gamePads_connecthandler);
  window.addEventListener("webkitgamepaddisconnected", gamePads_disconnecthandler);
} else {
  alert("Sorry, your browser doesnt seem to support gamepad events."); 
}