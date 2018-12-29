// https://github.com/thomasloven/lovelace-player
// version 0.0.1
var LovelacePlayer = LovelacePlayer || (function() {
  var _players = [];
  var _subscribed = false;
  var _audio;
  var _playing = false;

  _getDeviceId = function() {
    if(window['fully'] && typeof fully.getDeviceId === "function")
      return fully.getDeviceId();
    if(!localStorage['lovelace-player-device-id'])
    {
      function s4() {
        return Math.floor((1+Math.random())*100000).toString(16).substring(1);
      }
      localStorage['lovelace-player-device-id'] = s4()+s4()+'-'+s4()+s4();
    }
    return localStorage['lovelace-player-device-id'];
  };

  _play = function(src) {
    if(src)
      _audio.src = src;
    _playing = true;
    _audio.play();
    _updateState();
  };
  _pause = function(src) {
    _playing = false;
    _audio.pause();
    _updateState();
  };

  _subscribe = function() {
    if (_subscribed) { return; }
    _audio = new Audio();
    _subscribed = true;
    _audio.addEventListener('ended', LovelacePlayer.pause);
    _updateState();
    hass = document.querySelector('home-assistant').hass;
    hass.connection.subscribeEvents((event) => {
      if(event.data.domain != 'media_player') { return; }
      let targets = event.data.service_data.entity_id;
      if(!Array.isArray(targets)) { targets = Array(targets); }
      let istarget = _players.some(r => targets.indexOf(r) >= 0);
      if(!istarget) { return; }
      switch(event.data.service) {
        case 'play_media':
          _play(event.data.service_data.media_content_id);
          break;
        case 'media_play':
          _play();
          break;
        case 'media_play_pause':
          if(_playing) {
            _pause();
            break;
          }
          _play();
          break;
        case 'media_pause':
        case 'media_stop':
          _pause();
          break;
        case 'volume_set':
          _audio.volume = event.data.service_data.volume_level;
          break;
      }
    }, 'call_service');
  };

  _updateState = function() {
    hass = document.querySelector('home-assistant').hass;
    _players.forEach(p => {
      let attr = Object.assign(hass.states[p].attributes, {
          volume_level: _audio.volume,
          media_content_id: _audio.src,
          device_id: _getDeviceId(),
      });
      hass.callApi('post', "fully_kiosk/media_player/"+p, {
        state: _playing? "playing":"idle",
        attributes: attr,
      });
    });
  };

  return {
    bind : (media_player, device) => {
      if(device != _getDeviceId()) { return; }
      _players.push(media_player);
      _subscribe(document.querySelector('home-assistant').hass);
    },
    debug: () => {
      let message = "";
      _players.forEach(p => { message = message + " " + p; });
      if (message === "") message = "NONE";
      document
        .querySelector("home-assistant")
        .shadowRoot.querySelector("home-assistant-main")
        .shadowRoot.querySelector("app-drawer-layout partial-panel-resolver")
        .shadowRoot.querySelector("#panel ha-panel-lovelace")
        .shadowRoot.querySelector("hui-root")
        .shadowRoot.querySelector("ha-app-layout app-header app-toolbar div[main-title]")
        .innerHTML = "LovelacePlayer Device ID: " +_getDeviceId() + "<br/>Bound to: " + message;
    },
    play: (src) => { _play(src); },
    pause: () => { _pause(); },
  };
}());
