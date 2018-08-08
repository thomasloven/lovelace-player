# lovelace-player

Lets any browser currently viewing your lovelace interface act as an audio
receiver with a `media_player` interface.

Example use case: An iPad mounted to your wall as a home automation dashboard,
can now receive text-to-speech announcements from home-assistant.

## Installation

1. Copy `lovelace-player.js` and `lovelace-player-config.js` to
   `<ha config>/www/lovelace-player.js` and
   `<ha config>/www/lovelace-player-config.js`.

3. Download `floorplan_speaker.py` from
   [pkozul/ha-floorplay-kiosk](https://github.com/pkozul/ha-floorplan-kiosk) to
   `<ha config>/custom_components/media_player/floorplay_speaker.py`

4. Add a `media_player` to your home assistant config

```yaml
media_player:
  - platform: floorplan_speaker
    name: my_lovelace_player
```

5. Add the `.js` files as resources in `ui-lovelace.yaml`

```yaml
resources:
  - url: /local/lovelace-player.js
    type: js
  - url: /local/lovelace-player-config.js
    type: js
```

5. On the device you wish to use as a receiver, browse to your lovelace UI.
   You'll find that the main title of the page has been replaced with the words
   `LovelacePlayer Device ID:` followed by a hexadecimal number on the form
   `xxxxxxxx-xxxxxxxx`. This is your Device ID.

6. Bind your device to the `media_player` by editing
   `lovelace-player-config.js`. Also remove or comment out the line
   `LovelacePlayer.showDeviceId();` to restore the lovelace main title.

```js
setTimeout(function() {

  // Add your bindings here
  LovelacePlayer.bind("media_player.my_lovelace_player", "xxxxxxxx-xxxxxxxx");

  // Remove this line when you found your Device ID
  // LovelacePlayer.showDeviceId();
}, 200);
```

## Notes:

- You will probably need to somehow invalidate your browser cache after any
  change to `lovelace-player-config.js`. If you're not using
  [lovelace-gen](http://github.com/thomasloven/homeassistant-lovelace-gen),
  which handles that automatically via the `!resource` directive, this can be
  done by adding `?number` after the filename in the resource list of
  `ui-lovelace.yaml` - where `number` is a number which you increment after
  each change.

- The Device ID is a random number that is generated the first time you view
  the lovelace UI in a new browser after installing lovelace-player. It is
  stored in your browsers localStorage and *cannot* be accessed or used to
  identify your browser by any other website. This is not true for Fully Kiosk
  Browser for Android.

- If your media player suddenly stops working one day, it might be because the
  localStorage has somehow gotten reset. I have no idea how, when or even if
  this might happen, but if it does, you will need to find the new Device ID by
  readding `LovelacePlayer.showDeviceId()` to `lovelace-player-config.js` and
  updating the bindings.

- Refreshing or closing the page will stop playback without reporting the
  status change back to home-assistant. Switching view within lovelace should
  not stop playback.
