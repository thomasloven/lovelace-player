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

  _subscribe = function(hass) {
    if (_subscribed) { return; }
    _audio = new Audio();
    _subscribed = true;
    hass.connection.subscribeEvents((event) => {
      if(event.data.domain != 'media_player') { return; }
      let targets = event.data.service_data.entity_id;
      if(!Array.isArray(targets)) { targets = Array(targets); }
      let istarget = _players.some(r => targets.indexOf(r) >= 0);
      if(!istarget) { return; }
      switch(event.data.service) {
        case 'play_media':
          _audio.src = event.data.service_data.media_content_id;
          _playing = true;
          _audio.play();
          break;
        case 'media_play':
          _playing = true;
          _audio.play();
          break;
        case 'media_play_pause':
          if(_playing) {
            _playing = false;
            _audio.pause();
            break;
          }
          _playing = true;
          _audio.play();
          break;
        case 'media_pause':
        case 'media_stop':
          _playing = false;
          _audio.pause();
          break;
        case 'volume_set':
          _audio.volume = event.data.service_data.volume_level;
          break;
      }
      _updateState(hass);
    }, 'call_service');
  };

  _updateState = function(hass) {
    _players.forEach(p => {
      hass.callApi('post', "fully_kiosk/media_player/"+p, {
        state: _playing? "playing":"idle",
        attributes: {
          volume_level: _audio.volume,
          media_content_id: _audio.src,
          address: null,
          battery_level: null,
          screen_brightness: null,
          device_id: _getDeviceId(),
          serial_number: 0,
        },
      });
    });
  };

  return {
    bind : (media_player, device) => {
      if(device != _getDeviceId()) { return; }
      _players.push(media_player);
      _subscribe(document.querySelector('home-assistant').hass);
    },
    showDeviceId: () => {
      document.querySelector("home-assistant").shadowRoot.querySelector("home-assistant-main").shadowRoot.querySelector("app-drawer-layout iron-pages partial-panel-resolver").shadowRoot.querySelector("#panel ha-panel-lovelace").shadowRoot.querySelector("hui-root").shadowRoot.querySelector("ha-app-layout app-header app-toolbar div[main-title]").innerHTML = "LovelacePlayer Device ID: " +_getDeviceId();
    }
  };
}());
