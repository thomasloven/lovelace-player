// https://github.com/thomasloven/lovelace-player
// version 0.0.1
const thisScript = document.currentScript;
customElements.whenDefined('card-tools').then(() => {

  let cardTools = customElements.get('card-tools');
  let args = cardTools.args(thisScript);

  if(args['getID'] !== undefined) {
    let message = document.createElement('ha-card');
    message.innerHTML = `${cardTools.deviceID}`;
    cardTools.popUp('Device ID', message);
  }

  // Check if this browser is registered to a player
  let myPlayer = '';
  Object.keys(args).forEach( (k) => {
    if (args[k] === cardTools.deviceID)
      myPlayer = k;
  });
  if (!myPlayer) return;

  cardTools.logger(`Lovelace-player: registered browser to ${myPlayer}`, thisScript);

  let playing = false;
  let audio = new Audio();

  cardTools.hass.connection.subscribeEvents((ev) => {
    if (ev.data.domain != 'media_player') return;
    let targets = ev.data.service_data.entity_id;
    if (!Array.isArray(targets)) targets = Array(targets);
    if (targets.indexOf(myPlayer) < 0) return;

    if (ev.data.service === 'media_play_pause')
      ev.data.service = (playing) ? 'media_pause' : 'media_play';
    switch (ev.data.service) {
      case 'play_media':
      case 'media_play':
        let src = ev.data.service_data.media_content_id;
        if(src)
          audio.src = src;
        playing = true;
        audio.play();
        break;
      case 'media_pause':
      case 'media_stop':
        playing = false;
        audio.pause();
        break;
      case 'volume_set':
        audio.volume = ev.data.service_data.volume_level;
        break;
    }

    let attr = Object.assign(cardTools.hass.states[myPlayer].attributes, {
      volume_level: audio.volume,
      media_content_id: audio.src || "",
      device_id: cardTools.deviceID,
    });
    cardTools.hass.callApi('post', "fully_kiosk/media_player/"+myPlayer, {
      state: (playing) ? 'playing' : 'idle',
      attributes: attr,
    });

  }, 'call_service');

});
